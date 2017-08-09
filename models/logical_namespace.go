package models

import (
	"sort"
	"time"

	"github.com/citrusleaf/amc/common"
)

// LogicalNamespace represents a namespace in a cluster.
//
// LogicalNamespace aggregates all statistics across a cluster.
type LogicalNamespace struct {
	cluster *Cluster
	name    string
}

func newLogicalNamespace(cluster *Cluster, name string) *LogicalNamespace {
	return &LogicalNamespace{
		cluster: cluster,
		name:    name,
	}
}

// combineHistograms combines the histograms for all the nodes.
func (ns *LogicalNamespace) combineHistograms(fn func(*Namespace) Histogram) Histogram {
	var hist []Histogram

	for _, namespace := range ns.namespaces() {
		if h := fn(namespace); h != nil {
			hist = append(hist, h)
		}
	}

	if len(hist) == 0 {
		return nil
	}

	h := hist[0]
	return h.CombineWith(hist[1:]...)
}

// TimeToLive returns the time to live histogram for the namespace.
func (ns *LogicalNamespace) TimeToLive() Histogram {
	return ns.combineHistograms(func(ns *Namespace) Histogram {
		return ns.TimeToLive()
	})
}

// ObjectSize returns the object size histogram for the namespace.
func (ns *LogicalNamespace) ObjectSize() Histogram {
	return ns.combineHistograms(func(ns *Namespace) Histogram {
		return ns.ObjectSize()
	})
}

// Name returns the name of the namespace.
func (ns *LogicalNamespace) Name() string {
	return ns.name
}

// Latency returns the latency of the namespace.
func (ns *LogicalNamespace) Latency(from, to time.Time) []map[string]common.Stats {
	latencies := map[string][]common.Stats{} // map of operation to the statistic

	// fill latencies
	for _, namespace := range ns.namespaces() {
		if lat := namespace.Latency(from, to); lat != nil {
			for _, l := range lat {
				for op, stat := range l {
					latencies[op] = append(latencies[op], stat)
				}
			}
		}
	}

	// combine latencies
	for op, stats := range latencies {
		s := newLatencies(stats)
		m := s.merge()
		latencies[op] = m.toStats()
	}

	// convert to array
	max := 0
	for op, _ := range latencies {
		if n := len(latencies[op]); n > max {
			max = n
		}
	}

	arr := make([]map[string]common.Stats, max)
	for i := 0; i < max; i++ {
		arr[i] = map[string]common.Stats{}
	}

	for op, stats := range latencies {
		for i, stat := range stats {
			arr[i][op] = stat
		}
	}

	return arr
}

// Throughput returns the throughput of the namespace.
func (ns *LogicalNamespace) Throughput(from, to time.Time) map[string]map[string][]*common.SinglePointValue {
	throughputs := map[string][]*common.SinglePointValue{} // map of statistic name to all the statistics

	// fill throughputs
	for _, namespace := range ns.namespaces() {
		if tp := namespace.Throughput(from, to); tp != nil {
			for name, mvals := range tp {
				vals := mvals[ns.Name()]
				throughputs[name] = append(throughputs[name], vals...)
			}
		}
	}

	// combine throughputs
	for name, vals := range throughputs {
		throughputs[name] = aggregrateThroughputs(vals)
	}

	// convert to throughput map
	m := map[string]map[string][]*common.SinglePointValue{}
	for name, vals := range throughputs {
		m[name] = make(map[string][]*common.SinglePointValue)
		m[name][ns.Name()] = vals
	}

	return m
}

// tpByTime implements the sorting interface.
// Sorts the single point values by time.
type tpByTime []*common.SinglePointValue

func (tp tpByTime) Len() int           { return len(tp) }
func (tp tpByTime) Swap(i, j int)      { tp[i], tp[j] = tp[j], tp[i] }
func (tp tpByTime) Less(i, j int) bool { return *tp[i].Timestamp(1) < *tp[j].Timestamp(1) }

// aggregrateThroughputs combines the values within a second
func aggregrateThroughputs(vals []*common.SinglePointValue) []*common.SinglePointValue {
	sort.Sort(tpByTime(vals))

	zero := float64(0)
	var agg []*common.SinglePointValue
	for i := 0; i < len(vals); {
		time := *vals[i].Timestamp(1)

		var sum float64
		var j int
		for j = i; j < len(vals); j++ {
			if t := *vals[j].Timestamp(1); t-time > 1 {
				break // merge only if within a second
			}
			sum += *vals[j].Value(&zero)
		}
		i = j

		spv := common.NewSinglePointValue(&time, &sum)
		agg = append(agg, spv)
	}

	return agg
}

// Bins returns the bins of the namespace.
func (ns *LogicalNamespace) Bins() {
}

// Sets returns the sets of the namespace.
func (ns *LogicalNamespace) Sets() {
}

// Indexes returns the indexes of the namespace.
func (ns *LogicalNamespace) Indexes() {
}

// namespaces returns all the namespace instances on all the nodes.
func (ns *LogicalNamespace) namespaces() []*Namespace {
	var namespaces []*Namespace

	for _, n := range ns.cluster.Nodes() {
		if nspace := n.NamespaceByName(ns.name); nspace != nil {
			namespaces = append(namespaces, nspace)
		}
	}

	return namespaces
}
