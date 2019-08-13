package main

import (
	"flag"
	"fmt"
	"log"
	_ "net/http/pprof"
	"os"
	"runtime"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

var WritePolicy = as.NewWritePolicy(0, 0)
var Policy = as.NewPolicy()

var Host = flag.String("h", "127.0.0.1", "Aerospike server seed hostnames or IP addresses")
var Port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var Namespace = flag.String("n", "test", "Aerospike namespace.")
var Set = flag.String("s", "testset", "Aerospike set name.")
var initdb = flag.Bool("i", false, "Write all keys to the db.")
var concurrency = flag.Int("c", 32, "Concurrency level.")
var showUsage = flag.Bool("u", false, "Show usage information.")
var profileMode = flag.Bool("profile", false, "Run benchmarks with profiler active on port 6060.")

func PanicOnError(err error) {
	if err != nil {
		log.Fatalln(err.Error())
	}
}

func printParams() {
	log.Printf("hosts:\t\t%s", *Host)
	log.Printf("port:\t\t%d", *Port)
	log.Printf("namespace:\t\t%s", *Namespace)
	log.Printf("set:\t\t%s", *Set)
}

/////////////////////////////////////////////////////////////////

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	flag.Parse()

	printParams()

	cpolicy := as.NewClientPolicy()
	cpolicy.ConnectionQueueSize = 300
	cpolicy.LimitConnectionsToQueueSize = true
	client, err := as.NewClient(*Host, *Port)
	PanicOnError(err)

	policy := as.NewWritePolicy(0, 0)
	policy.Timeout = 50 * time.Millisecond

	// for i := 0; i < 1e5; i++ {
	// 	key, _ := as.NewKey(*Namespace, *Set, i)
	// 	err = client.Put(nil, key, as.BinMap{"val": i})
	// 	if err != nil {
	// 		log.Fatal(err)
	// 	}
	// }

	keys := []*as.Key{}
	for i := 0; i < 10; i++ {
		key, _ := as.NewKey(*Namespace, *Set, i)
		keys = append(keys, key)
	}

	ch := make(chan bool)

	log.Println("BatchGet running...")
	for t := 0; t < 16; t++ {
		go func() {
			defer func() {
				if r := recover(); r != nil {
					fmt.Println("Recovered in f", r)
					os.Exit(0)
				}
			}()

			for i := 0; i < 1000000; i++ {
				recs, err := client.BatchGet(nil, keys)
				if err != nil {
					log.Println(err)
				}
				for j, rec := range recs {
					if rec == nil {
						log.Println(j)
						continue
					}
					if j != rec.Bins["val"].(int) {
						log.Fatal("Wrong value in record...")
					}
				}
			}
		}()
	}

	<-ch
}
