package main

import (
	"bytes"
	"flag"
	"log"
	"os"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"
)

var Host = flag.String("h", "127.0.0.1", "Aerospike server seed hostnames or IP addresses")
var Port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var Namespace = flag.String("n", "test", "Aerospike namespace.")
var Set1 = flag.String("s1", "headers", "Headers set name.")
var Set2 = flag.String("s2", "items", "Items set name.")
var initdb = flag.Bool("i", false, "Write all keys to the db first. Only one run is necessary.")
var concurrency = flag.Int("c", 8, "Concurrency level.")
var recCount = flag.Int("r", 1e3, "Record Count.")

var wg sync.WaitGroup

func main() {
	println("1. Num goroutines:", runtime.NumGoroutine())
	runtime.GOMAXPROCS(runtime.NumCPU())
	flag.Parse()

	var buf bytes.Buffer
	logger := log.New(&buf, "", log.LstdFlags|log.Lshortfile)
	logger.SetOutput(os.Stdout)
	asl.Logger.SetLogger(logger)
	asl.Logger.SetLevel(asl.DEBUG)

	// connect to the host
	clientPolicy := as.NewClientPolicy()
	client, err := as.NewClientWithPolicy(clientPolicy, *Host, *Port)
	if err != nil {
		log.Fatalln(err.Error())
	}

	println("2. Num goroutines after making client:", runtime.NumGoroutine())

	log.Println("Cluster seeds: ", client.Cluster().GetSeeds())

	if *initdb {
		log.Println("Writing records to the db...")
		initDB(client)
		log.Println("Writing records to the db done.")
	}

	println("3. Num goroutines after init:", runtime.NumGoroutine())

	wg.Add(*concurrency)

	// for {
	// 	select {
	// 	case <-time.After(time.Second * 10):
	// 		key, _ := as.NewKey(*Namespace, *Set2, "item"+strconv.Itoa(1))
	// 		client.Delete(nil, key)
	// 	}
	// }

	for i := 0; i < *concurrency; i++ {
		go scan(i, client)
	}

	wg.Wait()

	client.Close()
	time.Sleep(5 * time.Second)
	println("4. Num goroutines at the end (should be 1):", runtime.NumGoroutine())
}

func initDB(client *as.Client) {
	recordset, _ := client.ScanAll(nil, *Namespace, *Set1)
	for res := range recordset.Results() {
		if res.Err == nil {
			client.Delete(nil, res.Record.Key)
		}
	}

	recordset, _ = client.ScanAll(nil, *Namespace, *Set2)
	for res := range recordset.Results() {
		if res.Err == nil {
			client.Delete(nil, res.Record.Key)
		}
	}

	filler := strings.Repeat("a", 100)
	for i := 0; i < *recCount; i++ {
		key, _ := as.NewKey(*Namespace, *Set1, i)

		client.Put(nil, key, as.BinMap{
			"itemcount": i,
			"name":      "name" + strconv.Itoa(i),
			"filler":    filler,
		})
	}

	for i := 0; i < *recCount; i++ {
		key, _ := as.NewKey(*Namespace, *Set2, "item"+strconv.Itoa(i))
		client.Put(nil, key, as.BinMap{
			"value":  1,
			"filler": filler,
		})
	}
}

func scan(id int, client *as.Client) {
	defer wg.Done()

	for i := 0; i < 50; i++ {
		sp := as.NewScanPolicy()
		// sp.RecordQueueSize = 1
		recordset, err := client.ScanAll(sp, *Namespace, *Set1)
		if err != nil {
			log.Printf("=============================== Err On scan: %s\n", err)
			continue
		}
		// if rand.Int31n(100) < 10 {
		// 	time.Sleep(time.Second * 15)
		// }
		// tm := time.Now()
		cnt := 0
		for res := range recordset.Results() {
			if res.Err != nil {
				log.Printf("=============================== Err During scan: %s\n", res.Err.Error())
				continue
			}
			cnt++
			// sum := 0
			// for i := 0; i < res.Record.Bins["itemcount"].(int); i++ {
			// 	key := fmt.Sprintf("item%d", i)
			// 	itemKey, _ := as.NewKey(*Namespace, *Set2, key)
			// 	rec, err := client.Get(nil, itemKey)
			// 	if err != nil {
			// 		log.Printf("=============================== Error during get: %s\n", err)
			// 		break
			// 	}
			// 	sum += rec.Bins["value"].(int)
			// }
			// log.Printf("%d: Found sum for %s of %d, took: %s\n", id, res.Record.Bins["name"], sum, time.Since(tm))
		}
		// log.Printf("scan took: %s for %d records...\n", time.Since(tm), cnt)
	}
}
