// Copyright 2013-2019 Aerospike, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"runtime"
	"sync"
	"sync/atomic"
	"testing"
)

var wg sync.WaitGroup

const (
	gorountines = 1e4
	loops       = 1e4
)

var cntr uint64 = 0

func doWorkAtomic(b *testing.B) {
	for i := 0; i < b.N; i++ {
		atomic.AddUint64(&cntr, 1)
	}
	wg.Done()
}

func Benchmark_Atomic(b *testing.B) {
	b.N = loops
	wg.Add(gorountines)
	for i := 0; i < gorountines; i++ {
		go doWorkAtomic(b)
	}
	wg.Wait()
}

/////////////////////////////////////////////

func doWorkLocked(b *testing.B) {
	for i := 0; i < b.N; i++ {
		su64.incSync()
	}
	wg.Done()
}

type syncUint64 struct {
	v uint64
	m sync.Mutex
}

func (su *syncUint64) incSync() {
	su.m.Lock()
	su.v++
	su.m.Unlock()
}

var su64 = syncUint64{}

func Benchmark_Lock(b *testing.B) {
	b.N = loops
	wg.Add(gorountines)
	for i := 0; i < gorountines; i++ {
		go doWorkLocked(b)
	}
	wg.Wait()
}

func init() {
	runtime.GOMAXPROCS(runtime.NumCPU())
}
