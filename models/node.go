package models

import (
	"errors"
	"fmt"
	"io"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	log "github.com/sirupsen/logrus"

	"github.com/aerospike-community/amc/common"
	"github.com/aerospike-community/amc/rrd"
)

type NodeStatus string
type NodeVisibilityStatus string
type XDRStatus string

var nodeStatus = struct {
	On, Off NodeStatus
}{
	"on", "off",
}

var xdrStatus = struct {
	On, Off XDRStatus
}{
	"on", "off",
}

var nodeVisibilityStatus = struct {
	On, Off NodeVisibilityStatus
}{
	"on", "off",
}

type Node struct {
	cluster   *Cluster
	_origNode common.SyncValue //*as.Node
	origHost  *as.Host

	status  common.SyncValue //NodeStatus
	visible common.SyncValue //NodeVisibilityStatus

	namespaces common.SyncValue //map[string]*Namespace

	// latestInfo, oldInfo common.SyncInfo
	latestInfo        common.SyncInfo
	latestConfig      common.SyncStats
	latestNodeLatency common.SyncValue //map[string]common.SyncStats

	stats, nsAggStats common.SyncStats
	nsAggCalcStats    common.SyncStats

	// statsHistory is allocated on new and never written to.
	// hence it does not need syncronization.
	statsHistory   map[string]*rrd.Bucket
	latencyHistory *rrd.SimpleBucket

	serverTimeDelta common.SyncValue //time.Duration

	_alertStates common.SyncStats
}

var _recordedNodeStats = [...]string{
	"stat_read_success", "stat_read_reqs",
	"stat_write_success", "stat_write_reqs",

	"batch_read_success", "batch_read_reqs",

	"scan_success", "scan_reqs",
	"query_success", "query_reqs",

	"xdr_read_success", "xdr_read_reqs",
	"xdr_write_success", "xdr_write_reqs",

	"udf_success", "udf_reqs",
}

func newNode(cluster *Cluster, origNode *as.Node) *Node {
	var host *as.Host
	if origNode != nil {
		host = origNode.GetHost()
	}

	lh := rrd.NewSimpleBucket(cluster.UpdateInterval(), 3600)

	node := &Node{
		cluster:         cluster,
		_origNode:       common.NewSyncValue(origNode),
		origHost:        host,
		status:          common.NewSyncValue(nodeStatus.On),
		namespaces:      common.NewSyncValue(map[string]*Namespace{}),
		latencyHistory:  lh,
		_alertStates:    *common.NewSyncStats(common.Stats{}),
		serverTimeDelta: common.NewSyncValue(time.Duration(0)),
	}

	statsHistory := make(map[string]*rrd.Bucket, len(_recordedNodeStats))
	for _, stat := range _recordedNodeStats {
		statsHistory[stat] = rrd.NewBucket(node.cluster.UpdateInterval(), 3600, true)
	}
	node.statsHistory = statsHistory

	return node
}

func (n *Node) valid() bool {
	origNode := n._origNode.Get()
	return origNode != nil && origNode.(*as.Node).IsActive()
}

func (n *Node) setUpdateInterval(val int) {
	for _, b := range n.statsHistory {
		b.SetResolution(val)
	}

	for _, ns := range n.Namespaces() {
		ns.setUpdateInterval(val)
	}
}

func (n *Node) update() error {
	defer n.notifyAboutChanges()
	defer n.updateHistory() // always update the stats; when node is down, the stats will be zero

	if !n.valid() {
		n.setStatus(nodeStatus.Off)
		log.Warningf("Node %s is not active.", n.origHost)
		return nil
	}
	n.setStatus(nodeStatus.On)

	tm := time.Now()

	if err := n.updateNamespaceNames(); err != nil {
		n.setStatus(nodeStatus.Off)
		log.Warningf("Node %s is not active.", n.origHost)
		return err
	}

	// retry 3 times
	info, err := n.RequestInfo(3, n.infoKeys()...)
	if err != nil {
		n.setStatus(nodeStatus.Off)
		return err
	}

	n.setInfo(common.Info(info))
	n.setConfig(n.InfoAttrs("get-config:").ToInfo("get-config:"))

	n.setStatus(nodeStatus.On)

	var latencyMap map[string]common.Stats
	var nodeLatency map[string]common.Stats

	infoLatency, err := n.RequestInfo(3, n.infoLatencyKeys()...)
	if err != nil {
		n.setStatus(nodeStatus.Off)
		return err
	}

	build := n.Build()
	if build == common.NOT_AVAILABLE || strings.Compare(build, "5.1") < 1 {
		latencyMap, nodeLatency = n.parseLatencyInfo(infoLatency["latency:"])
	} else {
		latencyMap, nodeLatency = n.parseLatenciesInfo(infoLatency["latencies:"])
	}
	n.setNodeLatency(nodeLatency)

	nsAggStats := common.Stats{}
	nsAggCalcStats := common.Stats{}
	for _, ns := range n.Namespaces() {
		ns.update(n.InfoAttrs("namespace/"+ns.name, "sets/"+ns.name, "get-config:context=namespace;id="+ns.name))
		ns.updateIndexInfo(n.Indexes(ns.name))
		ns.updateLatencyInfo(latencyMap[ns.name])
		ns.aggStats(nsAggStats, nsAggCalcStats)

		// update node's server time
		n.setServerTimeDelta(ns.ServerTime().Unix())
	}

	stats := common.Info(info).ToInfo("statistics").ToStats()
	n.setStats(stats, nsAggStats, nsAggCalcStats)

	log.Debugf("Updating Node: %v, build: %s, objects: %v, took: %s", n.Id(), n.Build(), stats.TryInt("objects", 0), time.Since(tm))

	return nil
}

