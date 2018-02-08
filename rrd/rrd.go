package rrd

import (
	"sync"
	"time"

	// "github.com/sasha-s/go-deadlock"
	// log "github.com/Sirupsen/logrus"

	"github.com/citrusleaf/amc/common"
	timeseries "github.com/khaf/go-time-series"
)

type Bucket struct {
	// this flag determines if the values passed to the bucket are total counts,
	// and should be converted to deltas
	rollingTotal bool

	lastValue        *float64
	lastRollingValue *float64
	lastTimestamp    *int64

	resolution float64

	ts *timeseries.TimeSeries

	mutex sync.RWMutex
}

func NewBucket(resolution, size int, rollingTotal bool) *Bucket {
	ts, err := timeseries.NewTimeSeries(timeseries.TSTypeSum,
		timeseries.WithGranularities(
			[]timeseries.Granularity{
				{Granularity: time.Second, Count: 1800}, // half an hour every second
				// {Granularity: time.Minute, Count: 60 * 24}, // then 60 mins summed on minute
				// {Granularity: time.Hour, Count: 24 * 90},   // 24 hours grouped by hour
				// {Granularity: time.Hour * 24, Count: 31}, // 31 days hourly average
			}))
	if err != nil {
		panic(err)
	}

	return &Bucket{
		rollingTotal: rollingTotal,
		resolution:   float64(resolution),
		ts:           ts,
	}
}

func (b *Bucket) Add(timestamp int64, val float64) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

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

func (b *Bucket) Skip(tm int64) {
	// nothing to do
}

func (b *Bucket) SetResolution(resolution int) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	b.resolution = float64(resolution)
}

func (b *Bucket) ValuesSince(tm time.Time) []*common.SinglePointValue {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	tsr, err := b.ts.RangeValues(tm, time.Now())
	if err != nil {
		return []*common.SinglePointValue{}
	}

	res := make([]*common.SinglePointValue, 0, len(tsr))
	for i := range tsr {
		t := tsr[i].Time.Unix()
		v := tsr[i].Value
		res = append(res, common.NewSinglePointValue(&t, &v))
	}

	return res
}

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
