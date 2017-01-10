package models

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	// log "github.com/Sirupsen/logrus"

	ast "github.com/aerospike/aerospike-client-go/types"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/rrd"
)

type Namespace struct {
	node *Node

	name                string
	latestInfo, oldInfo common.Info
	indexInfo           common.Info

	latestStats  common.Stats
	calcStats    common.Stats
	latencystats common.Stats

	statsHistory   map[string]*rrd.Bucket
	latencyHistory *rrd.SimpleBucket

	mutex sync.RWMutex
}

func (ns *Namespace) ServerTime() time.Time {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	if v := ns.latestStats.TryInt("current_time", 0); v != 0 {
		return time.Unix(v+ast.CITRUSLEAF_EPOCH, 0)
	}
	return time.Time{}
}

func (ns *Namespace) update(info common.Info) error {
	ns.setInfo(info)
	ns.setAliases()
	ns.updateHistory()
	// log.Infof("namespace info: %v", ns.latestInfo)
	// log.Infof("namespace calcStats: %v", ns.calcStats)

	if !common.AMCIsProd() {
		// log.Debugf("\tUpdated namespace: %s, objects: %d", ns.name, ns.latestStats["objects"])
	}
	return nil
}

func (ns *Namespace) updateIndexInfo(indexes map[string]common.Info) error {
	cmdList := make([]string, 0, len(indexes))
	for idxName, idxMap := range indexes {
		cmdList = append(cmdList, fmt.Sprintf("sindex/%s/%s", idxMap["ns"], idxName))
	}

	// retry 3 times
	info, err := ns.node.RequestInfo(3, cmdList...)
	if err != nil {
		return err
	}

	ns.mutex.Lock()
	defer ns.mutex.Unlock()
	ns.indexInfo = common.Info(info)

	return nil
}

func (ns *Namespace) updateLatencyInfo(latStats common.Stats) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()
	ns.latencystats = latStats
}

func (ns *Namespace) setInfo(stats common.Info) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()
	ns.oldInfo = ns.latestInfo
	ns.latestInfo = stats
	ns.latestStats = stats.ToInfo("namespace/" + ns.name).ToStats()
}

func (ns *Namespace) InfoAttrs(names ...string) common.Info {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	var res common.Info
	if len(names) == 0 {
		res = make(common.Info, len(ns.latestInfo))
		for name, value := range ns.latestInfo {
			res[name] = value
		}
	} else {
		res = make(common.Info, len(names))
		for _, name := range names {
			res[name] = ns.latestInfo[name]
		}
	}
	return res
}

func (ns *Namespace) InfoAttr(name string) string {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()
	return ns.latestInfo[name]
}

func (ns *Namespace) StatsAttrs(names ...string) common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	var res common.Stats
	if len(names) == 0 {
		res = make(common.Stats, len(ns.calcStats)+len(ns.latestStats))
		for name, value := range ns.latestStats {
			res[name] = value
		}

		for name, value := range ns.calcStats {
			res[name] = value
		}
	} else {
		res = make(common.Stats, len(names))
		for _, name := range names {
			if stat := ns.latestStats.Get(name); stat != nil {
				res[name] = stat
			} else {
				res[name] = ns.calcStats.Get(name)
			}
		}
	}
	return res
}

func (ns *Namespace) StatsAttr(name string) interface{} {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()
	if val := ns.latestStats.Get(name); val != nil {
		return val
	}
	return ns.calcStats.Get(name)
}

func (ns *Namespace) aggStats(agg, calcAgg common.Stats) {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()
	agg.AggregateStats(ns.latestStats)
	calcAgg.AggregateStats(ns.calcStats)
}

func (ns *Namespace) Disk() common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	return common.Stats{
		"used-bytes-disk":  ns.calcStats.TryInt("used-bytes-disk", 0),
		"free-bytes-disk":  ns.calcStats.TryInt("free-bytes-disk", 0),
		"total-bytes-disk": ns.calcStats.TryInt("total-bytes-disk", 0),
	}
}

