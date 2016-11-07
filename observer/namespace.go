package observer

import (
	"fmt"
	"sync"

	log "github.com/Sirupsen/logrus"

	"github.com/aerospike/aerospike-console/common"
)

type namespace struct {
	node *node

	name                string
	latestInfo, oldInfo common.Info
	indexInfo           common.Info

	latestStats common.Stats
	calcStats   common.Stats

	mutex sync.RWMutex
}

func (ns *namespace) update(info common.Info) error {
	ns.setInfo(info)
	ns.setAliases()

	log.Debugf("\tUpdated namespace: %s, objects: %d", ns.name, ns.latestStats["objects"])
	return nil
}

func (ns *namespace) updateIndexInfo(indexes map[string]common.Info) error {
	cmdList := make([]string, 0, len(indexes))
	for idxName, idxMap := range indexes {
		cmdList = append(cmdList, fmt.Sprintf("sindex/%s/%s", idxMap["ns"], idxName))
	}

	// retry 3 times
	info, err := ns.node.requestInfo(3, cmdList...)
	if err != nil {
		return err
	}

	ns.mutex.Lock()
	defer ns.mutex.Unlock()
	ns.indexInfo = common.Info(info)

	return nil
}

func (ns *namespace) setInfo(stats common.Info) {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()
	ns.oldInfo = ns.latestInfo
	ns.latestInfo = stats
	ns.latestStats = stats.ToInfo("namespace/" + ns.name).ToStats()
}

func (ns *namespace) InfoAttrs(names ...string) common.Info {
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

func (ns *namespace) InfoAttr(name string) string {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()
	return ns.latestInfo[name]
}

func (ns *namespace) aggStats(agg, calcAgg common.Stats) {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()
	agg.AggregateStats(ns.latestStats)
	calcAgg.AggregateStats(ns.calcStats)
}

func (ns *namespace) SetConfiguration(config map[string]interface{}) error {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()
	cmdList := make([]string, 0, len(config))
	for k, v := range config {
		cmdList = append(cmdList, fmt.Sprintf("set-config:context=namespace;id=%s;%s=%v", ns.name, k, v))
	}
	_, err := ns.node.requestInfo(3, cmdList...)
	return err
}

func (ns *namespace) Disk() (string, string) {
	return ns.InfoAttr("used-bytes-disk"), ns.InfoAttr("total-bytes-disk")
}

func (ns *namespace) Memory() (string, string) {
	return ns.InfoAttr("used-bytes-memory"), ns.InfoAttr("total-bytes-memory")
}

func (ns *namespace) IndexStats(name string) common.Info {
	ns.mutex.RLock()
	defer ns.mutex.RUnlock()

	res := common.Info{}
	for k, v := range ns.indexInfo {
		if k == name {
			res[k] = v
		}
	}

	return res
}

func (ns *namespace) setAliases() {
	ns.mutex.Lock()
	defer ns.mutex.Unlock()

	stats := ns.latestInfo
	calcStats := common.Stats{}

	calcStats["stat_read_success"] = stats.TryInt("client_read_success", 0)
	calcStats["stat_read_reqs"] = stats.TryInt("client_read_success", 0) +
		stats.TryInt("client_read_error", 0) +
		stats.TryInt("client_read_not_found", 0) +
		stats.TryInt("client_read_timeout", 0)

	calcStats["stat_write_success"] = stats.TryInt("client_write_success", 0)
	calcStats["stat_write_reqs"] = stats.TryInt("stat_write_success", 0) +
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
	calcStats["xdr_write_reqs"] = stats.TryInt("xdr_write_success", 0) +
		stats.TryInt("xdr_write_error", 0) +
		stats.TryInt("xdr_write_timeout", 0)

	calcStats["xdr_read_success"] = stats.TryInt("xdr_read_success", 0)
	calcStats["xdr_read_reqs"] = stats.TryInt("xdr_read_success", 0) +
		stats.TryInt("xdr_read_error", 0) +
		stats.TryInt("xdr_read_notfound", 0)

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

	if _, exists := stats["device_total_bytes"]; exists {
		calcStats["used-bytes-disk"] = stats.TryInt("device_used_bytes", 0)
		calcStats["total-bytes-disk"] = stats.TryInt("device_total_bytes", 0)
		calcStats["free-bytes-disk"] = stats.TryInt("total-bytes-disk", 0) - stats.TryInt("used-bytes-disk", 0)
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
	calcStats["hwm-breached"] = stats.TryString("hwm_breached", "")
	calcStats["master-objects"] = stats.TryInt("master_objects", 0)
	calcStats["master-sub-objects"] = stats.TryInt("master_sub_objects", 0)
	calcStats["max-void-time"] = stats.TryInt("max_void_time", 0)
	calcStats["free-pct-memory"] = stats.TryFloat("memory_free_pct", 0)
	calcStats["used-bytes-memory"] = stats.TryInt("memory_used_bytes", 0)
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
