package models

import (
	"sort"
	"strconv"
	"strings"

	"github.com/citrusleaf/amc/common"
)

// -------------------------------------------
// Latency is a stat of a single operation
type Latency common.Stats

func newLatency(stat common.Stats) Latency {
	return Latency(stat)
}

// time returns the total time taken to complete this operation
func (lat Latency) time() float64 {
	b := lat.buckets()
	tps := lat.tps()

	var sum, total float64
	for i, v := range lat.valBuckets() {
		weight := float64(b[i])
		sum += v / 100.0 * tps * weight
		total += float64(b[i])
	}

	// for the first threshold taking the value of the
	// firstbucket/2
	weight := float64(b[0] / 2)
	pct := 100 - total
	sum += pct / 100.0 * tps * weight
	return sum
}

func (lat Latency) toStat() common.Stats {
	return common.Stats(lat)
}

func (lat Latency) tps() float64 {
	s := common.Stats(lat)
	return s.TryFloat("tps", 0)
}

func (lat Latency) nbuckets() int {
	return len(lat.strbuckets())
}

func (lat Latency) strbuckets() []string {
	s := common.Stats(lat)
	return s["buckets"].([]string)
}

// buckets returns the bucket widths
func (lat Latency) buckets() []int {
	sbuckets := lat.strbuckets()

	var buckets []int
	for _, b := range sbuckets {
		b = strings.TrimPrefix(b, ">")
		b = strings.TrimSuffix(b, "ms")
		n, _ := strconv.Atoi(b)
		buckets = append(buckets, n)
	}
	return buckets
}

// valBuckets returns the value of the buckets
func (lat Latency) valBuckets() []float64 {
	s := common.Stats(lat)
	return s["valBuckets"].([]float64)
}

// timestamp returns the literal timestamp
func (lat Latency) timestamp() string {
	s := common.Stats(lat)
	return s["timestamp"].(string)
}

func (lat Latency) timestampUnix() int64 {
	s := common.Stats(lat)
	return s.TryInt("timestamp_unix", 0)
}

//----------------------------
type Latencies []Latency

func newLatencies(stats []common.Stats) Latencies {
	var arr []Latency
	for _, s := range stats {
		arr = append(arr, newLatency(s))
	}

	l := Latencies(arr)
	sort.Sort(l)
	return l
}

func (lats Latencies) append(others ...Latencies) Latencies {
	stats := lats.toStats()
	for _, o := range others {
		stats = append(stats, o.toStats()...)
	}

	return newLatencies(stats)
}

func (lats Latencies) toStats() []common.Stats {
	var stats []common.Stats
	for _, s := range lats {
		stats = append(stats, s.toStat())
	}

	return stats
}

// statisfy the sort interface
func (lats Latencies) Len() int           { return lats.nstats() }
func (lats Latencies) Swap(i, j int)      { lats[i], lats[j] = lats[j], lats[i] }
func (lats Latencies) Less(i, j int) bool { return lats[i].timestampUnix() < lats[j].timestampUnix() }

// nstats returns the number of statistics
func (lats Latencies) nstats() int {
	return len(lats)
}

// timemap returns the map of the time to the index in the latencies
func (lats Latencies) timemap() map[int64]int {
	m := map[int64]int{}
	for i, l := range lats {
		t := l.timestampUnix()
		m[t] = i
	}
	return m
}

// mergedBuckets returns the buckets if they were merged
func (lats Latencies) mergedBuckets() []int {
	var m []int

	for _, stat := range lats {
		i := 0
		for _, b := range stat.buckets() {
			if len(m) < i+1 {
				m = append(m, 0)
			}
			if b > m[i] {
				m[i] = b
			}
			i++
		}
	}

	// slice till the valid point
	var i int
	for i = 1; i < len(m); i++ {
		if m[i-1] > m[i] {
			break
		}
	}

	return m[:i]
}

// distributes the values of the given bucket widths into buckets of newWidths
func _distributeBuckets(newWidths []int, widths []int, vals []float64) []float64 {
	b := make([]float64, len(newWidths))

	for i := 0; i < len(widths); {
		var j int
		for j = i; j < len(widths); j++ {
			if widths[j] > newWidths[i] {
				break
			}
			b[i] += vals[j]
		}
		i = j
	}
	return b
}

// _toStrBuckets converts the buckets to the string representation
func _toStrBuckets(buckets []int) []string {
	var b []string
	for _, v := range buckets {
		b = append(b, ">"+strconv.Itoa(v)+"ms")
	}
	return b
}

// merge merges all the latency statistics within a second
func (lats Latencies) merge() Latencies {
	var newstats []Latency

	buckets := lats.mergedBuckets()
	for i := 0; i < len(lats); {
		var ntps float64 // total number of tps
		lat := lats[i]
		tps := make([]float64, len(buckets)) // sum of tps in each bucket

		// merge data points collected within a second of each other
		var j int
		for j = i; j < len(lats); j++ {
			v := lats[j]
			if v.timestampUnix()-lat.timestampUnix() > 1 {
				break // merge values within a second
			}

			ntps += v.tps()

			merged := _distributeBuckets(buckets, v.buckets(), v.valBuckets())
			for i, n := range merged {
				num := n / 100.0 * v.tps() // n/100 * tps
				tps[i] += num
			}
		}
		i = j

		// convert to percentage
		valBuckets := make([]float64, len(tps))
		for i, _ := range tps {
			var v float64
			if ntps != 0 {
				v = tps[i] / ntps * 100.0
			}
			valBuckets[i] = v
		}

		m := map[string]interface{}{
			"buckets":        _toStrBuckets(buckets),
			"timestamp":      lat.timestamp(),
			"timestamp_unix": lat.timestampUnix(),
			"tps":            ntps,
			"valBuckets":     valBuckets,
		}
		mstat := common.Stats(m)

		newstats = append(newstats, newLatency(mstat))
	}

	return Latencies(newstats)
}

// avgLatency returns average latency across all the the latencies
func (lats Latencies) avgLatency() float64 {
	var tps, time float64
	for _, l := range lats {
		time += l.time()
		tps += l.tps()
	}

	if tps == 0 {
		return 0
	}
	return time / tps
}

func (lats Latencies) totalTPS() float64 {
	var n float64
	for _, lat := range lats {
		n += lat.tps()
	}

	return n
}
