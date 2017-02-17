package common

import "sync"

type SyncValue struct {
	value interface{}
	mutex sync.RWMutex
}

func NewSyncValue(val interface{}) SyncValue {
	return SyncValue{
		value: val,
	}
}

func (sv *SyncValue) Get() interface{} {
	sv.mutex.RLock()
	v := sv.value
	sv.mutex.RUnlock()
	return v
}

func (sv *SyncValue) Set(val interface{}) {
	sv.mutex.Lock()
	sv.value = val
	sv.mutex.Unlock()
}