func (n *Node) notifyAboutChanges() {
	go n.updateNotifications()
}

func (n *Node) applyStatsToAggregate(stats, calcStats common.Stats) {
	n.stats.AggregateStatsTo(stats)
	n.nsAggCalcStats.AggregateStatsTo(calcStats)
}

func (n *Node) applyNsStatsToAggregate(stats, calcStats map[string]common.Stats) {
	for k, ns := range n.Namespaces() {
		if stats[k] == nil {
			stats[k] = common.Stats{}
		}
		if calcStats[k] == nil {
			calcStats[k] = common.Stats{}
		}

		ns.aggStats(stats[k], calcStats[k])
	}
}

func (n *Node) applyNsSetStatsToAggregate(stats map[string]map[string]common.Stats) map[string]map[string]common.Stats {
	for nsName, ns := range n.Namespaces() {
		setsInfo := ns.SetsInfo()

		if stats[nsName] == nil {
			stats[nsName] = setsInfo
			continue
		}

		for setName, setInfo := range setsInfo {
			if stats[nsName][setName] == nil {
				stats[nsName][setName] = setInfo
				continue
			}

			stats[nsName][setName].AggregateStats(setInfo)
		}
	}

	return stats
}

func (n *Node) RequestInfo(reties int, cmd ...string) (result map[string]string, err error) {
	if len(cmd) == 0 {
		return map[string]string{}, nil
	}

	origNode := n.origNode()
	if origNode == nil {
		return map[string]string{}, fmt.Errorf("Failed to request info. Node %q is not active", *n.origHost)
	}

	for i := 0; i < reties; i++ {
		client := n.cluster.origClient()
		timeout := client.Cluster().ClientPolicy().Timeout

		infoPolicy := &as.InfoPolicy{Timeout: timeout}
		result, err = origNode.RequestInfo(infoPolicy, cmd...)
		if err == nil {
			return result, nil
		}
		// TODO: only retry for EOF or Timeout errors
	}

	return result, err
}

func (n *Node) updateNamespaceNames() error {
	namespaceListMap, err := n.RequestInfo(3, "namespaces")
	if err != nil {
		return err
	}

	namespacesStr := namespaceListMap["namespaces"]
	namespaces := strings.Split(namespacesStr, ";")

	namespaceMap := make(map[string]*Namespace, len(namespaces))
	currentNamespaces := n.Namespaces()
	for _, nsName := range namespaces {
		if namespace := currentNamespaces[nsName]; namespace == nil {
			namespaceMap[nsName] = NewNamespace(n, nsName)
		} else {
			namespaceMap[nsName] = namespace
		}
	}
	n.namespaces.Set(namespaceMap)

	return nil
}

func (n *Node) LatestLatency() map[string]common.Stats {
	res := n.latestNodeLatency.Get()
	if res == nil {
		return nil
	}
	return res.(map[string]common.Stats)
}

func (n *Node) LatencySince(tms string) []map[string]common.Stats {
	tm := n.ServerTime().Add(-time.Minute * 30)
	// if len(tms) > 0 {
	// 	if v, err := n.latencyDateTime(tms); err == nil && v.After(tm) {
	// 		tm = v
	// 	}
	// }

	vs := n.latencyHistory.ValuesSince(tm)
	vsTyped := make([]map[string]common.Stats, len(vs))
	for i := range vs {
		if vIfc := vs[i]; vIfc != nil {
			if v, ok := vIfc.(*interface{}); ok {
				vsTyped[i] = (*v).(map[string]common.Stats)
			}
		}
	}

	return vsTyped
}

func (n *Node) LatestThroughput() map[string]map[string]*common.SinglePointValue {
	// statsHistory is not written to, so it doesn't need synchronization
	res := make(map[string]map[string]*common.SinglePointValue, len(n.statsHistory))
	zeroVal := float64(0)
	for name, bucket := range n.statsHistory {
		if n.valid() {
			val := bucket.LastValue()
			if val == nil {
				tm := n.ServerTime().Unix()
				val = common.NewSinglePointValue(&tm, &zeroVal)
			}
			res[name] = map[string]*common.SinglePointValue{
				n.Address(): val,
			}
		} else {
			tm := n.ServerTime().Unix()
			val := common.NewSinglePointValue(&tm, &zeroVal)
			res[name] = map[string]*common.SinglePointValue{
				n.Address(): val,
			}
		}
	}

	return res
}

