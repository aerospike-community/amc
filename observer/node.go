package observer

import (
	"strconv"
	"strings"
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"

	"github.com/aerospike/aerospike-console/common"
	"github.com/aerospike/aerospike-console/rrd"
)

type NodeStatus string

var nodeStatus = struct {
	On, Off NodeStatus
}{
	"on", "off",
}

type node struct {
	cluster  *cluster
	origNode *as.Node
	status   NodeStatus

	namespaces map[string]*namespace

	latestInfo, oldInfo common.Info
	latestConfig        common.Info

	stats, nsAggStats common.Stats
	nsAggCalcStats    common.Stats

	statsHistory map[string]*rrd.Bucket

	mutex sync.RWMutex
}

func newNode(cluster *cluster, origNode *as.Node) *node {
	return &node{
		cluster:      cluster,
		origNode:     origNode,
		status:       nodeStatus.On,
		namespaces:   map[string]*namespace{},
		statsHistory: map[string]*rrd.Bucket{},
	}
}

func (n *node) update() error {
	if err := n.updateNamespaceNames(); err != nil {
		return err
	}

	// retry 3 times
	info, err := n.requestInfo(3, n.infoKeys()...)
	if err != nil {
		n.setStatus(nodeStatus.Off)
		return err
	}
	n.setInfo(common.Info(info))
	n.setConfig(n.InfoAttrs("get-config:"))

	n.setStatus(nodeStatus.On)
	n.notifyAboutChanges()

	nsAggStats := common.Stats{}
	nsAggCalcStats := common.Stats{}
	for _, ns := range n.namespaces {
		ns.update(n.InfoAttrs("namespace/"+ns.name, "sets/"+ns.name))
		ns.updateIndexInfo(n.Indexes(ns.name))
		ns.aggStats(nsAggStats, nsAggCalcStats)
	}

	stats := common.Info(info).ToInfo("statistics").ToStats()
	// log.Debugf("%v", stats)
	n.setStats(stats, nsAggStats, nsAggCalcStats)
	n.updateHistory()

	log.Debugf("Updating Node: %v, objects: %v", n.Id(), stats["objects"])

	return nil
}

func (n *node) notifyAboutChanges() error {
	return nil
}

func (n *node) applyStatsToAggregate(stats, calcStats common.Stats) {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	stats.AggregateStats(n.stats)
	calcStats.AggregateStats(n.nsAggCalcStats)
}

func (n *node) applyNsStatsToAggregate(stats, calcStats map[string]common.Stats) {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	for k, ns := range n.namespaces {
		if stats[k] == nil {
			stats[k] = common.Stats{}
		}
		if calcStats[k] == nil {
			calcStats[k] = common.Stats{}
		}

		ns.aggStats(stats[k], calcStats[k])
	}
}

