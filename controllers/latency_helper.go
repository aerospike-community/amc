package controllers

import (
	"time"

	"github.com/citrusleaf/amc/common"
)

type latencyEntity interface {
	Latency(from, to time.Time) []map[string]common.Stats
	LatestLatency() map[string]common.Stats
}

func latency(obj latencyEntity, ctxFrom, ctxUntil *int) []interface{} {
	var latencyData []interface{}

	if ctxFrom == nil && ctxUntil == nil {
		latency := obj.LatestLatency()
		latencyData = append(latencyData, transformLatency(latency))
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

		latencies := obj.Latency(from, to)
		for _, latency := range latencies {
			latencyData = append(latencyData, transformLatency(latency))
		}
	}

	return latencyData
}