func (n *Node) ThroughputSince(tm time.Time) map[string]map[string][]*common.SinglePointValue {
	// statsHistory is not written to, so it doesn't need synchronization
	res := make(map[string]map[string][]*common.SinglePointValue, len(n.statsHistory))
	zeroVal := float64(0)
	st := n.ServerTime().Unix()
	for name, bucket := range n.statsHistory {
		vs := bucket.ValuesSince(tm)
		if len(vs) == 0 {
			vs = []*common.SinglePointValue{common.NewSinglePointValue(&st, &zeroVal)}
		}

		res[name] = map[string][]*common.SinglePointValue{
			n.Address(): vs,
		}
	}

	return res
}

func (n *Node) getStatsHistory(stat string) *rrd.Bucket {
	// statsHistory is not written to, so it doesn't need synchronization
	return n.statsHistory[stat]
}

func (n *Node) updateHistory() {
	active := n.valid()

	// this uses a RLock, so we put it before the locks to avoid deadlock
	// latestLatencyReport, err := n.latestLatencyReportDateTime()
	tm := n.ServerTime()
	if tm.IsZero() {
		return
	}

	for _, stat := range _recordedNodeStats {
		bucket := n.getStatsHistory(stat)
		if active {
			if n.nsAggCalcStats.Get(stat) != nil {
				bucket.Add(tm.Unix(), n.nsAggCalcStats.TryFloat(stat, 0))
			} else if n.stats.Get(stat) != nil {
				bucket.Add(tm.Unix(), n.stats.TryFloat(stat, 0))
			}
		} else {
			bucket.Skip(tm.Unix())
		}
	}

	if active {
		if ll := n.LatestLatency(); ll != nil {
			n.latencyHistory.Add(tm.Unix(), ll)
		}
	}
	// n.latencyHistory.Add(latestLatencyReport.Unix(), n.LatestLatency())
}

// func (n *Node) latestLatencyReportDateTime() (time.Time, error) {
// 	var latTime string
// 	for _, stats := range n.LatestLatency() {
// 		latTime = stats.TryString("timestamp", "")
// 		break
// 	}

// 	return n.latencyDateTime(latTime)
// }

// // adds date part to the latency time string
// func (n *Node) latencyDateTime(ts string) (time.Time, error) {
// 	log.Debugf("trying to parse: %s", ts)

// 	const layout = "2006-1-2 15:04:05-MST"

// 	if len(ts) == 0 {
// 		// return zero value
// 		return time.Time{}, nil
// 	}

// 	// // remove the timezone if exists
// 	// if len(ts) > 8 {
// 	// 	ts = ts[:8]
// 	// }

// 	// means there is no server time yet
// 	st := n.ServerTime()
// 	if st.IsZero() {
// 		return st, nil
// 	}

// 	// beginning of day
// 	t := st.Truncate(24 * time.Hour)
// 	year, month, day := t.Date()

// 	t2, err := time.Parse(layout, fmt.Sprintf("%d-%d-%d ", year, month, day)+ts)
// 	if err != nil {
// 		log.Debug("DATE PARSE ERROR! ", err)
// 		return t2, err
// 	}

// 	// must not be in the future
// 	if t2.After(st) {
// 		// format for yesterday
// 		time.Parse(layout, fmt.Sprintf("%d-%d-%d ", year, month, day-1)+ts)
// 	}
// 	return t2, nil
// }

func (n *Node) XdrEnabled() bool {
	return n.StatsAttr("xdr_uptime") != nil
}

func (n *Node) XdrConfig() common.Stats {
	return n.InfoAttrs("get-config:context=xdr").ToInfo("get-config:context=xdr").ToStats()
}

func (n *Node) XdrStats() common.Stats {
	return n.InfoAttrs("statistics/xdr").ToInfo("statistics/xdr").ToStats()
}

func (n *Node) XdrStatus() XDRStatus {
	if n.latestConfig.TryString("enable-xdr", "") != "true" {
		return xdrStatus.Off
	}
	return xdrStatus.On
}

func (n *Node) SwitchXDR(on bool) error {
	return n.SetXDRConfig("enable-xdr", on)
}

func (n *Node) SetXDRConfig(name string, value interface{}) error {
	cmd := fmt.Sprintf("set-config:context=xdr;%s=%v", name, value)

	res, err := n.RequestInfo(3, cmd)
	if err != nil {
		return err
	}

	errMsg, exists := res[cmd]
	if exists && strings.ToLower(errMsg) != "ok" {
		return errors.New(errMsg)
	}

	return nil
}

func (n *Node) infoLatencyKeys() []string {
	// latencies introduced in 5.1, latency was removed in version 5.2
	build := n.Build()
	res := []string{}

	if strings.Compare(build, "5.1") > 0 {
		res = append(res, "latencies:")
	} else {
		res = append(res, "latency:")
	}

	return res
}

func (n *Node) infoKeys() []string {
	res := []string{"node", "statistics", "features",
		"cluster-generation", "partition-generation", "build_time",
		"edition", "version", "build", "build_os", "bins", "jobs:",
		"sindex", "udf-list" /*"latency:", "latencies:",*/, "get-config:", "cluster-name",
		"service", "service-clear-std", "service-tls-std",
	}

	build := n.Build()

	if build != common.NOT_AVAILABLE {
		if strings.Compare(build, "5.0") > 0 {
			if n.Enterprise() {
				res = append(res, "get-config:context=xdr")
			}
		} else {
			if n.Enterprise() {
				res = append(res, "get-dc-config", "get-config:context=xdr", "statistics/xdr")
			}
		}
	}

	// add namespace stat requests
	for ns := range n.Namespaces() {
		res = append(res, "namespace/"+ns)
		res = append(res, "sets/"+ns)
		res = append(res, "get-config:context=namespace;id="+ns)
	}

	return res
}