func (ns *Namespace) DiskPercent() common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	return common.Stats{
		"free-pct-disk":       strconv.Itoa(int(ns.calcStats.TryInt("free-pct-disk", 0))),
		"high-water-disk-pct": strconv.Itoa(int(ns.latestStats.TryInt("high-water-disk-pct", 0))),
	}
}

func (ns *Namespace) Memory() common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	return common.Stats{
		"used-bytes-memory":  ns.calcStats.TryInt("used-bytes-memory", 0),
		"free-bytes-memory":  ns.calcStats.TryInt("free-bytes-memory", 0),
		"total-bytes-memory": ns.calcStats.TryInt("total-bytes-memory", 0),
	}
}

func (ns *Namespace) MemoryPercent() common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	return common.Stats{
		"free-pct-memory":       strconv.Itoa(int(ns.calcStats.TryInt("free-pct-memory", 0))),
		"high-water-memory-pct": strconv.Itoa(int(ns.latestStats.TryInt("high-water-memory-pct", 0))),
	}
}

func (ns *Namespace) IndexStats(name string) common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()
	return ns.indexInfo.ToInfo("sindex/" + ns.name + "/" + name).ToStats()
}

func (ns *Namespace) updateHistory() {
	tm := ns.ServerTime().Unix()

	ns.mutex.Lock()
	defer ns.mutex.Unlock()

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

	for _, stat := range recordedStats {
		bucket := ns.statsHistory[stat]
		if bucket == nil {
			bucket = rrd.NewBucket(ns.node.cluster.UpdateInterval(), 3600, true)
			ns.statsHistory[stat] = bucket
		}
		bucket.Add(tm, ns.calcStats.TryFloat(stat, 0))
	}
}

