package main

import (
	"log"
	_ "net/http/pprof"
	"runtime"
	"sync"

	// as "github.com/aerospike/aerospike-client-go"
	xornd "github.com/aerospike/aerospike-client-go/types/rand"
)

const GoRoutines = 10

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	m := make(map[uint64]struct{}, 1e8)
	log.Println(len(m))

	var rwm sync.RWMutex
	var wg sync.WaitGroup

	wg.Add(GoRoutines)
	for j := 0; j < GoRoutines; j++ {
		go func() {
			defer wg.Done()
			// var s *as.Statement
			for i := 0; i < 1e7; i++ {
				// s = as.NewStatement("ns", "set")
				n := uint64(xornd.Int64())
				// fmt.Println(n)
				rwm.RLock()
				_, exists := m[n]
				rwm.RUnlock()

				if exists {
					log.Println(i, n)
				}

				rwm.Lock()
				m[n] = struct{}{}
				rwm.Unlock()
			}
		}()
	}

	wg.Wait()
	log.Println(len(m))
}
