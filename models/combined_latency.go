package models

import (
	"time"

	"github.com/citrusleaf/amc/common"
	"github.com/labstack/gommon/log"
)

type CombinedLatency map[string]map[string]Latencies // map[op][nodehost]Latencies

// group the latencies by ops
func _byops(stats []map[string]common.Stats) map[string][]common.Stats {
	m := map[string][]common.Stats{} // map of ops to its stats
	for _, stat := range stats {
		for op, s := range stat {
			m[op] = append(m[op], s)
		}
	}
	return m
}

func newCombinedClusterLatency(cluster *Cluster, from, to time.Time) CombinedLatency {
	m := map[string]map[string]Latencies{} // map[op][nodehost]Latencies

	// fetch latencies from all the nodes
	for _, nd := range cluster.Nodes() {
		if arr := nd.Latency(from, to); arr != nil {
			for op, stats := range _byops(arr) {
				if _, ok := m[op]; !ok {
					m[op] = make(map[string]Latencies, 0)
				}

				id := nd.Address()
				m[op][id] = newLatencies(stats)
			}
		}
	}

	return CombinedLatency(m)
}

func newCombinedNamespaceLatency(lns *LogicalNamespace, from, to time.Time) CombinedLatency {
	m := map[string]map[string]Latencies{} // map[op][nodehost]Latencies

	// fetch latencies from all the namespaces
	for _, ns := range lns.namespaces() {
		if arr := ns.Latency(from, to); arr != nil {
			for op, stats := range _byops(arr) {
				if _, ok := m[op]; !ok {
					m[op] = make(map[string]Latencies, 0)
				}

				id := ns.NodeAddress()
				m[op][id] = newLatencies(stats)
			}
		}
	}

	return CombinedLatency(m)
}

func (cl CombinedLatency) ops() []string {
	var ops []string
	for op, _ := range cl {
		ops = append(ops, op)
	}
	return ops
}

// mergeLatency merges the latency from all nodes for the operation
func (cl CombinedLatency) mergeLatency(op string) Latencies {
	var all []Latencies
	for _, lats := range cl[op] {
		all = append(all, lats)
	}

	if len(all) == 0 {
		return nil
	}

	l := all[0]
	l = l.append(all[1:]...)
	return l.merge()
}

// merge the latencies from all the nodes
func (cl CombinedLatency) merge() []map[string]common.Stats {
	m := map[string]Latencies{} // m[op]Latencies

	for op, _ := range cl {
		m[op] = cl.mergeLatency(op)
	}

	// it might be the case that the latencies for different operations might
	// have been merged by different times. now it needs to combined such that
	// the operations at the same time are grouped in one bucket.

	// everything is split into buckets of the longest latency
	var maxlat Latencies // the latency with the longest length
	var maxlen int
	for _, l := range m {
		if n := l.nstats(); n > maxlen {
			maxlat = l
			maxlen = n
		}
	}

	// final merged array
	arr := make([]map[string]common.Stats, maxlen)
	for i := 0; i < maxlen; i++ {
		arr[i] = map[string]common.Stats{}
	}

	// since everything is merged only by the longest latency, get the map of
	// timestamp to index in the merged array.
	timemap := maxlat.timemap()

	for op, lats := range m {
		for _, lat := range lats {
			t := lat.timestampUnix()

			if i, ok := timemap[t]; ok {
				arr[i][op] = lat.toStat()
			} else {
				log.Warnf("time %d not present for operation %s\n", t, op)
			}
		}
	}

	return arr
}

func (cl CombinedLatency) hasOutliers() bool {
	m := cl.outliers()
	return len(m) > 0
}

// outliers returns all the nodes which are outliers for the operations
// map[op] = []string // nodehosts
func (cl CombinedLatency) outliers() map[string][]string {
	m := map[string][]string{}
	for op, _ := range cl {
		if l := cl.outlier(op); len(l) > 0 {
			m[op] = l
		}
	}
	return m
}

// returns node hosts which are outliers for the given operation
func (cl CombinedLatency) outlier(op string) []string {
	var avgs []float64
	for _, lat := range cl[op] {
		x := lat.avgLatency()
		avgs = append(avgs, x)
	}

	// assume distribution is normal
	isOutlier := normOutlier(avgs)

	var nodes []string
	for id, lat := range cl[op] {
		avg := lat.avgLatency()
		if isOutlier(avg) {
			nodes = append(nodes, id)
		}
	}

	return nodes
}
