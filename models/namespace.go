package models

import (
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"

	// "github.com/sasha-s/go-deadlock"
	// log "github.com/Sirupsen/logrus"

	"github.com/Cistern/catena"
	as "github.com/aerospike/aerospike-client-go"
	ast "github.com/aerospike/aerospike-client-go/types"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/rrd"
)

var _recordedNamespaceStats = []string{
	"stat_read_success", "stat_read_reqs",
	"stat_write_success", "stat_write_reqs",

	"batch_read_success", "batch_read_reqs",

	"scan_success", "scan_reqs",
	"query_success", "query_reqs",

	"xdr_read_success", "xdr_read_reqs",
	"xdr_write_success", "xdr_write_reqs",

	"udf_success", "udf_reqs",
}

type latestFetch struct {
	throughput    map[string]float64
	throughputTPS map[string]float64
	// latency    map[string]float64

	time time.Time
}

type Namespace struct {
	node *Node

	name       string
	latestInfo common.SyncInfo
	indexInfo  common.SyncInfo

	latestStats  common.SyncStats
	calcStats    common.SyncStats
	latencystats common.SyncValue

	latestFetch common.SyncValue // *latestFetch
	// throughputStats common.SyncValue // map[string]float64
	// lastFetch       common.SyncValue // time.Time - unix timestamp

	// statsHistory   map[string]*rrd.Bucket
	latencyHistory *rrd.SimpleBucket
}

func NewNamespace(node *Node, name string) *Namespace {
	ns := &Namespace{
		node: node,
		name: name,
		// statsHistory:   map[string]*rrd.Bucket{},
		latencyHistory: rrd.NewSimpleBucket(5, 3600),
		latestFetch:    common.NewSyncValue(nil),
	}

	// for _, stat := range _recordedNamespaceStats {
	// 	ns.statsHistory[stat] = rrd.NewBucket(ns.node.cluster.UpdateInterval(), 3600, true)
	// }

	return ns
}

func (ns *Namespace) Name() string {
	return ns.name
}

func (ns *Namespace) URI() string {
	return fmt.Sprintf("//aerospike.com/amc/%s/%s/%s", ns.node.cluster.Id(), ns.node.origHost.String(), ns.Name())
}

func (ns *Namespace) Drop() error {
	defer ns.node.update()

	client := ns.node.cluster.origClient()
	if client == nil {
		return errors.New("Node is not connected.")
	}

	wp := as.NewWritePolicy(0, 0)
	wp.Timeout = 5 * time.Second

	if err := client.Truncate(wp, ns.name, "", nil); err != nil {
		return err
	}

	return ns.node.update()
}

func (ns *Namespace) DropSet(setName string) error {
	client := ns.node.cluster.origClient()
	if client == nil {
		return errors.New("Node is not connected.")
	}

	wp := as.NewWritePolicy(0, 0)
	wp.Timeout = 5 * time.Second

	if err := client.Truncate(wp, ns.name, setName, nil); err != nil {
		return err
	}

	return ns.node.update()
}

func (ns *Namespace) ServerTime() time.Time {
	if v := ns.latestStats.TryInt("current_time", 0); v != 0 {
		return time.Unix(v+ast.CITRUSLEAF_EPOCH, 0)
	}
	return time.Time{}
}

func (ns *Namespace) ServerDelta() int64 {
	if lf := ns.latestFetch.Get(); lf == nil {
		return -1
	}

	oldT := ns.latestFetch.Get().(*latestFetch).time.Unix()
	newT := ns.ServerTime().Unix()

	return newT - oldT
}

func (ns *Namespace) update(info common.Info) error {
	defer ns.notifyAboutChanges()

	ns.setInfo(info)
	ns.setAliases()
	ns.updateHistory()
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

	ns.indexInfo.SetInfo(common.Info(info))
	return nil
}

func (ns *Namespace) updateLatencyInfo(latStats map[string]common.Stats) {
	if len(latStats) == 0 {
		ns.latencystats.Set(nil)
		return
	}
	ns.latencystats.Set(latStats)
}

