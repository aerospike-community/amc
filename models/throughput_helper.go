package models

import (
	"sort"

	"github.com/citrusleaf/amc/common"
)

// tpByTime implements the sorting interface.
// Sorts the single point values by time.
type tpByTime []*common.SinglePointValue

func (tp tpByTime) Len() int           { return len(tp) }
func (tp tpByTime) Swap(i, j int)      { tp[i], tp[j] = tp[j], tp[i] }
func (tp tpByTime) Less(i, j int) bool { return *tp[i].Timestamp(1) < *tp[j].Timestamp(1) }

// aggregateThroughputs combines the values within a second
func aggregateThroughputs(vals []*common.SinglePointValue) []*common.SinglePointValue {
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