func (n *Node) NamespaceByName(ns string) *Namespace {
	res := n.Namespaces()
	return res[ns]
}

func (n *Node) setStats(stats, nsStats, nsCalcStats common.Stats) {
	// alias stats
	stats["queue"] = stats.TryInt("tsvc_queue", 0)
	stats["cluster_name"] = n.InfoAttrs("cluster-name").TryString("cluster-name", "")
	stats["xdr_read_reqs"] =
		stats.TryInt("xdr_read_success", 0) +
			stats.TryInt("xdr_read_error", 0) +
			stats.TryInt("xdr_read_notfound", 0)
	if v := stats.Get("xdr_read_success"); v != nil {
		stats["free_dlog_pct"] = stats.Get("dlog_free_pct")
		stats["stat_recs_logged"] = stats.Get("dlog_logged")
		stats["stat_dlog_recs_overwritten"] = stats.Get("dlog_overwritten_error")
		stats["stat_recs_linkdown_processed"] = stats.Get("dlog_processed_link_down")
		stats["stat_recs_localprocessed"] = stats.Get("dlog_processed_main")
		stats["stat_recs_replprocessed"] = stats.Get("dlog_processed_replica")
		stats["stat_recs_relogged"] = stats.Get("dlog_relogged")
		stats["used_recs_dlog"] = stats.Get("dlog_used_objects")
		stats["local_recs_notfound"] = stats.Get("xdr_read_not_found")
		stats["failednode_sessions_pending"] = stats.Get("xdr_active_failed_node_sessions")
		stats["linkdown_sessions_pending"] = stats.Get("xdr_active_link_down_sessions")
		stats["esmt_ship_avg_comp_pct"] = stats.Get("xdr_ship_compression_avg_pct")
		stats["hotkeys_fetched"] = stats.Get("xdr_hotkey_fetch")
		stats["noship_recs_hotkey"] = stats.Get("xdr_hotkey_skip")
		stats["stat_recs_inflight"] = stats.Get("xdr_ship_inflight_objects")
		stats["stat_recs_outstanding"] = stats.Get("xdr_ship_outstanding_objects")
		stats["err_recs_dropped"] = stats.Get("xdr_queue_overflow_error")
		stats["read_threads_avg_processing_time_pct"] = stats.Get("xdr_read_active_avg_pct")
		stats["local_recs_error"] = stats.Get("xdr_read_error")
		stats["read_threads_avg_waiting_time_pct"] = stats.Get("xdr_read_idle_avg_pct")
		stats["local_recs_fetch_avg_latency"] = stats.Get("xdr_read_latency_avg")
		stats["dispatch_request_queue_used_pct"] = stats.Get("xdr_read_reqq_used_pct")
		stats["dispatch_request_queue_used"] = stats.Get("xdr_read_reqq_used")
		stats["dispatch_response_queue_used"] = stats.Get("xdr_read_respq_used")
		stats["local_recs_fetched"] = stats.Get("xdr_read_success")
		stats["transaction_queue_used_pct"] = stats.Get("xdr_read_txnq_used_pct")
		stats["transaction_queue_used"] = stats.Get("xdr_read_txnq_used")
		stats["stat_recs_relogged_incoming"] = stats.Get("xdr_relogged_incoming")
		stats["stat_recs_relogged_outgoing"] = stats.Get("xdr_relogged_outgoing")
		stats["esmt_bytes_shipped"] = stats.Get("xdr_ship_bytes")
		stats["xdr_deletes_shipped"] = stats.Get("xdr_ship_delete_success")
		stats["err_ship_server"] = stats.Get("xdr_ship_destination_error")
		stats["latency_avg_ship"] = stats.Get("xdr_ship_latency_avg")
		stats["err_ship_client"] = stats.Get("xdr_ship_source_error")
		stats["stat_recs_shipped_ok"] = stats.Get("xdr_ship_success")
		stats["stat_recs_shipped"] = stats.Get("xdr_ship_success")
		stats["cur_throughput"] = stats.Get("xdr_throughput")
		stats["noship_recs_uninitialized_destination"] = stats.Get("xdr_uninitialized_destination_error")
		stats["noship_recs_unknown_namespace"] = stats.Get("xdr_unknown_namespace_error")

		stats["esmt-bytes-shipped"] = stats.Get("esmt_bytes_shipped")
		stats["free-dlog-pct"] = stats.Get("free_dlog_pct")
		// stats["xdr_timelag"] = stats.Get("timediff_lastship_cur_secs")
	}

	n.stats.SetStats(stats)
	n.nsAggStats.SetStats(nsStats)
	n.nsAggCalcStats.SetStats(nsCalcStats)
}

