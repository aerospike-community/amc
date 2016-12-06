package rrd

import (
	"math"
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"

	"github.com/aerospike/aerospike-console/common"
)

type Bucket struct {
	// this flag determines if the values passed to the bucket are total counts,
	// and should be converted to deltas
	rollingTotal bool
	lastValue    *float64

	resolution int // secs

	beginTime *int64

	values []*float64
	offset int // determines the offset from beginTime in resolution steps

	mutex sync.RWMutex
}

func NewBucket(resolution, size int, rollingTotal bool) *Bucket {
	log.Info("creating bucket...")
	return &Bucket{
		rollingTotal: rollingTotal,
		resolution:   resolution,
		values:       make([]*float64, size),
	}
}

func (b *Bucket) Size() int {
	return len(b.values)
}

func (b *Bucket) Add(timestamp int64, val float64) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	originalVal := val

	if b.beginTime == nil {
		b.beginTime = &timestamp
	}

	var newOffset int64 = (timestamp - *b.beginTime) / int64(b.resolution)
	if newOffset == int64(b.offset) {
		return
	}

	emptyTicks := int(newOffset) - b.offset - 1

	if !b.rollingTotal {
		if emptyTicks >= b.Size() {
			for i := range b.values {
				b.values[i] = nil
			}
		} else if emptyTicks > 0 {
			for i := 1; i <= emptyTicks; i++ {
				b.values[(b.offset-i)%b.Size()] = nil
			}
		}
	} else {
		// if there is no last value, we cannot calulate the delta
		// assign and return
		if b.lastValue == nil {
			b.lastValue = &val
			b.beginTime = &timestamp
			return
		}

		// val is a rolling total
		// it should be converted to a delta: val - lastVal
		// if there are empty ticks, all will be filled with the delta
		val = math.Floor(((val - *b.lastValue) / float64(emptyTicks+1)))
		if val < 0 {
			val = 0
		}

		if emptyTicks >= b.Size() {
			for i := range b.values {
				b.values[i] = &val
			}
		} else if emptyTicks >= 0 {
			for i := b.offset; i < emptyTicks; i++ {
				b.values[i%b.Size()] = &val
			}
		}
	}

	b.offset = int(newOffset)
	b.values[b.offset%b.Size()] = &val
	b.lastValue = &originalVal
}

func (b *Bucket) ValuesSince(tm time.Time) []*common.SinglePointValue {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// if map is empty,
	if b.offset == 0 || b.beginTime == nil {
		return []*common.SinglePointValue{b.LastValue()}
	}

	count := int((*b.beginTime + int64(b.offset*b.resolution)) - tm.Unix()/int64(b.resolution))

	if count > b.Size() {
		count = b.Size()
	}

	if count > b.offset {
		count = b.offset
	}

	res := make([]*common.SinglePointValue, 0, count)
	for i := b.offset - 1; i >= b.offset-count; i-- {
		tm := *b.beginTime + int64(i*b.resolution)
		var val *float64
		if b.values[i%b.Size()] != nil {
			v := *b.values[i%b.Size()] / float64(b.resolution)
			val = &v
		}
		res = append(res, common.NewSinglePointValue(&tm, val))
	}

	return res
}

func (b *Bucket) LastValue() *common.SinglePointValue {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// if map is empty,
	if b.offset == 0 || b.beginTime == nil {
		tm := time.Now().Unix()
		return common.NewSinglePointValue(&tm, nil)
	}

	offset := int64(b.offset - 1)
	tm := *b.beginTime + offset*int64(b.resolution)
	var val *float64
	if b.values[int(offset)%b.Size()] != nil {
		v := *b.values[int(offset)%b.Size()] / float64(b.resolution)
		val = &v
	}
	return common.NewSinglePointValue(&tm, val)
}
