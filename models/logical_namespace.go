package models

import (
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
	n := newNamespaceLatency(ns, from, to)
	return n.merge()
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
		throughputs[name] = aggregateThroughputs(vals)
	}

	// convert to throughput map
	m := map[string]map[string][]*common.SinglePointValue{}
	for name, vals := range throughputs {
		m[name] = make(map[string][]*common.SinglePointValue)
		m[name][ns.Name()] = vals
	}

	return m
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