func (n *Node) setConfig(stats common.Info) {
	lc := stats.ToStats()
	n.latestConfig.SetStats(lc)
}

func (n *Node) setNodeLatency(stats map[string]common.Stats) {
	n.latestNodeLatency.Set(stats)
}

func (n *Node) ConfigAttrs(names ...string) common.Stats {
	var res common.Stats
	if len(names) == 0 {
		res = n.latestConfig.Clone()
	} else {
		res = n.latestConfig.GetMulti(names...)
	}
	return res
}

func (n *Node) ConfigAttr(name string) interface{} {
	return n.latestConfig.Get(name)
}

func (n *Node) SetServerConfig(context string, config map[string]string) ([]string, error) {
	cmd := "set-config:context=" + context
	cmds := make([]string, 0, len(config))
	cmdMap := make(map[string]string, len(config))
	for parameter, value := range config {
		cmds = append(cmds, fmt.Sprintf("%s;%s=%s", cmd, parameter, value))
		cmdMap[fmt.Sprintf("%s;%s=%s", cmd, parameter, value)] = parameter
	}

	unsetParams := []string{}

	res, err := n.RequestInfo(3, cmds...)
	if err != nil {
		return unsetParams, err
	}

	errMsg := ""
	for cmd, err := range res {
		if strings.ToLower(err) != "ok" {
			errMsg += fmt.Sprintf("%s resulted in error '%s'\n", cmd, err)
			unsetParams = append(unsetParams, cmdMap[cmd])
		}
	}

	if len(errMsg) == 0 {
		return unsetParams, n.update()
	}

	return unsetParams, errors.New(errMsg)
}

func (n *Node) setInfo(stats common.Info) {
	// n.oldInfo = n.latestInfo
	n.latestInfo.SetInfo(stats)
}

func (n *Node) InfoAttrs(names ...string) common.Info {
	var res common.Info
	if len(names) == 0 {
		res = n.latestInfo.Clone()
	} else {
		res = n.latestInfo.GetMulti(names...)
	}
	return res
}

func (n *Node) InfoAttr(name string) string {
	res := n.latestInfo.Get(name)
	if res != nil {
		return res.(string)
	}
	return common.NOT_AVAILABLE
}

func (n *Node) InfoAttrFirstValidValueAmong(names ...string) string {
	for _, name := range names {
		res := n.latestInfo.Get(name)
		if res != nil {
			val, _ := res.(string)
			if strings.HasPrefix(strings.ToUpper(val), "ERROR") {
				continue
			}

			if len(val) > 0 {
				return val
			}
		}
	}

	return common.NOT_AVAILABLE
}

func (n *Node) AnyAttrs(names ...string) common.Stats {
	var res common.Stats
	res = make(common.Stats, len(names))
	for _, name := range names {
		if v := n.stats.Get(name); v != nil {
			res[name] = v
		} else if v := n.nsAggStats.Get(name); v != nil {
			res[name] = v
		} else if v := n.nsAggCalcStats.Get(name); v != nil {
			res[name] = v
		} else if v := n.latestInfo.Get(name); v != nil {
			res[name] = v
		} else if v := n.latestConfig.Get(name); v != nil {
			res[name] = v
		}
	}
	return res
}

func (n *Node) StatsAttrs(names ...string) common.Stats {
	var res common.Stats
	if len(names) == 0 {
		res = n.stats.Clone()
	} else {
		res = n.stats.GetMulti(names...)
	}
	return res
}

func (n *Node) StatsAttr(name string) interface{} {
	return n.stats.Get(name)
}

func (n *Node) Status() NodeStatus {
	return n.status.Get().(NodeStatus)
}

func (n *Node) Enterprise() bool {
	return strings.Contains(strings.ToLower(n.latestInfo.TryString("edition", "")), "enterprise")
}

func (n *Node) VisibilityStatus() NodeVisibilityStatus {
	res := nodeVisibilityStatus.On
	if n.Status() == nodeStatus.On && !n.valid() {
		res = nodeVisibilityStatus.Off
	}
	return res
}

func (n *Node) setStatus(status NodeStatus) {
	n.status.Set(status)
}

func (n *Node) Build() string {
	return n.InfoAttr("build")
}

func (n *Node) LatencyUnits() string {
	res := n.latestConfig.TryString("microsecond-histograms", "")
	if res == "true" {
		return "usec"
	}
	return "msec"
}

func (n *Node) Disk() common.Stats {
	return common.Stats{
		"used":             n.nsAggCalcStats.TryInt("used-bytes-disk", 0),
		"free":             n.nsAggCalcStats.TryInt("free-bytes-disk", 0),
		"used-bytes-disk":  n.nsAggCalcStats.TryInt("used-bytes-disk", 0),
		"free-bytes-disk":  n.nsAggCalcStats.TryInt("free-bytes-disk", 0),
		"total-bytes-disk": n.nsAggCalcStats.TryInt("total-bytes-disk", 0),
	}
}

