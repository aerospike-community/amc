package observer

import (
	"strconv"
	"strings"
	"sync"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"

	"github.com/aerospike/aerospike-console/common"
)

type NodeStatus string

var nodeStatus = struct {
	On, Off NodeStatus
}{
	"on", "off",
}

type node struct {
	origNode *as.Node
	status   NodeStatus

	namespaces map[string]*namespace

	latestInfo, oldInfo common.Info

	stats, nsAggStats         common.Stats
	calcStats, nsAggCalcStats common.Stats

	mutex sync.RWMutex
}

func newNode(origNode *as.Node) *node {
	return &node{
		origNode:   origNode,
		status:     nodeStatus.On,
		namespaces: map[string]*namespace{},
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
	n.setStats(stats, nsAggStats)

	log.Debugf("Updating Node: %v, objects: %v", n.Id(), stats["objects"])

	return nil
}

func (n *node) notifyAboutChanges() error {
	return nil
}

func (n *node) applyStatsToAggregate(stats common.Stats) {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	stats.AggregateStats(n.stats)
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
			n.namespaces[ns] = &namespace{node: n, name: ns}
		}
	}

	return nil
}

func (n *node) infoKeys() []string {
	res := []string{"node", "statistics", "features",
		"cluster-generation", "partition-generation", "build_time",
		"edition", "version", "build", "build_os", "bins", "jobs:",
		"sindex", "udf-list", "latency:",
	}

	// add namespace stat requests
	for ns, _ := range n.namespaces {
		res = append(res, "namespace/"+ns)
		res = append(res, "sets/"+ns)
	}

	return res
}

func (n *node) setStats(stats, nsStats common.Stats) {
	n.mutex.Lock()
	defer n.mutex.Unlock()
	n.stats = stats
	n.nsAggStats = nsStats
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
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.InfoAttr("build")
}

func (n *node) Disk() (string, string) {
	return n.InfoAttr("used-bytes-disk"), n.InfoAttr("total-bytes-disk")
}

func (n *node) Memory() (string, string) {
	return n.InfoAttr("used-bytes-memory"), n.InfoAttr("total-bytes-memory")
}

func (n *node) Namespaces() []string {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	res := make([]string, 0, len(n.namespaces))
	for ns, _ := range n.namespaces {
		res = append(res, ns)
	}
	return res
}

