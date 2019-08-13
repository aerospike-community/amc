package main

import (
	"flag"
	"log"
	_ "net/http/pprof"
	"runtime"
	"strconv"
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

	for i := 0; i < 1000000; i++ {

		key, err := as.NewKey("test", "test", "mykey"+strconv.Itoa(i))
		if err != nil {
			log.Println(err)
		}

		bin := as.NewBin("mybin", "myvalue "+strconv.Itoa(i))

		err = client.PutBins(policy, key, bin)

		if err != nil {
			log.Println(err)
		}
	}

}