func (n *Node) Memory() common.Stats {
	return common.Stats{
		"used":               n.nsAggCalcStats.TryInt("used-bytes-memory", 0),
		"free":               n.nsAggCalcStats.TryInt("free-bytes-memory", 0),
		"used-bytes-memory":  n.nsAggCalcStats.TryInt("used-bytes-memory", 0),
		"free-bytes-memory":  n.nsAggCalcStats.TryInt("free-bytes-memory", 0),
		"total-bytes-memory": n.nsAggCalcStats.TryInt("total-bytes-memory", 0),
	}
}

func (n *Node) DataCenters() map[string]common.Stats {
	if exists := n.latestInfo.Get("get-dc-config"); exists == nil {
		return nil
	}

	dcs := n.latestInfo.ToStatsMap("get-dc-config", "DC_Name", ":")
	for k, stats := range dcs {
		nodes := strings.Split(stats.TryString("Nodes", ""), ",")
		for i := range nodes {
			nodes[i] = strings.Replace(nodes[i], "+", ":", -1)
		}
		stats["Nodes"] = common.DeleteEmpty(nodes)
		stats["namespaces"] = common.DeleteEmpty(strings.Split(stats.TryString("namespaces", ""), ","))
		dcs[k] = stats

		if len(nodes) == 0 {
			delete(dcs, k)
		}
	}

	return dcs
}

func (n *Node) Namespaces() map[string]*Namespace {
	res := n.namespaces.Get()
	if res == nil {
		return map[string]*Namespace{}
	}
	return res.(map[string]*Namespace)
}

func (n *Node) NamespaceList() []string {
	namespaces := n.Namespaces()
	res := make([]string, 0, len(namespaces))
	for ns := range namespaces {
		res = append(res, ns)
	}
	return common.StrUniq(res)
}

func (n *Node) Jobs() map[string]common.Stats {
	return n.latestInfo.ToStatsMap("jobs:", "trid", ":")
}

func (n *Node) Indexes(namespace string) map[string]common.Info {
	indexes := n.latestInfo.ToInfoMap("sindex", "indexname", ":")
	if namespace == "" {
		return indexes
	}

	result := map[string]common.Info{}
	for idxName, idxInfo := range indexes {
		if idxInfo["ns"] == namespace {
			result[idxName] = idxInfo
		}
	}

	return result
}

func (n *Node) NamespaceIndexes() map[string][]string {
	indexes := n.latestInfo.ToInfoMap("sindex", "indexname", ":")
	result := map[string][]string{}
	for idxName, idxInfo := range indexes {
		if idxInfo != nil && idxInfo["ns"] != "" {
			result[idxInfo["ns"]] = append(result[idxInfo["ns"]], idxName)
		}
	}

	for k, v := range result {
		result[k] = common.StrUniq(v)
	}

	return result
}

func (n *Node) UDFs() map[string]common.Stats {
	return n.latestInfo.ToStatsMap("udf-list", "filename", ",")
}

func (n *Node) Address() string {
	if s := n.InfoAttrFirstValidValueAmong("service-tls-std", "service-clear-std", "service"); s != common.NOT_AVAILABLE {
		return s
	}
	h := *n.origHost
	return h.Name + ":" + strconv.Itoa(h.Port)
}

func (n *Node) Host() string {
	if s := n.InfoAttrFirstValidValueAmong("service-tls-std", "service-clear-std", "service"); s != common.NOT_AVAILABLE {
		host, _, err := common.SplitHostPort(s)
		if err == nil && len(host) > 0 {
			return host
		}
	}

	h := *n.origHost
	return h.Name
}

func (n *Node) Port() uint16 {
	if s := n.InfoAttrFirstValidValueAmong("service-tls-std", "service-clear-std", "service"); s != common.NOT_AVAILABLE {
		_, port, err := common.SplitHostPort(s)
		if err == nil {
			return uint16(port)
		}
	}

	h := *n.origHost
	return uint16(h.Port)
}

func (n *Node) Id() string {
	return n.InfoAttr("node")
}

func (n *Node) ClusterName() string {
	return n.InfoAttr("cluster-name")
}

func (n *Node) Bins() common.Stats {
	return parseBinInfo(n.InfoAttr("bins"))
}

func (n *Node) MigrationStats() common.Info {
	return n.InfoAttrs("migrate_msgs_sent", "migrate_msgs_recv", "migrate_progress_send",
		"migrate_progress_recv", "migrate_tx_objs", "migrate_rx_objs")
}

func (n *Node) setOrigNode(node *as.Node) {
	origNode := n._origNode.Get()
	if origNode != nil {
		origNode.(*as.Node).Close()
	}
	n._origNode.Set(node)
}

func (n *Node) origNode() *as.Node {
	origNode := n._origNode.Get()
	if origNode != nil {
		return origNode.(*as.Node)
	}

	return nil
}

func parseBinInfo(s string) common.Stats {
	res := common.Stats{}
	for {
		i := strings.Index(s, ":bin_names=")
		ns := s[:i]
		s = s[i+11:]

		i = strings.Index(s, ",bin_names_quota=")
		bnCount, _ := strconv.Atoi(s[:i])
		s = s[i+17:]

		noBins := false
		i = strings.Index(s, ",")
		if i < 0 {
			i = strings.Index(s, ";")
			noBins = true
		}
		bnQuota, _ := strconv.Atoi(s[:i])
		s = s[i+1:]

		binNames := []string{}
		if !noBins {
			n := 0
			for {
				i = strings.Index(s[n:], ";")
				sep := strings.Index(s[n:], ",")
				// `;` is part of the bin name
				n += i
				if i < sep {
					continue
				}
				break
			}

			binNames = strings.Split(s[:n], ",")
		}

		res[ns] = common.Stats{
			"bin_names":       bnCount,
			"bin_names_quota": bnQuota,
			"bins":            binNames,
		}

		if len(s) > i {
			s = s[i+1:]
		} else {
			break
		}
	}

	return res
}