func (ns *Namespace) setAliases() {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	stats := ns.latestStats
	calcStats := common.Stats{}

	calcStats["stat_read_success"] = stats.TryInt("client_read_success", 0)
	calcStats["stat_read_reqs"] = stats.TryInt("client_read_success", 0) +
		stats.TryInt("client_read_error", 0) +
		stats.TryInt("client_read_not_found", 0) +
		stats.TryInt("client_read_timeout", 0)

	calcStats["stat_write_success"] = stats.TryInt("client_write_success", 0)
	calcStats["stat_write_reqs"] = calcStats.TryInt("stat_write_success", 0) +
		stats.TryInt("client_write_error", 0) +
		stats.TryInt("fail_xdr_forbidden", 0) +
		stats.TryInt("fail_key_busy", 0) +
		stats.TryInt("fail_generation", 0) +
		stats.TryInt("fail_record_too_big", 0)

	calcStats["used-bytes-disk"] = stats.TryInt("device_used_bytes", 0)
	calcStats["total-bytes-disk"] = stats.TryInt("device_total_bytes", 0)

	calcStats["used-bytes-memory"] = stats.TryInt("memory_used_bytes", 0)
	calcStats["total-bytes-memory"] = stats.TryInt("memory-size", 0)

	calcStats["migrate_progress_send"] = stats.TryInt("migrate_rx_partitions_remaining", 0)
	calcStats["migrate_progress_recv"] = stats.TryInt("migrate_tx_partitions_remaining", 0)

	calcStats["migrate_tx_obj"] = stats.TryInt("migrate-tx-instance-count", 0)
	calcStats["migrate_rx_obj"] = stats.TryInt("migrate-rx-instance-count", 0)

	calcStats["batch_read_success"] = stats.TryInt("batch_sub_read_success", 0)
	calcStats["batch_read_reqs"] = stats.TryInt("batch_sub_read_success", 0) +
		stats.TryInt("batch_sub_read_timeout", 0) +
		stats.TryInt("batch_sub_read_error", 0) +
		stats.TryInt("batch_sub_tsvc_error", 0) +
		stats.TryInt("batch_sub_tsvc_timeout", 0)

	calcStats["query_success"] = stats.TryInt("query_reqs", 0) - stats.TryInt("query_fail", 0)
	calcStats["query_reqs"] = stats.TryInt("query_reqs", 0)

	calcStats["scan_success"] = stats.TryInt("scan_aggr_complete", 0) +
		stats.TryInt("scan_basic_complete", 0) +
		stats.TryInt("scan_udf_bg_complete", 0)
	calcStats["scan_reqs"] = stats.TryInt("scan_aggr_complete", 0) +
		stats.TryInt("scan_basic_complete", 0) +
		stats.TryInt("scan_udf_bg_complete", 0) +
		stats.TryInt("scan_udf_bg_abort", 0) +
		stats.TryInt("scan_aggr_error", 0) +
		stats.TryInt("scan_basic_error", 0) +
		stats.TryInt("scan_udf_bg_error", 0)

	calcStats["udf_success"] = stats.TryInt("client_udf_complete", 0)
	calcStats["udf_reqs"] = stats.TryInt("client_udf_complete", 0) +
		stats.TryInt("client_udf_error", 0) +
		stats.TryInt("client_udf_timeout", 0)

	calcStats["xdr_write_success"] = stats.TryInt("xdr_write_success", 0)
	calcStats["xdr_write_reqs"] = calcStats.TryInt("xdr_write_success", 0) +
		stats.TryInt("xdr_write_error", 0) +
		stats.TryInt("xdr_write_timeout", 0)

	// This does not yet exists on namespace level
	// calcStats["xdr_read_success"] = stats.TryInt("xdr_read_success", 0)
	// calcStats["xdr_read_reqs"] = stats.TryInt("xdr_read_success", 0) +
	// 	stats.TryInt("xdr_read_error", 0) +
	// 	stats.TryInt("xdr_read_notfound", 0)

	/////////////////////////////////////////////////////////////////////////////////////////////
	// Aliases
	/////////////////////////////////////////////////////////////////////////////////////////////
	// TODO: Change all of these properly on UI side and remove these
	calcStats["type"] = stats.TryString("storage-engine", "memory")
	calcStats["file"] = stats.TryString("storage-engine.file", "")
	calcStats["filesize"] = stats.TryInt("storage-engine.filesize", 0)
	calcStats["defrag-lwm-pct"] = stats.TryFloat("storage-engine.defrag-lwm-pct", 0)
	calcStats["defrag-startup-minimum"] = stats.TryInt("storage-engine.defrag-startup-minimum", 0)
	calcStats["write-block-size"] = stats.TryInt("storage-engine.write-block-size", 0)

	calcStats["free-pct-disk"] = stats.TryFloat("device_free_pct", 100)
	if _, exists := stats["device_total_bytes"]; exists {
		calcStats["used-bytes-disk"] = stats.TryInt("device_used_bytes", 0)
		calcStats["total-bytes-disk"] = stats.TryInt("device_total_bytes", 0)
		calcStats["free-bytes-disk"] = calcStats.TryInt("total-bytes-disk", 0) - calcStats.TryInt("device_used_bytes", 0)
		calcStats["free-pct-disk"] = stats.TryFloat("device_free_pct", 0)
		calcStats["available_pct"] = stats.TryFloat("device_available_pct", 0)
		calcStats["free_pct"] = stats.TryFloat("device_free_pct", 0)
	}

	calcStats["total-bytes-memory"] = stats.TryInt("memory-size", 0)
	calcStats["data-in-memory"] = (stats.TryString("storage-engine", "memory") == "memory") ||
		(stats.TryString("storage-engine.data-in-memory", "false") == "true")

	calcStats["available-bin-names"] = stats.TryInt("available_bin_names", 0)
	calcStats["current-time"] = stats.TryInt("current_time", 0)
	calcStats["evicted-objects"] = stats.TryInt("evicted_objects", 0)
	calcStats["expired-objects"] = stats.TryInt("expired_objects", 0)
	calcStats["hwm-breached"] = stats.TryString("hwm_breached", "false")
	calcStats["master-objects"] = stats.TryInt("master_objects", 0)
	calcStats["master-sub-objects"] = stats.TryInt("master_sub_objects", 0)
	calcStats["max-void-time"] = stats.TryInt("max_void_time", 0)
	calcStats["free-pct-memory"] = stats.TryFloat("memory_free_pct", 0)
	calcStats["used-bytes-memory"] = stats.TryInt("memory_used_bytes", 0)
	calcStats["free-bytes-memory"] = calcStats.TryInt("total-bytes-memory", 0) - calcStats.TryInt("used-bytes-memory", 0)
	calcStats["data-used-bytes-memory"] = stats.TryInt("memory_used_data_bytes", 0)
	calcStats["index-used-bytes-memory"] = stats.TryInt("memory_used_index_bytes", 0)
	calcStats["sindex-used-bytes-memory"] = stats.TryInt("memory_used_sindex_bytes", 0)
	calcStats["migrate-record-receives"] = stats.TryInt("migrate_record_receives", 0)
	calcStats["migrate-record-retransmits"] = stats.TryInt("migrate_record_retransmits", 0)
	calcStats["migrate-records-skipped"] = stats.TryInt("migrate_records_skipped", 0)
	calcStats["migrate-records-transmitted"] = stats.TryInt("migrate_records_transmitted", 0)
	calcStats["migrate-rx-instance-count"] = stats.TryInt("migrate_rx_instances", 0)
	calcStats["migrate-rx-partitions-active"] = stats.TryInt("migrate_rx_partitions_active", 0)
	calcStats["migrate-rx-partitions-initial"] = stats.TryInt("migrate_rx_partitions_initial", 0)
	calcStats["migrate-rx-partitions-remaining"] = stats.TryInt("migrate_rx_partitions_remaining", 0)
	calcStats["migrate-tx-instance-count"] = stats.TryInt("migrate_tx_instances", 0)
	calcStats["migrate-tx-partitions-active"] = stats.TryInt("migrate_tx_partitions_active", 0)
	calcStats["migrate-tx-partitions-imbalance"] = stats.TryInt("migrate_tx_partitions_imbalance", 0)
	calcStats["migrate-tx-partitions-initial"] = stats.TryInt("migrate_tx_partitions_initial", 0)
	calcStats["migrate-tx-partitions-remaining"] = stats.TryInt("migrate_tx_partitions_remaining", 0)

	calcStats["migrate_incoming_remaining"] = stats.TryInt("migrate_rx_partitions_remaining", 0)
	calcStats["migrate_outgoing_remaining"] = stats.TryInt("migrate_tx_partitions_remaining", 0)

	calcStats["non-expirable-objects"] = stats.TryInt("non_expirable_objects", 0)
	calcStats["nsup-cycle-duration"] = stats.TryInt("nsup_cycle_duration", 0)
	calcStats["nsup-cycle-sleep-pct"] = stats.TryFloat("nsup_cycle_sleep_pct", 0)
	calcStats["prole-objects"] = stats.TryInt("prole_objects", 0)
	calcStats["prole-sub-objects"] = stats.TryInt("prole_sub_objects", 0)
	calcStats["set-deleted-objects"] = stats.TryInt("set_deleted_objects", 0)
	calcStats["stop-writes"] = stats.TryInt("stop_writes", 0)
	calcStats["defrag-lwm-pct"] = stats.TryFloat("storage-engine.defrag-lwm-pct", 0)
	calcStats["defrag-queue-min"] = stats.TryInt("storage-engine.defrag-queue-min", 0)
	calcStats["defrag-sleep"] = stats.TryInt("storage-engine.defrag-sleep", 0)
	calcStats["defrag-startup-minimum"] = stats.TryInt("storage-engine.defrag-startup-minimum", 0)
	calcStats["filesize"] = stats.TryInt("storage-engine.filesize", 0)
	calcStats["flush-max-ms"] = stats.TryInt("storage-engine.flush-max-ms", 0)
	calcStats["fsync-max-sec"] = stats.TryInt("storage-engine.fsync-max-sec", 0)
	calcStats["max-write-cache"] = stats.TryInt("storage-engine.max-write-cache", 0)
	calcStats["min-avail-pct"] = stats.TryFloat("storage-engine.min-avail-pct", 0)
	calcStats["post-write-queue"] = stats.TryInt("storage-engine.post-write-queue", 0)
	calcStats["write-block-size"] = stats.TryInt("storage-engine.write-block-size", 0)
	calcStats["sub-objects"] = stats.TryInt("sub_objects", 0)

	ns.calcStats = calcStats
}

