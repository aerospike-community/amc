package main

import (
	"fmt"
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"
)

func main() {
	asl.Logger.SetLevel(asl.INFO)

	client, err := as.NewClient("192.168.178.56", 3000)
	if err != nil {
		panic(err)
	}

	var (
		namespace = "test"
		setName   = "bm"
	)

	writePolicy := as.NewWritePolicy(0, 0)
	writePolicy.Timeout = 50 * time.Millisecond
	wg := sync.WaitGroup{}
	for c := 0; c < 1; c++ {
		key, err := as.NewKey(namespace, setName, fmt.Sprintf("key%d", c))
		if err != nil {
			panic(err)
		}
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := 0; ; i++ {
				if i%1000 == 0 {
					fmt.Printf("i: %d\n", i)
				}
				if err = client.Put(writePolicy, key, as.BinMap{"mybin": i}); err != nil {
					fmt.Printf("client.Put: %v\n", err)
					// panic(err)
				}
			}
		}()
	}
	wg.Wait()
}
