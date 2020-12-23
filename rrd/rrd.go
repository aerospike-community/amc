package rrd

import (
	"sort"
	"sync"
	"time"

	// "github.com/sasha-s/go-deadlock"
	// log "github.com/sirupsen/logrus"

	"github.com/aerospike-community/amc/common"
	timeseries "github.com/aerospike-community/amc/go-time-series"
	//timeseries "github.com/khaf/go-time-series"
)

// Bucket type struct
type Bucket struct {
	// this flag determines if the values passed to the bucket are total counts,
	// and should be converted to deltas
	rollingTotal bool

	lastValue        *float64
	lastRollingValue *float64
	lastTimestamp    *int64
	lastGC           time.Time

	resolution float64

	ts      *timeseries.TimeSeries
	tsOlder map[int64]*timeseries.TimeSeries // map[last_update]time_series

	mutex sync.RWMutex
}

// NewBucket - new RDD bucket
func NewBucket(resolution, size int, rollingTotal bool) *Bucket {
	ts, err := timeseries.NewTimeSeries(timeseries.TSTypeAvg,
		timeseries.WithGranularities(
			[]timeseries.Granularity{
				{Granularity: time.Second * time.Duration(resolution), Count: 1800}, // half an hour every second
				// {Granularity: time.Minute, Count: 60 * 24},                          // then 60 mins summed on minute
				// {Granularity: time.Hour, Count: 24 * 90},                            // 24 hours grouped by hour
				// {Granularity: time.Hour * 24, Count: 31},                            // 31 days hourly average
			}))
	if err != nil {
		panic(err)
	}

	return &Bucket{
		rollingTotal: rollingTotal,
		resolution:   float64(resolution),
		ts:           ts,
		tsOlder:      map[int64]*timeseries.TimeSeries{},
	}
}

// Add - add item to bucket
func (b *Bucket) Add(timestamp int64, val float64) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	// remove old time-series to avoid memory leaks
	if b.lastGC.IsZero() || time.Since(b.lastGC) > 30*time.Minute {
		for ts := range b.tsOlder {
			if time.Since(time.Unix(ts, 0)) > time.Hour {
				delete(b.tsOlder, ts)
			}
		}

		b.lastGC = time.Now()
	}

	if b.lastValue == nil {
		b.lastValue = &val
		v := 0.0
		b.lastRollingValue = &v

		if b.rollingTotal {
			return
		}
	}

	b.lastTimestamp = &timestamp

	if b.rollingTotal {
		if val >= *b.lastValue {
			v := (val - *b.lastValue) / b.resolution
			b.ts.IncreaseAtTime(v, time.Unix(timestamp, 0))
			*b.lastRollingValue = v
		} else {
			// the count on the server side must have been reset; add the value and substitute
			v := val / b.resolution
			b.ts.IncreaseAtTime(v, time.Unix(timestamp, 0))
			*b.lastRollingValue = v
		}
	} else {
		// otherwise add the value to the timeseries bucket
		b.ts.IncreaseAtTime(val/b.resolution, time.Unix(timestamp, 0))
	}

	*b.lastValue = val
}

// Skip - do nothing
func (b *Bucket) Skip(tm int64) {
	// nothing to do
}

// SetResolution - set bucket resolution
func (b *Bucket) SetResolution(resolution int) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	// no need to change the resolution if the one is the same
	if resolution == int(b.resolution) {
		return
	}

	ts, err := timeseries.NewTimeSeries(timeseries.TSTypeSum,
		timeseries.WithGranularities(
			[]timeseries.Granularity{
				{Granularity: time.Second * time.Duration(resolution), Count: 1800}, // half an hour every second
				// {Granularity: time.Minute, Count: 60 * 24},                          // then 60 mins summed on minute
				// {Granularity: time.Hour, Count: 24 * 90},                            // 24 hours grouped by hour
				// {Granularity: time.Hour * 24, Count: 31},                            // 31 days hourly average
			}))
	if err != nil {
		return
	}

	if b.lastTimestamp != nil {
		b.tsOlder[*b.lastTimestamp] = b.ts
	}

	b.ts = ts

	b.resolution = float64(resolution)
}

// ValuesSince - get bucket values simce time
func (b *Bucket) ValuesSince(tm time.Time) []*common.SinglePointValue {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// To store the keys in slice in sorted order
	tsList := make([]*timeseries.TimeSeries, 0, 1)
	if len(b.tsOlder) > 0 {
		keys := make([]int64, 0, len(b.tsOlder))
		tmUnx := tm.Unix()
		for ts := range b.tsOlder {
			if tmUnx < ts {
				keys = append(keys, ts)
			}
		}
		sort.Slice(keys, func(i, j int) bool { return keys[i] < keys[j] })

		for _, key := range keys {
			tsList = append(tsList, b.tsOlder[key])
		}
	}

	tsList = append(tsList, b.ts)

	res := make([]*common.SinglePointValue, 0, 128)
	for _, ts := range tsList {
		tsr, err := ts.RangeValues(tm, time.Now())
		if err != nil {
			continue
		}

		for i := range tsr {
			t := tsr[i].Time.Unix()
			v := tsr[i].Value

			res = append(res, common.NewSinglePointValue(&t, &v))
		}
	}

	if len(tsList) > 1 {
		sort.Slice(res, func(i, j int) bool { return *res[i].Timestamp(1) < *res[j].Timestamp(1) })
	}

	return res
}

// LastValue - get bucket last value
func (b *Bucket) LastValue() *common.SinglePointValue {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	if b.lastTimestamp != nil {
		if !b.rollingTotal {
			t := *b.lastTimestamp
			v := *b.lastValue / b.resolution
			return common.NewSinglePointValue(&t, &v)
		}
		t := *b.lastTimestamp
		v := *b.lastRollingValue
		return common.NewSinglePointValue(&t, &v)
	}
	return nil
}
