package rrd

import (
	"math"
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"
)

type SimpleBucket struct {
	beginTime  *int64
	resolution int

	values []interface{}
	offset int // determines the offset from beginTime in resolution steps

	mutex sync.RWMutex
}

func NewSimpleBucket(resolution, size int) *SimpleBucket {
	log.Info("creating bucket...")
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

	if b.beginTime == nil {
		b.beginTime = &timestamp
	}

	var newOffset int64 = (timestamp - *b.beginTime) / int64(b.resolution)
	emptyTicks := int(newOffset) - b.offset

	if emptyTicks >= b.Size() {
		for i := range b.values {
			b.values[i] = nil
		}
	} else if emptyTicks > 1 {
		for i := 1; i < emptyTicks; i++ {
			b.values[(b.offset-i)%b.Size()] = nil
		}
	}

	b.offset = int(newOffset)
	b.values[b.offset%b.Size()] = &val
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

	if count > b.Size() {
		count = b.Size()
	}

	if count > b.offset {
		count = b.offset + 1
	}

	res := make([]interface{}, 0, count)
	for i := b.offset - count + 1; i <= b.offset; i++ {
		res = append(res, b.values[i%b.Size()])
	}

	return res
}

func (b *SimpleBucket) LastValue() interface{} {
	b.mutex.RLock()
	defer b.mutex.RUnlock()

	// if bucket is empty,
	if b.beginTime == nil {
		return nil
	}

	offset := b.offset % b.Size()
	// tm := *b.beginTime + int64(b.offset)*int64(b.resolution)
	if b.values[offset] != nil {
		return b.values[offset]
	}
	return nil
}