func (n *node) applyNsSetStatsToAggregate(stats map[string]map[string]common.Stats) map[string]map[string]common.Stats {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	for nsName, ns := range n.namespaces {
		setsInfo := ns.SetsInfo()
		// log.Info("@@@@@@@@@@@@@@@@@@", setsInfo)

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

	// log.Info("@@@@@@@@@@@@@@@@@@", stats)
	return stats
}

func (n *node) requestInfo(reties int, cmd ...string) (result map[string]string, err error) {
	if len(cmd) == 0 {
		return map[string]string{}, nil
	}

	for i := 0; i < reties; i++ {
		result, err = n.origNode.RequestInfo(cmd...)
		if err == nil {
			return result, nil
		}
		// TODO: only retry for EOF or Timeout errors
	}

	return result, err
}

func (n *node) updateNamespaceNames() error {
	namespaceListMap, err := n.requestInfo(3, "namespaces")
	if err != nil {
		return err
	}

	namespacesStr := namespaceListMap["namespaces"]
	namespaces := strings.Split(namespacesStr, ";")

	n.mutex.Lock()
	defer n.mutex.Unlock()
	for _, ns := range namespaces {
		if n.namespaces[ns] == nil {
			n.namespaces[ns] = &namespace{node: n, name: ns, statsHistory: map[string]*rrd.Bucket{}}
		}
	}

	return nil
}

func (n *node) LatestThroughput() map[string]map[string]*common.SinglePointValue {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	res := make(map[string]map[string]*common.SinglePointValue, len(n.statsHistory))
	for name, bucket := range n.statsHistory {
		res[name] = map[string]*common.SinglePointValue{
			n.Address(): bucket.LastValue(),
		}
	}

	return res
}

func (n *node) ThroughputSince(tm time.Time) map[string]map[string][]*common.SinglePointValue {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	res := make(map[string]map[string][]*common.SinglePointValue, len(n.statsHistory))
	for name, bucket := range n.statsHistory {
		res[name] = map[string][]*common.SinglePointValue{
			n.Address(): bucket.ValuesSince(tm),
		}
	}

	return res
}

func (n *node) updateHistory() {
	n.mutex.Lock()
	defer n.mutex.Unlock()

	recordedStats := []string{
		"stat_read_success", "stat_read_reqs",
		"stat_write_success", "stat_write_reqs",

		"batch_read_success", "batch_read_reqs",

		"scan_success", "scan_reqs",
		"query_success", "query_reqs",

		"xdr_read_success", "xdr_read_reqs",
		"xdr_write_success", "xdr_write_reqs",

		"udf_success", "udf_reqs",
	}

	tm := time.Now().Unix()
	for _, stat := range recordedStats {
		bucket := n.statsHistory[stat]
		if bucket == nil {
			bucket = rrd.NewBucket(n.cluster.UpdateInterval(), 3600, true)
			n.statsHistory[stat] = bucket
		}
		bucket.Add(tm, n.nsAggCalcStats.TryFloat(stat, 0))
	}
}

func (n *node) infoKeys() []string {
	res := []string{"node", "statistics", "features",
		"cluster-generation", "partition-generation", "build_time",
		"edition", "version", "build", "build_os", "bins", "jobs:",
		"sindex", "udf-list", "latency:", "get-config:",
	}

	// add namespace stat requests
	for ns, _ := range n.namespaces {
		res = append(res, "namespace/"+ns)
		res = append(res, "sets/"+ns)
	}

	return res
}

func (n *node) NamespaceByName(ns string) *namespace {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.namespaces[ns]
}

func (n *node) setStats(stats, nsStats, nsCalcStats common.Stats) {
	n.mutex.Lock()
	defer n.mutex.Unlock()
	n.stats = stats
	n.nsAggStats = nsStats
	n.nsAggCalcStats = nsCalcStats
}

func (n *node) setConfig(stats common.Info) {
	n.mutex.Lock()
	defer n.mutex.Unlock()
	n.latestConfig = stats
}

func (n *node) ConfigAttrs(names ...string) common.Info {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	var res common.Info
	if len(names) == 0 {
		res = make(common.Info, len(n.latestConfig))
		for name, value := range n.latestConfig {
			res[name] = value
		}
	} else {
		res = make(common.Info, len(names))
		for _, name := range names {
			res[name] = n.latestConfig[name]
		}
	}
	return res
}

func (n *node) ConfigAttr(name string) string {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.latestConfig[name]
}

func (n *node) setInfo(stats common.Info) {
	n.mutex.Lock()
	defer n.mutex.Unlock()
	n.oldInfo = n.latestInfo
	n.latestInfo = stats
}

func (n *node) InfoAttrs(names ...string) common.Info {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	var res common.Info
	if len(names) == 0 {
		res = make(common.Info, len(n.latestInfo))
		for name, value := range n.latestInfo {
			res[name] = value
		}
	} else {
		res = make(common.Info, len(names))
		for _, name := range names {
			res[name] = n.latestInfo[name]
		}
	}
	return res
}

func (n *node) InfoAttr(name string) string {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.latestInfo[name]
}

func (n *node) StatsAttrs(names ...string) common.Stats {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	var res common.Stats
	if len(names) == 0 {
		res = make(common.Stats, len(n.stats))
		for name, value := range n.stats {
			res[name] = value
		}
	} else {
		res = make(common.Stats, len(names))
		for _, name := range names {
			res[name] = n.stats.Get(name)
		}
	}
	return res
}

func (n *node) StatsAttr(name string) interface{} {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.stats.Get(name)
}

func (n *node) Status() NodeStatus {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.status
}

func (n *node) setStatus(status NodeStatus) {
	n.mutex.Lock()
	defer n.mutex.Unlock()
	n.status = status
}

func (n *node) Build() string {
	return n.InfoAttr("build")
}

func (n *node) Disk() common.Stats {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	return common.Stats{
		"used":             n.nsAggCalcStats["used-bytes-disk"],
		"free":             n.nsAggCalcStats["free-bytes-disk"],
		"used-bytes-disk":  n.nsAggCalcStats.TryInt("used-bytes-disk", 0),
		"free-bytes-disk":  n.nsAggCalcStats.TryInt("free-bytes-disk", 0),
		"total-bytes-disk": n.nsAggCalcStats.TryInt("total-bytes-disk", 0),
	}
}

func (n *node) Memory() common.Stats {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

	return common.Stats{
		"used":               n.nsAggCalcStats["used-bytes-memory"],
		"free":               n.nsAggCalcStats["free-bytes-memory"],
		"used-bytes-memory":  n.nsAggCalcStats.TryInt("used-bytes-memory", 0),
		"free-bytes-memory":  n.nsAggCalcStats.TryInt("free-bytes-memory", 0),
		"total-bytes-memory": n.nsAggCalcStats.TryInt("total-bytes-memory", 0),
	}
}

func (n *node) NamespaceList() []string {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	res := make([]string, 0, len(n.namespaces))
	for ns, _ := range n.namespaces {
		res = append(res, ns)
	}
	return common.StrUniq(res)
}

func (n *node) Jobs() map[string]common.Stats {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.latestInfo.ToStatsMap("jobs:", "trid", ":")
}

func (n *node) Indexes(namespace string) map[string]common.Info {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
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

	// log.Debug(result)
	return result
}

func (n *node) NamespaceIndexes() map[string][]string {
	n.mutex.RLock()
	defer n.mutex.RUnlock()

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

func (n *node) Udfs() map[string]common.Info {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.latestInfo.ToInfoMap("udf-list", "filename", ":")
}

func (n *node) Address() string {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	h := n.origNode.GetHost()
	return h.Name + ":" + strconv.Itoa(h.Port)
}

// func (n *node) Address() string {
// 	n.mutex.RLock()
// 	defer n.mutex.RUnlock()
// 	h := n.origNode.GetHost()
// 	return h.Name
// }

// func (n *node) Port() uint16 {
// 	n.mutex.RLock()
// 	defer n.mutex.RUnlock()
// 	h := n.origNode.GetHost()
// 	return uint16(h.Port)
// }

func (n *node) Id() string {
	return n.InfoAttr("node")
}

func (n *node) ClusterName() string {
	return n.InfoAttr("cluster-name")
}

func (n *node) Bins() common.Stats {
	return parseBinInfo(n.InfoAttr("bins"))
}

func (n *node) MigrationStats() common.Info {
	return n.InfoAttrs("migrate_msgs_sent", "migrate_msgs_recv", "migrate_progress_send",
		"migrate_progress_recv", "migrate_tx_objs", "migrate_rx_objs")
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