// func (ns *Namespace) updateThroughputInfo(timestamp int64, throughputStats map[string]float64) {
// 	if len(throughputStats) == 0 {
// 		ns.throughputStats.Set(nil)
// 		return
// 	}
// 	ns.throughputStats.Set(throughputStats)

// 	uri := ns.URI()
// 	db := common.TSDB()

// 	// persist throughput
// 	for op, stat := range throughputStats {
// 		db.InsertRows([]catena.Row{
// 			catena.Row{
// 				Source: uri,
// 				Metric: op,
// 				Point: catena.Point{
// 					Timestamp: timestamp,
// 					Value:     stat,
// 				},
// 			},
// 		},
// 		)
// 	}
// }

func (ns *Namespace) setInfo(stats common.Info) {
	ns.latestInfo.SetInfo(stats)
	ns.latestStats.SetStats(stats.ToInfo("namespace/" + ns.name).ToStats())
}

func (ns *Namespace) InfoAttrs(names ...string) common.Info {
	var res common.Info
	if len(names) == 0 {
		res = ns.latestInfo.Clone()
	} else {
		res = ns.latestInfo.GetMulti(names...)
	}
	return res
}

func (ns *Namespace) InfoAttr(name string) string {
	return ns.latestInfo.TryString(name, "")
}

