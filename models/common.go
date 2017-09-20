package models

import (
	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
)

func toSystemResource(stats common.Stats, rtype string) *app.AerospikeAmcResourceUsageResponse {
	if _, ok := stats[rtype]; ok {
		stats = stats.Get(rtype).(common.Stats)
	}
	result := &app.AerospikeAmcResourceUsageResponse{
		UsedBytes: stats.TryFloat("used-bytes-"+rtype, 0),
		FreeBytes: stats.TryFloat("free-bytes-"+rtype, 0),
	}

	result.TotalBytes = result.UsedBytes + result.FreeBytes

	return result
}
