package main

import (
	"fmt"
	"log"
	"math/rand"
	"runtime"
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

var client *as.Client

var wg sync.WaitGroup

const udfBody = `function testFunc1(rec, div)
   local ret = map()                     -- Initialize the return value (a map)

   local x = (rec['age'] or 50) / div                 -- Get the value from record bin named "bin1"

   ret['status'] = 'OK'                   -- Populate the return status
   return ret                             -- Return the Return value and/or status
end`

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	rand.Seed(time.Now().UTC().UnixNano())

	fmt.Println("Connecting...")

	var err error
	cp := as.NewClientPolicy()
	// cp.User = "admin"
	// cp.Password = "admin"
	client, err = as.NewClientWithPolicy(cp, "vmu1804", 3000)
	if err != nil {
		log.Fatalf("Error creating aerospike client: %+v\n", err)
	}

	if !client.IsConnected() {
		log.Fatalf("Error, not connected to database: %+v\n", err)
	}

	defer client.Close()

	log.Println("HERE!")

	regTask, err := client.RegisterUDF(nil, []byte(udfBody), "udfEcho.lua", as.LUA)
	if err != nil {
		panic(err)
	}
	// wait until UDF is created
	<-regTask.OnComplete()

	times := int(1e9)
	count := 5
	wg.Add(6*count + 1)

	log.Println("Creating records...")
	put(1e4)

	log.Println("Records created, generating load...")
	for i := 0; i < count; i++ {
		go put(times)
		go get(times)
		go query(times)
		go scan(times)
		go batch(times)
		go udf(times)
	}

	wg.Wait()
	fmt.Println("done.")
}

func scan(times int) {
	defer wg.Done()
	// no duplicate index is allowed
	tsk, err := client.CreateIndex(nil, "test", "test", "idxTestiAge", "age", as.NUMERIC)
	if err != nil {
		log.Println(err)
		//return
	} else {
		if err = <-tsk.OnComplete(); err != nil {
			log.Println(err)
			//return
		}
	}

L:
	for i := 0; i < times; i++ {
		championSet, err := client.ScanAll(nil, "test", "test")
		if err != nil {
			log.Printf("Error scanning records: %+v\n", err)
			continue L
		}

	RS:
		for res := range championSet.Results() {
			if res.Err != nil {
				log.Printf("Error scanning records: %+v\n", res.Err)
				break RS
			}
		}

		// log.Println("Scan finished.")
		// time.Sleep(time.Second)
	}
}

func put(times int) {
	defer wg.Done()
	for i := 0; i < times; i++ {
		key, err := as.NewKey("test", "test", i%1e4)
		wp := as.NewWritePolicy(0, 0)
		err = client.Put(wp, key, as.BinMap{"name": "K", "age": rand.Intn(60)})
		if err != nil {
			log.Println(err)
		}
	}
}

func get(times int) {
	defer wg.Done()
	for i := 0; i < times; i++ {
		key, _ := as.NewKey("test", "test", rand.Intn(1e4))
		_, err := client.Get(nil, key)
		if err != nil {
			log.Println(err)
		}
	}
}

func query(times int) {
	defer wg.Done()
L:
	for i := 0; i < times; i++ {
		stmt := as.NewStatement("test", "test")
		from := rand.Int63n(60)
		aRange := rand.Int63n(10)
		stmt.SetFilter(as.NewRangeFilter("age", from, from+aRange))
		championSet, err := client.Query(nil, stmt)
		if err != nil {
			log.Printf("Error query records: %+v\n", err)
			continue L
		}

	RS:
		for res := range championSet.Results() {
			if res.Err != nil {
				log.Printf("Error query records: %+v\n", res.Err)
				break RS
			}
		}
		// log.Println("Query finished.")
		// time.Sleep(time.Second)
	}
}

func batch(times int) {
	defer wg.Done()
	for i := 0; i < times; i++ {
		keys := []*as.Key{}
		kCount := rand.Intn(50) + 1
		for i := 0; i < kCount; i++ {
			key, _ := as.NewKey("test", "test", rand.Intn(1e4))
			keys = append(keys, key)
		}

		bpolicy := as.NewBatchPolicy()
		// bpolicy.UseBatchDirect = true
		_, err := client.BatchGet(bpolicy, keys, "age")
		if err != nil {
			log.Println(err)
		}
	}
}

func udf(times int) {
	defer wg.Done()
	for i := 0; i < times; i++ {
		key, _ := as.NewKey("test", "test", rand.Intn(1e4))
		_, err := client.Execute(nil, key, "udfEcho", "testFunc1", as.NewValue(i%3))
		if err != nil {
			log.Println(err)
		}
	}
}
