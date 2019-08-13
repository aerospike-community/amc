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

package aerospike_test

import (
	"sync"
	"testing"

	as "github.com/aerospike/aerospike-client-go"
)

func Benchmark_Connection(b *testing.B) {
	policy := as.NewClientPolicy()
	policy.User = *user
	policy.Password = *password

	wg := new(sync.WaitGroup)
	wg.Add(128)

	for i := 0; i < 128; i++ {
		go func(wg *sync.WaitGroup) {
			defer wg.Done()
			for i := 0; i < b.N; i++ {
				conn, _ := as.NewConnection(policy, as.NewHost(*host, *port))
				conn.Close()
			}
		}(wg)
	}

	wg.Wait()
}
