package common

import "sync"

// SyncValue struct
type SyncValue struct {
	value interface{}
	mutex sync.RWMutex
}

// NewSyncValue - new sync value
func NewSyncValue(val interface{}) SyncValue {
	return SyncValue{
		value: val,
	}
}

// Get - get sync value
func (sv *SyncValue) Get() interface{} {
	sv.mutex.RLock()
	v := sv.value
	sv.mutex.RUnlock()
	return v
}

// Set - set sync value
func (sv *SyncValue) Set(val interface{}) {
	sv.mutex.Lock()
	sv.value = val
	sv.mutex.Unlock()
}