func (ns *Namespace) SetsInfo() map[string]common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	res := ns.latestInfo.ToStatsMap("sets/"+ns.name, "set", ":")
	for k, v := range res {
		// alias the keys
		v["ns_name"] = v.Get("ns")
		v["set_name"] = v.Get("set")
		v["n_objects"] = v.Get("objects")
		v["stop-write-count"] = v.Get("stop-writes-count")
		v["delete"] = v.Get("deleting")
		v["evict-hwm-count"] = "n/s"

		res[k] = v
	}

	return res
}

func (ns *Namespace) Stats() common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	res := common.Stats{
		"memory":                    ns.Memory(),
		"memory-pct":                ns.MemoryPercent(),
		"disk":                      ns.Disk(),
		"disk-pct":                  ns.DiskPercent(),
		"master-objects-tombstones": fmt.Sprintf("%v, %v", common.Comma(ns.StatsAttr("master-objects").(int64), "'"), common.Comma(ns.StatsAttr("master_tombstones").(int64), "'")),
		"prole-objects-tombstones":  fmt.Sprintf("%v, %v", common.Comma(ns.StatsAttr("prole-objects").(int64), "'"), common.Comma(ns.StatsAttr("prole_tombstones").(int64), "'")),
		// "least_available_pct":       ns.StatsAttr("available_pct"),
	}

	subsetOfStats := []string{"expired-objects", "evicted-objects", "repl-factor",
		"memory-size", "free-pct-memory", "max-void-time", "hwm-breached",
		"default-ttl", "max-ttl", "max-ttl", "enable-xdr", "stop-writes",
		"available_pct", "stop-writes-pct", "hwm-breached", "single-bin",
		"data-in-memory", "type", "master-objects", "prole-objects",
		"master_tombstones", "prole_tombstones",
	}

	for k, v := range ns.StatsAttrs(subsetOfStats...) {
		res[k] = v
	}

	return res
}

