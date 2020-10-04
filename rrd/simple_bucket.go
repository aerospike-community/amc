package rrd

import (
	"math"
	"sync"
	"time"

	// "github.com/sasha-s/go-deadlock"
	// log "github.com/Sirupsen/logrus"

	"github.com/aerospike-community/amc/common"
)

type SimpleBucket struct {
	beginTime  *int64
	resolution int

	values []interface{}
	offset int // determines the offset from beginTime in resolution steps

	lastValue     interface{}
	lastTimestamp *int64

	mutex sync.RWMutex
}

func NewSimpleBucket(resolution, size int) *SimpleBucket {
	if !common.AMCIsProd() {
		// log.Info("creating bucket...")
	}
	return &SimpleBucket{
		resolution: 5,
		values:     make([]interface{}, size),
	}
}

func (b *SimpleBucket) Size() int {
	return len(b.values)
}

func (b *SimpleBucket) Add(timestamp int64, val interface{}) {
	b.mutex.Lock()
	defer b.mutex.Unlock()

	// don't add out of order timestamps
	if b.lastTimestamp != nil && *b.lastTimestamp > timestamp {
		return
	}

	if b.beginTime == nil {
		b.beginTime = &timestamp
	}

	// protect against values set in the past
	if timestamp < *b.beginTime {
		return
	}

	var newOffset int64 = (timestamp - *b.beginTime) / int64(b.resolution)
	emptyTicks := int(newOffset) - b.offset

	if emptyTicks >= b.Size() {
		for i := range b.values {
			b.values[i] = nil
		}
	} else if emptyTicks > 1 {
		for i := b.offset; i <= emptyTicks; i++ {
			b.values[i%b.Size()] = &val
		}
	}

	b.offset = int(newOffset)
	b.values[b.offset%b.Size()] = &val
	b.lastTimestamp = &timestamp
	b.lastValue = val
}

func (b *SimpleBucket) ValuesSince(tm time.Time) []interface{} {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// if map is empty,
	if b.beginTime == nil {
		return []interface{}{}
	}

	if tm.Unix() < *b.beginTime {
		tm = time.Unix(*b.beginTime, 0)
	}
	count := int(math.Ceil(float64((*b.beginTime+int64(b.offset*b.resolution))-tm.Unix()) / float64(b.resolution)))

	if count <= 0 {
		return []interface{}{}
	}

	if count > b.Size() {
		count = b.Size()
	}

	if count > b.offset {
		count = b.offset + 1
	}

	res := make([]interface{}, 0, count)
	for i := b.offset - count + 1; i <= b.offset; i++ {
		if v := b.values[i%b.Size()]; v != nil {
			res = append(res, v)
		}
	}

	return res
}

func (b *SimpleBucket) LastValue() interface{} {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	return b.lastValue
}
