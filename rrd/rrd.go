package rrd

import (
	"math"
	"sync"
	"time"

	// "github.com/sasha-s/go-deadlock"
	// log "github.com/Sirupsen/logrus"

	"github.com/citrusleaf/amc/common"
)

type Bucket struct {
	// this flag determines if the values passed to the bucket are total counts,
	// and should be converted to deltas
	rollingTotal      bool
	lastValue         *float64
	lastHistoricValue *float64
	lastTimestamp     *int64

	resolution int // secs

	beginTime *int64

	values []*float64
	offset int // determines the offset from beginTime in resolution steps

	mutex sync.RWMutex
}

func NewBucket(resolution, size int, rollingTotal bool) *Bucket {
	if !common.AMCIsProd() {
		// log.Info("creating bucket...")
	}
	return &Bucket{
		rollingTotal: rollingTotal,
		resolution:   resolution,
		values:       make([]*float64, size),
	}
}

func (b *Bucket) Size() int {
	return len(b.values)
}

func (b *Bucket) Resolution() int {
	return b.resolution
}

func (b *Bucket) Add(timestamp int64, val float64) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	// don't add out of order timestamps
	if b.lastTimestamp != nil && *b.lastTimestamp > timestamp {
		return
	}

	originalVal := val

	if b.beginTime == nil && b.lastValue == nil {
		b.lastValue = &val
		return
	} else if b.beginTime == nil {
		b.beginTime = &timestamp
	} else if b.rollingTotal && b.lastValue != nil && *b.lastValue > val {
		*b.lastValue = val
		return
	}

	// protect against values set in the past
	if timestamp < *b.beginTime {
		return
	}

	var newOffset int64 = (timestamp - *b.beginTime) / int64(b.resolution)

	// if same value is sent for the same timestamp, don't add it up for rolling totals
	if newOffset == int64(b.offset) && val == *b.lastValue && b.rollingTotal {
		return
	}

	emptyTicks := int(newOffset) - b.offset

	if !b.rollingTotal {
		if emptyTicks >= b.Size() {
			for i := range b.values {
				b.values[i] = nil
			}
		} else if emptyTicks > 1 {
			for i := 1; i < emptyTicks; i++ {
				b.values[(b.offset-i)%b.Size()] = nil
			}
		}
	} else {
		// val is a rolling total
		// it should be converted to a delta: val - lastVal
		// if there are empty ticks, all will be filled with the delta
		if emptyTicks > 1 {
			val = math.Floor(((val - *b.lastValue) / float64(emptyTicks)))
		} else {
			val = val - *b.lastValue
		}

		if val < 0 {
			val = 0
		}

		if emptyTicks >= b.Size() {
			for i := range b.values {
				b.values[i] = &val
			}
		} else if emptyTicks > 1 {
			for i := b.offset; i <= emptyTicks; i++ {
				b.values[i%b.Size()] = &val
			}
		}
	}

	b.offset = int(newOffset)
	b.values[b.offset%b.Size()] = &val
	b.lastValue = &originalVal
	b.lastHistoricValue = &val
	b.lastTimestamp = &timestamp
}

func (b *Bucket) Skip(tm int64) {
	if b.lastValue != nil {
		b.Add(tm, *b.lastValue)
	}
}

func (b *Bucket) ValuesSince(tm time.Time) []*common.SinglePointValue {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// if map is empty,
	if b.offset == -1 || b.beginTime == nil {
		if b.LastValue() != nil {
			return []*common.SinglePointValue{b.LastValue()}
		}
		return []*common.SinglePointValue{}
	}

	if tm.Unix() < *b.beginTime {
		tm = time.Unix(*b.beginTime, 0)
	}
	count := int(math.Ceil(float64((*b.beginTime+int64(b.offset*b.resolution))-tm.Unix()) / float64(b.resolution)))

	if count <= 0 {
		return []*common.SinglePointValue{}
	}

	if count > b.Size() {
		count = b.Size()
	}

	if count > b.offset {
		count = b.offset + 1
	}

	res := make([]*common.SinglePointValue, 0, count)
	for i := b.offset - count + 1; i <= b.offset; i++ {
		tm := *b.beginTime + int64(i*b.resolution)
		if b.values[i%b.Size()] != nil {
			v := math.Floor(*b.values[i%b.Size()] / float64(b.resolution))
			res = append(res, common.NewSinglePointValue(&tm, &v))
			// } else {
			// 	res = append(res, common.NewSinglePointValue(&tm, nil))
		}
	}

	return res
}

func (b *Bucket) LastValue() *common.SinglePointValue {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// if bucket is empty,
	if b.lastTimestamp == nil {
		return nil
	}

	tm := *b.lastTimestamp
	val := float64(*b.lastHistoricValue) / float64(b.resolution)
	return common.NewSinglePointValue(&tm, &val)
}