// var _configuration_params = []string{
// 	"type",
// 	"storage-engine",
// 	"file",
// 	"storage-engine.file",
// 	"filesize",
// 	"storage-engine.filesize",
// 	"load-at-startup",
// 	"data-in-memory",
// 	"defrag-period",
// 	"defrag-lwm-pct",
// 	"storage-engine.defrag-lwm-pct",
// 	"defrag-max-blocks",
// 	"defrag-startup-minimum",
// 	"storage-engine.defrag-startup-minimum",
// 	"write-block-size",
// 	"storage-engine.write-block-size",
// 	"ticker-interval",
// 	"replication-factor",
// 	"low-water-pct",
// 	"high-water-memory-pct",
// 	"high-water-disk-pct",
// 	"high-water-pct",
// 	"evict-pct",
// 	"stop-writes-pct",
// 	"memory-size",
// 	"default-ttl",
// 	"max-ttl",
// 	"allow-versions",
// 	"single-bin",
// 	"node_status",
// 	"migrate-sleep",
// 	"migrate-order",
// }

func (ns *Namespace) ConfigAttrs(names ...string) common.Stats {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	info := ns.latestInfo.ToInfo("get-config:context=namespace;id=" + ns.name).ToStats()
	return info
}

func (ns *Namespace) SetConfig(config common.Info) error {
	cmd := "set-config:context=namespace;id=" + ns.name
	for parameter, value := range config {
		cmd += fmt.Sprintf(";%s=%s", parameter, value)
	}

	res, err := ns.node.RequestInfo(3, cmd)
	if err != nil {
		return err
	}

	errMsg, exists := res[cmd]
	if exists && strings.ToLower(errMsg) == "ok" {
		return nil
	}

	return errors.New(errMsg)
}