func (n *Node) setServerTimeDelta(tm int64) {
	if tm > 0 && n.serverTimeDelta.Get().(time.Duration) == 0 {
		n.serverTimeDelta.Set(time.Duration(tm-time.Now().Unix()) * time.Second)
	}
}

func (n *Node) ServerTime() time.Time {
	serverTimeDelta := n.serverTimeDelta.Get().(time.Duration)
	return time.Now().Add(serverTimeDelta)
}

func (n *Node) parseLatencyInfo(s string) (map[string]common.Stats, map[string]common.Stats) {
	ip := common.NewInfoParser(s)

	//typical format is {test}-read:10:17:37-GMT,ops/sec,>1ms,>8ms,>64ms;10:17:47,29648.2,3.44,0.08,0.00;

	nodeStats := map[string]common.Stats{}
	res := map[string]common.Stats{}
	for {
		if err := ip.Expect("{"); err != nil {
			// it's an error string, read to next section
			if _, err := ip.ReadUntil(';'); err != nil {
				break
			}
			continue
		}

		ns, err := ip.ReadUntil('}')
		if err != nil {
			break
		}

		if err := ip.Expect("-"); err != nil {
			break
		}

		op, err := ip.ReadUntil(':')
		if err != nil {
			break
		}

		timestamp, err := ip.ReadUntil(',')
		if err != nil {
			break
		}

		if _, err := ip.ReadUntil(','); err != nil {
			break
		}

		bucketsStr, err := ip.ReadUntil(';')
		if err != nil {
			break
		}
		buckets := strings.Split(bucketsStr, ",")

		_, err = ip.ReadUntil(',')
		if err != nil {
			break
		}

		opsCount, err := ip.ReadFloat(',')
		if err != nil {
			break
		}

		valBucketsStr, err := ip.ReadUntil(';')
		if err != nil && err != io.EOF {
			break
		}
		valBuckets := strings.Split(valBucketsStr, ",")
		valBucketsFloat := make([]float64, len(valBuckets))
		for i := range valBuckets {
			valBucketsFloat[i], _ = strconv.ParseFloat(valBuckets[i], 64)
		}

		// calc precise in-between percents
		lineAggPct := float64(0)
		for i := len(valBucketsFloat) - 1; i > 0; i-- {
			lineAggPct += valBucketsFloat[i]
			valBucketsFloat[i-1] = math.Max(0, valBucketsFloat[i-1]-lineAggPct)
		}

		if len(buckets) != len(valBuckets) {
			log.Errorf("Error parsing latency values for node: `%s`. Bucket mismatch: buckets: `%s`, values: `%s`.", n.Address(), bucketsStr, valBucketsStr)
			break
		}

		for i := range valBucketsFloat {
			valBucketsFloat[i] *= opsCount
		}

		histUnit := "msec"

		stats := common.Stats{
			"tps":        opsCount,
			"timestamp":  timestamp,
			"histUnit":   histUnit,
			"buckets":    buckets,
			"valBuckets": valBucketsFloat,
		}

		if res[ns] == nil {
			res[ns] = common.Stats{
				op: stats,
			}
		} else {
			res[ns][op] = stats
		}

		// calc totals
		if nstats := nodeStats[op]; nstats == nil {
			nodeStats[op] = stats
		} else {
			if timestamp > nstats.TryString("timestamp", "") {
				nstats["timestamp"] = timestamp
			}

			nstats["tps"] = nstats.TryFloat("tps", 0) + opsCount
			nBuckets := nstats["buckets"].([]string)
			if len(buckets) > len(nBuckets) {
				nstats["buckets"] = append(nBuckets, buckets[len(nBuckets):]...)
				nstats["valBuckets"] = append(nstats["valBuckets"].([]float64), make([]float64, len(buckets[len(nBuckets):]))...)
			}

			nValBuckets := nstats["valBuckets"].([]float64)
			for i := range buckets {
				nValBuckets[i] += valBucketsFloat[i]
			}
			nstats["valBuckets"] = nValBuckets
			nodeStats[op] = nstats
		}
	}

	for _, nstats := range nodeStats {
		tps := nstats.TryFloat("tps", 0)
		if tps == 0 {
			tps = 1
		}
		nValBuckets := nstats["valBuckets"].([]float64)
		for i := range nValBuckets {
			nValBuckets[i] /= tps
		}
		nstats["valBuckets"] = nValBuckets
		nstats["timestamp_unix"] = n.ServerTime().Unix()
	}

	return res, nodeStats
}

