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
	if timestamp < *b.beginTime ||
		(b.lastTimestamp != nil && timestamp < *b.lastTimestamp) {
		return
	}

	var newOffset, delta int64
	var emptyTicks int
	if b.lastTimestamp != nil {
		delta = timestamp - *b.lastTimestamp

		emptyTicks = int(delta / int64(b.resolution))
		newOffset = int64(b.offset + emptyTicks)
	} else {
		delta = timestamp - *b.beginTime

		newOffset = delta / int64(b.resolution)
		emptyTicks = int(newOffset) - b.offset
	}

	// if same value is sent for the same timestamp, don't add it up for rolling totals
	if newOffset == int64(b.offset) && val == *b.lastValue && b.rollingTotal {
		return
	}

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
		if delta != 0 {
			// spread the values across the time window
			val = (val - *b.lastValue) / float64(delta) * float64(b.resolution)
		} else {
			val = (val - *b.lastValue)
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

func (b *Bucket) isEmpty() bool {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	return b.beginTime == nil || b.lastTimestamp == nil
}

func (b *Bucket) timeToOffset(tm time.Time) *int {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	if b.beginTime == nil || tm.Unix() < *b.beginTime || (b.lastTimestamp != nil && tm.Unix() > *b.lastTimestamp) {
		return nil
	}

	offset := int((tm.Unix() - *b.beginTime) / int64(b.resolution))
	return &offset
}

func (b *Bucket) currentOffset() *int {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	if b.beginTime == nil {
		return nil
	}

	offset := int((time.Now().Unix() - *b.beginTime) / int64(b.resolution))
	return &offset
}

func (b *Bucket) ValuesBetween(from, to time.Time) []*common.SinglePointValue {
	// if map is empty,
	if b.isEmpty() || from.Unix() > *b.lastTimestamp || to.Unix() < *b.beginTime || from.After(to) {
		return []*common.SinglePointValue{}
	}

	if from.Unix() < *b.beginTime {
		from = time.Unix(*b.beginTime, 0)
	}

	b.mutex.RLock()
	defer b.mutex.RUnlock()

	if to.Unix() > *b.lastTimestamp {
		to = time.Unix(*b.lastTimestamp, 0)
	}

	// these cannot be nil, we have adjusted the query time values already
	fromOffset := *b.timeToOffset(from)
	toOffset := *b.timeToOffset(to)
	if fromOffset < toOffset-b.Size() {
		fromOffset = toOffset - b.Size()
	}

	res := make([]*common.SinglePointValue, 0, toOffset-fromOffset+1)
	for i := fromOffset; i <= toOffset; i++ {
		tm := *b.beginTime + int64(i*b.resolution)
		if b.values[i%b.Size()] != nil {
			v := math.Floor(*b.values[i%b.Size()] / float64(b.resolution))
			res = append(res, common.NewSinglePointValue(&tm, &v))
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
