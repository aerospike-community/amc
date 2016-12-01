package common

type JsonRawString string

// MarshalJSON returns *m as the JSON encoding of m.
func (m *JsonRawString) MarshalJSON() ([]byte, error) {
	return []byte(*m), nil
}

type NodeResult struct {
	Name string
	Err  error
}

type IndexType string

var indexType = struct {
	STRING  IndexType
	NUMERIC IndexType
}{"string", "numeric"}

// type Metric struct {
// 	Timestamp      int64
// 	Total, Success int64
// }

// type MetricQueue struct {
// 	metrics []*Metric
// 	pos     int
// 	mutex   sync.RWMutex
// }

// func NewMetricQueue(capacity int) *MetricQueue {
// 	return &MetricQueue{
// 		metrics: make([]*Metric, capacity, capacity),
// 		pos:     0,
// 	}
// }

// func (mq *MetricQueue) Peek() *Metric {
// 	mq.mutex.RLock()
// 	defer mq.mutex.RUnlock()

// 	if mq.pos > 0 || mq.pos >= len(mq.metrics) {
// 		return mq.metrics[mq.pos%len(mq.metrics)]
// 	}
// 	return nil
// }

// func (mq *MetricQueue) PeekAll() []*Metric {
// 	mq.mutex.RLock()
// 	defer mq.mutex.RUnlock()

// 	l := len(mq.metrics)
// 	if mq.pos >= l {
// 		result := make([]*Metric, l)
// 		for i := mq.pos; i < mq.pos+l; i++ {
// 			result[i-mq.pos] = mq.metrics[i%l]
// 		}
// 		return result
// 	}

// 	// less elements than capacity
// 	result := make([]*Metric, mq.pos)
// 	for i := 0; i < mq.pos; i++ {
// 		result[i] = mq.metrics[mq.pos]
// 	}
// 	return result
// }

// func (mq *MetricQueue) Append(metric *Metric) {
// 	mq.mutex.Lock()
// 	defer mq.mutex.Unlock()

// 	mq.metrics[mq.pos%len(mq.metrics)] = metric
// 	mq.pos++
// }