func (n *Node) parseLatenciesInfo(s string) (map[string]common.Stats, map[string]common.Stats) {
	// log.Debugf("%s", s)
	nodeStats := map[string]common.Stats{}
	res := map[string]common.Stats{}

	// old typical format is {test}-read:10:17:37-GMT,ops/sec,>1ms,>8ms,>64ms;10:17:47,29648.2,3.44,0.08,0.00;
	// new typical format is {test}-write:msec,0.0,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00
	//			        histogramName_0:timeUnit,ops/sec,threshOld_0,threshOld_1,...;histogramName_1:...
	var myExp = regexp.MustCompile(`\{(?P<namespace>[[:alnum:]]+)\}-(?P<operation>[[:alpha:]]+):(?P<histUnit>[[:alpha:]]+),(?P<ops>[0-9]*\.?[0-9]+),(?P<vals>.*)`)

	rawHists := strings.Split(s, ";")
	for j := 0; j < len(rawHists); j++ {
		found := myExp.FindStringSubmatch(rawHists[j])

		// not a ops line or empty ops line
		if len(found) == 0 {
			continue
		}

		result := make(map[string]string)
		for i, name := range myExp.SubexpNames() {
			if i != 0 && name != "" {
				result[name] = found[i]
			}
		}

		ns := result["namespace"]
		op := result["operation"]
		histUnit := result["histUnit"]
		opsCount, err := strconv.ParseFloat(result["ops"], 64)
		if err != nil {
			continue
		}

		valBucketsStr := result["vals"]
		valBuckets := strings.Split(valBucketsStr, ",")
		valBucketsFloat := make([]float64, len(valBuckets))

		for i := range valBuckets {
			valBucketsFloat[i], _ = strconv.ParseFloat(valBuckets[i], 64)
		}

		bucketNumber := 0
		if histUnit == "msec" {
			bucketNumber = 7 // <1ms  to >64ms
			valBucketsFloat = valBucketsFloat[:bucketNumber]
		} else {
			bucketNumber = 15
		}

		buckets := make([]string, bucketNumber)
		for i := 0; i < bucketNumber; i++ {
			buckets[i] = fmt.Sprintf(">%d%s", 1<<i, strings.TrimSuffix(histUnit, "ec"))
		}

		// calc precise in-between percents
		lineAggPct := float64(0)
		for i := len(valBucketsFloat) - 1; i > 0; i-- {
			lineAggPct += valBucketsFloat[i]
			valBucketsFloat[i-1] = math.Max(0, valBucketsFloat[i-1]-lineAggPct)
		}

		for i := range valBucketsFloat {
			valBucketsFloat[i] *= opsCount
		}

		location, err := time.LoadLocation("GMT")
		if err != nil {
			fmt.Println(err)
		}

		current := time.Now().In(location)
		timestamp := current.Format("15:04:05")
		timestamp += "-GMT"

		stats := common.Stats{
			"tps":        opsCount,
			"timestamp":  timestamp,
			"histUnit":   histUnit,
			"buckets":    buckets,
			"valBuckets": valBucketsFloat,
		}

		if res[ns] == nil {
			res[ns] = common.Stats{
				op: stats,
			}
		} else {
			res[ns][op] = stats
		}

		// calc totals
		if nstats := nodeStats[op]; nstats == nil {
			nodeStats[op] = stats
		} else {
			if timestamp > nstats.TryString("timestamp", "") {
				nstats["timestamp"] = timestamp
			}

			nstats["tps"] = nstats.TryFloat("tps", 0) + opsCount
			nBuckets := nstats["buckets"].([]string)
			if len(buckets) > len(nBuckets) {
				nstats["buckets"] = append(nBuckets, buckets[len(nBuckets):]...)
				nstats["valBuckets"] = append(nstats["valBuckets"].([]float64), make([]float64, len(buckets[len(nBuckets):]))...)
			}

			nValBuckets := nstats["valBuckets"].([]float64)
			for i := range buckets {
				nValBuckets[i] += valBucketsFloat[i]
			}
			nstats["valBuckets"] = nValBuckets
			nodeStats[op] = nstats
		}
	}

	for _, nstats := range nodeStats {
		tps := nstats.TryFloat("tps", 0)
		if tps == 0 {
			tps = 1
		}
		nValBuckets := nstats["valBuckets"].([]float64)
		for i := range nValBuckets {
			nValBuckets[i] /= tps
		}
		nstats["valBuckets"] = nValBuckets
		nstats["timestamp_unix"] = n.ServerTime().Unix()
	}

	return res, nodeStats
}

func (n *Node) setAlertState(name string, value interface{}) {
	n._alertStates.Set(name, value)
}

// func (n *Node) alertState(namee string) interface{} {
// 	n.mutex.RLock()
// 	defer n.mutex.RUnlock()

// 	return n._alertStates[name]
// }

func (n *Node) updateNotifications() error {
	latestState := n._alertStates.Clone()

	n.CheckStatus(latestState)
	n.CheckClusterVisibility(latestState)
	n.CheckTransactionQueue(latestState)
	n.CheckFileDescriptors(latestState)
	n.CheckDiskSpace(latestState)
	n.CheckMemory(latestState)

	return nil
}

func (n *Node) alerts() *common.AlertBucket {
	return n.cluster.alerts
}
