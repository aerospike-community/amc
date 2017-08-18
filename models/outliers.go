package models

import (
	"math"
	"sort"
)

type isOutlier func(float64) bool

// normOutlier calculates outliers based on the assumption that
// the vals are drawn from a normal distribution
func normOutlier(vals []float64) isOutlier {
	trimean := _trimean(vals)
	stddev := _stddev(vals, trimean)

	isoutlier := func(v float64) bool {
		return math.Abs(v-trimean) > 2*stddev
	}
	return isoutlier
}

// trimean is more robust against outliers
func _trimean(vals []float64) float64 {
	sort.Float64s(vals)

	n := float64(len(vals))
	i := int(math.Ceil(0.25*n)) - 1 // 25th quantile
	j := int(math.Ceil(0.50*n)) - 1 // 50th quantile
	k := int(math.Ceil(0.75*n)) - 1 // 75th quantile

	return (vals[i] + 2*vals[j] + vals[k]) / 4
}

func _stddev(vals []float64, mean float64) float64 {
	var sum float64

	for _, v := range vals {
		sum += math.Pow(v-mean, 2)
	}

	if len(vals) < 2 {
		return 0
	}

	n := float64(len(vals))
	x := sum / (n - 1)
	return math.Sqrt(x)
}
