package controllers

import (
	"time"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
)

type throughputEntity interface {
	Throughput(from, to time.Time) map[string]map[string][]*common.SinglePointValue
	LatestThroughput() map[string]map[string]*common.SinglePointValue
}

func throughput(obj throughputEntity, ctxFrom, ctxUntil *int) map[string]map[string][]*app.AerospikeAmcThroughputResponse {
	throughputData := map[string]map[string][]*app.AerospikeAmcThroughputResponse{}
	if ctxFrom == nil && ctxUntil == nil {
		throughput := obj.LatestThroughput()

		zeroVal := float64(0)
		for outStatName, aliases := range statsNameAliases {
			primaryVals := throughput[aliases[1]]
			secondaryVals := throughput[aliases[0]]

			statRes := make(map[string][]*app.AerospikeAmcThroughputResponse, len(primaryVals))
			for node, yValues := range primaryVals {
				statRes[node] = []*app.AerospikeAmcThroughputResponse{{Timestamp: yValues.TimestampJsonInt(nil), Successful: yValues.Value(&zeroVal), Failed: secondaryVals[node].Value(&zeroVal)}}
			}

			throughputData[outStatName] = statRes
		}
	} else {
		var to, from time.Time
		if ctxFrom != nil && ctxUntil == nil {
			from = time.Unix(int64(*ctxFrom), 0)
			to = time.Now()
		} else if ctxFrom == nil && ctxUntil != nil {
			from = time.Time{}
			to = time.Unix(int64(*ctxUntil), 0)
		} else {
			from = time.Unix(int64(*ctxFrom), 0)
			to = time.Unix(int64(*ctxUntil), 0)
		}

		throughput := obj.Throughput(from, to)

		zeroVal := float64(0)
		for outStatName, aliases := range statsNameAliases {
			primaryVals := throughput[aliases[1]]
			secondaryVals := throughput[aliases[0]]

			statRes := make(map[string][]*app.AerospikeAmcThroughputResponse, len(primaryVals))
			for label, yValues := range primaryVals {
				vals := make([]*app.AerospikeAmcThroughputResponse, 0, len(primaryVals))
				for i := range yValues {
					vals = append(vals, &app.AerospikeAmcThroughputResponse{Timestamp: yValues[i].TimestampJsonInt(nil), Successful: yValues[i].Value(&zeroVal), Failed: secondaryVals[label][i].Value(&zeroVal)})
				}

				statRes[label] = vals
			}

			throughputData[outStatName] = statRes
		}
	}

	return throughputData
}
