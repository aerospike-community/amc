package atomic

import "sync"

type Container struct {
	val interface{}
	m   sync.RWMutex
}

func NewContainer(val interface{}) *Container {
	return &Container{val: val}
}

func (c *Container) Get() interface{} {
	c.m.RLock()
	res := c.val
	c.m.RUnlock()
	return res
}

func (c *Container) Set(newVal interface{}) {
	c.m.Lock()
	c.val = newVal
	c.m.Unlock()
}
