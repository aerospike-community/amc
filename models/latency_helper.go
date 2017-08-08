package models

import (
	"sort"
	"strconv"
	"strings"

	"github.com/citrusleaf/amc/common"
)

// latByTime implements the sorting interface.
// Sorts the single point values by time.
type latByTime []common.Stats

func (lat latByTime) Len() int      { return len(lat) }
func (lat latByTime) Swap(i, j int) { lat[i], lat[j] = lat[j], lat[i] }
func (lat latByTime) Less(i, j int) bool {
	return lat[i].TryInt("timestamp_unix", 0) < lat[j].TryInt("timestamp_unix", 0)
}

// _toIntBuckets converts the buckets to integers
func _toIntBuckets(buckets []string) []int {
	var v []int
	for _, b := range buckets {
		b = strings.TrimPrefix(b, ">")
		b = strings.TrimSuffix(b, "ms")
		n, _ := strconv.Atoi(b)
		v = append(v, n)
	}
	return v
}

// _mergeBuckets returns a new bucket with the buckets merged
func _mergeBuckets(all [][]int) []int {
	var m []int

	for _, buckets := range all {
		i := 0
		for _, b := range buckets {
			if len(m) < i+1 {
				m = append(m, 0)
			}
			if b > m[i] {
				m[i] = b
			}
			i++
		}
	}

	var i int
	for i = 1; i < len(m); i++ {
		if m[i] < m[i-1] {
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

// _newBucketWidths returns width of the new buckets as of the statistics
func _newBucketWidths(vals []common.Stats) []int {
	var m [][]int

	for i := 0; i < len(vals); i++ {
		buckets := _toIntBuckets(vals[i]["buckets"].([]string))
		m = append(m, buckets)
	}

	return _mergeBuckets(m)
}

// _toStrBuckets converts the buckets to the string representation
func _toStrBuckets(buckets []int) []string {
	var b []string
	for _, v := range buckets {
		b = append(b, "<"+strconv.Itoa(v)+"ms")
	}
	return b
}

// aggregateLatencies aggregates latencies into common buckets
func aggregateLatencies(latencies []common.Stats) []common.Stats {
	sort.Sort(latByTime(latencies))

	newBuckets := _newBucketWidths(latencies)

	var agg []common.Stats
	for i := 0; i < len(latencies); {
		var tps float64
		lat := latencies[i]
		timestamp := lat.TryInt("timestamp_unix", 0)
		valBuckets := make([]float64, len(newBuckets)) // sum of tps in each bucket

		// merge data points collected within a second of each other
		var j int
		for j = i; j < len(latencies); j++ {
			v := latencies[j]
			if t := v.TryInt("timestamp_unix", 0); t-timestamp > 1 {
				break // merge values within a second
			}

			tps += v.TryFloat("tps", 0)

			buckets := _toIntBuckets(v["buckets"].([]string))
			vals := v["valBuckets"].([]float64)
			merged := _distributeBuckets(newBuckets, buckets, vals)
			for i, n := range merged {
				num := n / 100.0 * v.TryFloat("tps", 0) // n/100 * tps
				valBuckets[i] += num
			}
		}
		i = j

		// convert to percentage
		if tps != 0 {
			for k := 0; k < len(valBuckets); k++ {
				valBuckets[k] = valBuckets[k] / tps * 100.0
			}
		}

		m := map[string]interface{}{
			"buckets":        _toStrBuckets(newBuckets),
			"timestamp":      lat["timestamp"].(string),
			"timestamp_unix": timestamp,
			"tps":            tps,
			"valBuckets":     valBuckets,
		}

		agg = append(agg, m)
	}

	return agg
}
