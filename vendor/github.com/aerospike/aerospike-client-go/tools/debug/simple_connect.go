package main

import (
	"bytes"
	"flag"
	"fmt"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"
	"runtime"
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"
)

var Host = flag.String("h", "vmu1604", "Aerospike server seed hostnames or IP addresses.")
var Port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var User = flag.String("U", "admin", "Database Username.")
var Pass = flag.String("P", "admin", "Database User Password.")
var debugMode = flag.Bool("d", false, "Run in debug mode.")

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	flag.Parse()

	var buf bytes.Buffer
	logger := log.New(&buf, "", log.LstdFlags|log.Lshortfile)
	logger.SetOutput(os.Stdout)

	// use all cpus in the system for concurrency
	log.Printf("Setting number of CPUs to use: %d", runtime.NumCPU())
	runtime.GOMAXPROCS(runtime.NumCPU())

	if *debugMode {
		asl.Logger.SetLogger(logger)
		asl.Logger.SetLevel(asl.DEBUG)
	}

	// runtime.SetBlockProfileRate(1)
	go func() {
		logger.Println(http.ListenAndServe(":6061", nil))
	}()

	// connect to the host
	clientPolicy := as.NewClientPolicy()
	clientPolicy.User = *User
	clientPolicy.Password = *Pass

	// clientPolicy.AuthMode = as.AuthModeExternal

	//	clientPolicy.FailIfNotConnected = false
	clientPolicy.Timeout = 10 * time.Second
	// clientPolicy.ConnectionQueueSize = 1
	clientPolicy.IdleTimeout = time.Second * 3

	h := []*as.Host{
		as.NewHost(*Host, *Port),
		// as.NewHost("192.168.32.57", 3000),
		// as.NewHost("ubvm", 3000),
		// as.NewHost("ubvm2", 3000),
		// as.NewHost("192.168.32.573", 3000),
	}
	client, err := as.NewClientWithPolicyAndHost(clientPolicy, h...)
	if err != nil {
		log.Fatalln(err.Error())
	}

	fmt.Println("============================================================")

	go doGets(client)
	for i := 0; i < 60; i++ {
		go doBursts(client)
	}

	// to avoid the GC drop the client
	t5 := time.After(30 * time.Second)
	t1 := time.After(1 * time.Second)
	for {
		select {
		case <-t5:
			for i := 0; i < 32; i++ {
				go doBursts(client)
			}

			t5 = time.After(30 * time.Second)
		case <-t1:
			// log.Printf("Cluster has: %d nodes...", len(client.GetNodes()))
			// stats, err := client.Stats()
			// if err != nil {
			// 	continue
			// }
			// b, _ := json.MarshalIndent(stats, "  ", "  ")
			// log.Printf("Cluster stats:", string(b))

			t1 = time.After(time.Second)

			// conn, err := client.GetNodes()[0].GetConnection(10 * time.Second)
			// if err != nil {
			// 	log.Println(err)
			// 	break
			// }

			// log.Println(conn.IsConnected())
			// i, err := as.RequestInfo(conn, "version")
			// if err != nil {
			// 	log.Println(err)
			// 	break
			// }
			// log.Println(i)
		}
	}

	wg := new(sync.WaitGroup)
	wg.Add(1)
	wg.Wait()
}

func doGets(client *as.Client) {
	// key, _ := as.NewKey("test", "test", 1)
	// for {
	// 	err := client.Put(nil, key, as.BinMap{"bin1": 1})
	// 	if err != nil {
	// 		println(err.Error())
	// 	}

	// 	_, err = client.Get(nil, key)
	// 	if err != nil {
	// 		println(err.Error())
	// 	}
	// 	time.Sleep(time.Millisecond * 100)
	// }
}

func doBursts(client *as.Client) {
	// for i := 0; i < 10000; i++ {
	// 	key, _ := as.NewKey("test", "test", 1)
	// 	client.Get(nil, key)
	// 	if i%2000 == 0 {
	// 		println("still going")
	// 	}
	// }
}