func (ns *Namespace) StatsAttrs(names ...string) common.Stats {
	var res common.Stats
	if len(names) == 0 {
		res = ns.latestStats.Clone()
		ns.calcStats.CloneInto(res)
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
	if val := ns.latestStats.Get(name); val != nil {
		return val
	}
	return ns.calcStats.Get(name)
}

func (ns *Namespace) aggStats(agg, calcAgg common.Stats) {
	ns.latestStats.AggregateStatsTo(agg)
	ns.calcStats.AggregateStatsTo(calcAgg)
}

func (ns *Namespace) Disk() common.Stats {
	return common.Stats{
		"used-bytes-disk":  ns.calcStats.TryInt("used-bytes-disk", 0),
		"free-bytes-disk":  ns.calcStats.TryInt("free-bytes-disk", 0),
		"total-bytes-disk": ns.calcStats.TryInt("total-bytes-disk", 0),
	}
}

func (ns *Namespace) DiskPercent() common.Stats {
	return common.Stats{
		"free-pct-disk":       strconv.Itoa(int(ns.calcStats.TryInt("free-pct-disk", 0))),
		"high-water-disk-pct": strconv.Itoa(int(ns.latestStats.TryInt("high-water-disk-pct", 0))),
	}
}

func (ns *Namespace) Memory() common.Stats {
	return common.Stats{
		"used-bytes-memory":  ns.calcStats.TryInt("used-bytes-memory", 0),
		"free-bytes-memory":  ns.calcStats.TryInt("free-bytes-memory", 0),
		"total-bytes-memory": ns.calcStats.TryInt("total-bytes-memory", 0),
	}
}

func (ns *Namespace) MemoryPercent() common.Stats {
	return common.Stats{
		"free-pct-memory":       strconv.Itoa(int(ns.calcStats.TryInt("free-pct-memory", 0))),
		"high-water-memory-pct": strconv.Itoa(int(ns.latestStats.TryInt("high-water-memory-pct", 0))),
	}
}

func (ns *Namespace) IndexStats(name string) common.Stats {
	return ns.indexInfo.ToInfo("sindex/" + ns.name + "/" + name).ToStats()
}

func (ns *Namespace) updateHistory() {
	tm := ns.ServerTime().Unix()

	serverDelta := ns.ServerDelta()
	throughputStats := make(map[string]float64, len(_recordedNamespaceStats))
	throughputTPS := make(map[string]float64, len(_recordedNamespaceStats))
	oldStats := ns.latestFetch.Get()

	// persist throughput
	uri := ns.URI()
	db := common.TSDB()
	for _, stat := range _recordedNamespaceStats {
		val := ns.calcStats.TryFloat(stat, 0)
		throughputStats[stat] = val
		if oldStats != nil {
			val -= oldStats.(*latestFetch).throughput[stat]
		}

		// only persist if serverDelta is >= 1
		if serverDelta >= 1 {
			throughputTPS[stat] = math.Ceil(val / float64(serverDelta))
			db.InsertRows([]catena.Row{
				catena.Row{
					Source: uri,
					Metric: stat,
					Point: catena.Point{
						Timestamp: tm,
						Value:     math.Ceil(val / float64(serverDelta)),
					},
				},
			},
			)
		}
	}

	// update the node's latest throughput stats
	latestFetch := &latestFetch{
		throughput:    throughputStats,
		throughputTPS: throughputTPS,

		time: ns.ServerTime(),
	}
	ns.latestFetch.Set(latestFetch)

	if ll := ns.LatestLatency(); ll != nil {
		ns.latencyHistory.Add(tm, ll)
	}
}

func (ns *Namespace) setAliases() {
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
	if exists := stats.Get("device_total_bytes"); exists != nil {
		calcStats["used-bytes-disk"] = stats.TryInt("device_used_bytes", 0)
		calcStats["total-bytes-disk"] = stats.TryInt("device_total_bytes", 0)
		calcStats["free-bytes-disk"] = common.MaxInt64(0, stats.TryInt("device_total_bytes", 0)-stats.TryInt("device_used_bytes", 0))
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
	calcStats["free-bytes-memory"] = common.MaxInt64(0, stats.TryInt("memory-size", 0)-stats.TryInt("memory_used_bytes", 0))
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

	ns.calcStats.SetStats(calcStats)
}

func (ns *Namespace) SetsInfo() map[string]common.Stats {
	res := ns.latestInfo.ToStatsMap("sets/"+ns.name, "set", ":")
	for k, v := range res {
		// alias the keys
		v["ns_name"] = v.Get("ns")
		v["set_name"] = v.Get("set")
		v["n_objects"] = v.Get("objects")
		v["stop-write-count"] = v.Get("stop-writes-count")
		v["delete"] = v.Get("deleting")
		v["evict-hwm-count"] = common.NOT_SUPPORTED
		v["enable-xdr"] = v.Get("set-enable-xdr")

		res[k] = v
	}

	return res
}

func (ns *Namespace) Stats() common.Stats {
	nsStats := ns.StatsAttrs("master-objects", "master_tombstones", "prole-objects", "prole_tombstones")
	res := common.Stats{
		"memory":                    ns.Memory(),
		"memory-pct":                ns.MemoryPercent(),
		"disk":                      ns.Disk(),
		"disk-pct":                  ns.DiskPercent(),
		"master-objects-tombstones": fmt.Sprintf("%v / %v", common.Comma(nsStats.TryInt("master-objects", 0), ","), common.Comma(nsStats.TryInt("master_tombstones", 0), ",")),
		"prole-objects-tombstones":  fmt.Sprintf("%v / %v", common.Comma(nsStats.TryInt("prole-objects", 0), ","), common.Comma(nsStats.TryInt("prole_tombstones", 0), ",")),
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

	res["raw_stats"] = ns.StatsAttrs()

	return res
}

func (ns *Namespace) ConfigAttrs(names ...string) common.Stats {
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

func (ns *Namespace) notifyAboutChanges() {
	go ns.updateNotifications()
}

func (ns *Namespace) updateNotifications() error {
	latestStats := ns.latestStats.Clone()
	ns.calcStats.CloneInto(latestStats)

	ns.CheckAvailablePct(latestStats)
	ns.CheckDiskPctHighWatermark(latestStats)
	ns.CheckDiskPctStopWrites(latestStats)
	ns.CheckMemoryPctHighWatermark(latestStats)
	ns.CheckMemoryPctStopWrites(latestStats)

	return nil
}

func (ns *Namespace) LatestThroughput() map[string]map[string]*common.SinglePointValue {
	// statsHistory is not written to, so it doesn't need synchronization
	if ns.latestFetch.Get() == nil {
		return nil
	}

	ts := ns.latestFetch.Get().(*latestFetch).throughputTPS
	res := make(map[string]map[string]*common.SinglePointValue, len(ts))
	// zeroVal := float64(0)

	tm := ns.latestFetch.Get().(*latestFetch).time.Unix()
	for name, val := range ts {
		if ns.node.valid() {
			// if val == nil {
			// 	tm := ns.node.ServerTime().Unix()
			// 	val = common.NewSinglePointValue(&tm, &zeroVal)
			// }
			spVal := common.NewSinglePointValue(&tm, &val)
			res[name] = map[string]*common.SinglePointValue{ns.name: spVal}
		}
		// else {
		// 	tm := ns.node.ServerTime().Unix()
		// 	spVal := common.NewSinglePointValue(&tm, &zeroVal)
		// 	res[name] = map[string]*common.SinglePointValue{ns.name: spVal}
		// }
	}

	return res
}

func (ns *Namespace) Throughput(from, to time.Time) map[string]map[string][]*common.SinglePointValue {
	// if no tm specified, return for the last 30 mins
	if from.IsZero() {
		from = ns.node.ServerTime().Add(-time.Minute * 30)
	}
	if to.IsZero() {
		to = ns.node.ServerTime()
	}

	// statsHistory is not written to, so it doesn't need synchronization
	res := make(map[string]map[string][]*common.SinglePointValue, len(_recordedNamespaceStats))
	zeroVal := float64(0)
	st := ns.node.ServerTime().Unix()

	uri := ns.URI()
	db := common.TSDB()

	for _, name := range _recordedNamespaceStats {
		it, err := db.NewIterator(uri, name)
		if err != nil {
			res[name] = map[string][]*common.SinglePointValue{
				ns.name: []*common.SinglePointValue{common.NewSinglePointValue(&st, &zeroVal)},
			}
			continue
		}
		defer it.Close()

		if err := it.Seek(from.Unix()); err != nil {
			return res
		}

		var vs []*common.SinglePointValue
		for {
			if err := it.Next(); err != nil {
				break
			}

			point := it.Point()
			vs = append(vs, common.NewSinglePointValue(&point.Timestamp, &point.Value))
		}

		if len(vs) == 0 {
			vs = []*common.SinglePointValue{common.NewSinglePointValue(&st, &zeroVal)}
		}

		res[name] = map[string][]*common.SinglePointValue{
			ns.name: vs,
		}
	}

	return res
}

// isMemoryStorageEngine returns true iff the namespace storage engine is memory
func (ns *Namespace) isMemoryStorageEngine() bool {
	return ns.latestStats.TryString("storage-engine", "") == "memory"
}

// ObjectSize returns the object size histogram for the namespace
func (ns *Namespace) ObjectSize() Histogram {
	if ns.isMemoryStorageEngine() {
		return nil
	}

	cmd := objszInfoCmd(ns.name)
	hist := parseHistogram(ns.latestInfo.TryString(cmd, ""))
	if hist.NBuckets() == 0 {
		return nil
	}

	rblock := 128 // default byte size of the read block
	bwidth := rblock * ns.objszBucketWidth() / hist.NBuckets()
	hist.Apply(func(b *HistBucket, _ int) {
		b.Min *= bwidth
		b.Max *= bwidth
	})

	return hist
}

// objszBucketWidth returns the bucket width of the object size histogram
func (ns *Namespace) objszBucketWidth() int {
	config := ns.ConfigAttrs()
	return int(config.TryInt("obj-size-hist-max", 100))
}

// TimeToLive returns the time to live histogram for the namespace
func (ns *Namespace) TimeToLive() Histogram {
	cmd := ttlInfoCmd(ns.name)
	hist := ns.latestInfo.TryString(cmd, "")
	return parseHistogram(hist)
}

func (ns *Namespace) LatestLatency() map[string]common.Stats {
	res := ns.latencystats.Get()
	if res == nil {
		return nil
	}
	return res.(map[string]common.Stats)
}

func (ns *Namespace) Latency(from, to time.Time) []map[string]common.Stats {
	// if no tm specified, return for the last 30 mins
	if from.IsZero() {
		from = ns.node.ServerTime().Add(-time.Minute * 30)
	}
	if to.IsZero() {
		to = ns.node.ServerTime()
	}

	vs := ns.latencyHistory.ValuesBetween(from, to)
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

func (ns *Namespace) NodeAddress() string {
	return ns.node.Address()
}