func (n *node) Jobs() map[string]common.Info {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.latestInfo.ToInfoMap("jobs:", "trid", ":")
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

func (n *node) Udfs() map[string]common.Info {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	return n.latestInfo.ToInfoMap("udf-list", "filename", ":")
}

func (n *node) Addresss() string {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	h := n.origNode.GetHost()
	return h.Name
}

func (n *node) Port() uint16 {
	n.mutex.RLock()
	defer n.mutex.RUnlock()
	h := n.origNode.GetHost()
	return uint16(h.Port)
}

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

// func (n *node) setAliases() {
// 	ns.mutex.Lock()
// 	defer ns.mutex.Unlock()

// 	calcStats := common.Stats{}

// 	// Aggregate Section
// 	calcStats["stat_write_success"] = n.nsAggCalcStats.TryInt("client_write_success", 0)
// 	calcStats["stat_write_reqs"] = str(int(calcStats["stat_write_success"]) + int(n.nsAggCalcStats.TryInt("client_write_error", 0)) +
// 		int(n.nsAggCalcStats.TryInt("fail_xdr_forbidden", 0)) + int(n.nsAggCalcStats.TryInt("fail_key_busy", 0)) +
// 		int(n.nsAggCalcStats.TryInt("fail_generation", 0)) + int(n.nsAggCalcStats.TryInt("fail_record_too_big", 0)))
// 	calcStats["stat_read_success"] = n.nsAggCalcStats.TryInt("client_read_success", 0)
// 	calcStats["stat_read_reqs"] = str(int(calcStats["stat_read_success"]) + int(n.nsAggCalcStats.TryInt("client_read_error", 0)) + int(n.nsAggCalcStats.TryInt("client_read_not_found", 0)) + int(n.nsAggCalcStats.TryInt("client_read_timeout", 0)))
// 	calcStats["used-bytes-disk"] = n.nsAggCalcStats.TryInt("device_used_bytes", 0)
// 	calcStats["total-bytes-disk"] = n.nsAggCalcStats.TryInt("device_total_bytes", 0)
// 	calcStats["used-bytes-memory"] = n.nsAggCalcStats.TryInt("memory_used_bytes", 0)
// 	calcStats["total-bytes-memory"] = n.nsAggCalcStats.TryInt("memory-size", 0)

// 	calcStats["migrate_progress_send"] = n.nsAggCalcStats.TryInt("migrate_rx_partitions_remaining", 0)
// 	calcStats["migrate_progress_recv"] = n.nsAggCalcStats.TryInt("migrate_tx_partitions_remaining", 0)
// 	calcStats["migrate_tx_objs"] = n.nsAggCalcStats.TryInt("migrate-tx-instance-count", 0)
// 	calcStats["migrate_rx_objs"] = n.nsAggCalcStats.TryInt("migrate-rx-instance-count", 0)

// 	calcStats["xdr_write_success"] = n.nsAggCalcStats.TryInt("xdr_write_success", 0)
// 	calcStats["xdr_write_reqs"] = str(int(calcStats["xdr_write_success"]) + int(n.nsAggCalcStats.TryInt("xdr_write_error", 0)) + int(n.nsAggCalcStats.TryInt("xdr_write_timeout", 0)))

// 	calcStats["batch_read_success"] = n.nsAggCalcStats.TryInt("batch_sub_read_success", 0)
// 	calcStats["batch_read_reqs"] = str(int(calcStats["batch_read_success"]) + int(n.nsAggCalcStats.TryInt("batch_sub_read_timeout", 0)) + int(n.nsAggCalcStats.TryInt("batch_sub_read_error", 0)) +
// 		int(n.nsAggCalcStats.TryInt("batch_sub_tsvc_error", 0)) + int(n.nsAggCalcStats.TryInt("batch_sub_tsvc_timeout", 0)))

// 	calcStats["query_success"] = str(int(n.nsAggCalcStats.TryInt("query_reqs", 0)) - int(n.nsAggCalcStats.TryInt("query_fail", 0)))
// 	calcStats["query_reqs"] = n.nsAggCalcStats.TryInt("query_reqs", 0)

// 	calcStats["scan_success"] = str(int(n.nsAggCalcStats.TryInt("scan_aggr_complete", 0)) + int(n.nsAggCalcStats.TryInt("scan_basic_complete", 0)) + int(n.nsAggCalcStats.TryInt("scan_udf_bg_complete", 0)))
// 	calcStats["scan_reqs"] = str(int(calcStats["scan_success"]) + int(n.nsAggCalcStats.TryInt("scan_aggr_abort", 0)) + int(n.nsAggCalcStats.TryInt("scan_basic_abort", 0)) +
// 		int(n.nsAggCalcStats.TryInt("scan_udf_bg_abort", 0)) + int(n.nsAggCalcStats.TryInt("scan_aggr_error", 0)) +
// 		int(n.nsAggCalcStats.TryInt("scan_basic_error", 0)) + int(n.nsAggCalcStats.TryInt("scan_udf_bg_error", 0)))

// 	calcStats["udf_success"] = n.nsAggCalcStats.TryInt("client_udf_complete", 0)
// 	calcStats["udf_reqs"] = str(int(calcStats["udf_success"]) + int(n.nsAggCalcStats.TryInt("client_udf_error", 0)) + int(n.nsAggCalcStats.TryInt("client_udf_timeout", 0)))

// 	// Alias section
// 	calcStats["queue"] = calcStats["tsvc_queue"]

// 	if _, exists := calcStats["xdr_read_success"]; exists {
// 		calcStats["xdr_read_reqs"] = str(int(stats.get("xdr_read_success", 0)) + int(stats.get("xdr_read_error", 0)) + int(stats.get("xdr_read_notfound", 0)))
// 	}

// 	ns.calcStats = calcStats
// }
