package main

import (
	"bytes"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"net"
	"net/http"
	_ "net/http/pprof"
	"os"
	"runtime"
	"runtime/trace"
	"time"

	"github.com/Pallinder/go-randomdata"
	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"
	"github.com/valyala/fasthttp"
	"go.uber.org/ratelimit"
	"golang.org/x/net/netutil"

	"github.com/json-iterator/go"
)

// use jsonitor for marshalling
var json = jsoniter.ConfigCompatibleWithStandardLibrary

var host = flag.String("h", "127.0.0.1", "Aerospike server seed hostnames or IP addresses")
var port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var namespace = flag.String("n", "test", "Aerospike namespace.")
var set = flag.String("s", "testset", "Aerospike set name.")
var keyCount = flag.Int("k", 10000, "Key/record count or key/record range.")

var user = flag.String("U", "", "User name.")
var password = flag.String("P", "", "User password.")

var timeout = flag.Int("T", 50, "Read/Write timeout in milliseconds.")
var maxRetries = flag.Int("maxRetries", 2, "Maximum number of retries before aborting the current transaction.")
var connQueueSize = flag.Int("queueSize", 256, "Maximum number of connections to pool.")

var batchSize = flag.Int("B", 10, "Batch Size. Number of keys in the batch.")
var batchNodes = flag.Int("BT", 0, "Batch Concorrenct Nodes. 0: Parallel 1: Sequnce N>1: N nodes in parallel")
var rateLimit = flag.Int("rl", 0, "Rate limit.")

var generate = flag.Bool("gen", false, "Generate Random Data first")
var noop = flag.Bool("noop", false, "Don't do any transactions with Aerospike; just return the simple string.")
var warmup = flag.Bool("warmup", false, "Fill the connection queue before starting the server.")

var fastHTTP = flag.Bool("fastHTTP", false, "Use fasthttp library for server.")
var logging = flag.Bool("log", false, "Enable logging for Aerospike client.")
var debugMode = flag.Bool("d", false, "Run benchmarks in debug mode.")
var profileMode = flag.Bool("profile", false, "Run benchmarks with profiler active on port 6060.")
var showUsage = flag.Bool("u", false, "Show usage information.")

type controller struct{}

var logger *log.Logger
var client *as.Client

// var s = strings.Repeat("a", 2048)
// var keyPrefix = strings.Repeat("k", 50)

var key *as.Key
var keys []*as.Key

var batchPolicy *as.BatchPolicy
var readPolicy *as.BasePolicy

var rl ratelimit.Limiter

func main() {
	var f *os.File
	var err error
	if *profileMode {
		f, err = os.Create("trace.out")
		if err != nil {
			panic(err)
		}
	}

	var buf bytes.Buffer
	logger = log.New(&buf, "", log.LstdFlags|log.Lshortfile)
	logger.SetOutput(os.Stdout)

	flag.Parse()

	if *rateLimit > 0 {
		logger.Println("Setting rate limit to", *rateLimit)
		rl = ratelimit.New(*rateLimit) // per second
	}

	if *showUsage {
		flag.Usage()
		os.Exit(0)
	}

	if *logging {
		asl.Logger.SetLogger(logger)
		asl.Logger.SetLevel(asl.INFO)
		if *debugMode {
			asl.Logger.SetLevel(asl.DEBUG)
		}
	}

	// use all cpus in the system for concurrency
	logger.Printf("Setting number of CPUs to use: %d", runtime.NumCPU())
	runtime.GOMAXPROCS(runtime.NumCPU())
	// runtime.GOMAXPROCS(2)

	// launch profiler if in profile mode
	if *profileMode {
		runtime.SetBlockProfileRate(1)
		go func() {
			logger.Println(http.ListenAndServe(":6061", nil))
		}()
	}

	clientPolicy := as.NewClientPolicy()
	clientPolicy.ConnectionQueueSize = *connQueueSize
	clientPolicy.User = *user
	clientPolicy.Password = *password
	clientPolicy.Timeout = 10 * time.Second
	client, err = as.NewClientWithPolicy(clientPolicy, *host, *port)
	if err != nil {
		logger.Fatalln(err)
	}
	logger.Println("Nodes Found:", client.GetNodeNames())

	if *warmup {
		cnt, err := client.WarmUp(4096) // fill up to clientPolicy.ConnectionQueueSize
		if err != nil {
			logger.Fatalln(err)
		}
		logger.Printf("Connection queue filled with %d connections.", cnt)
	}

	if *generate {
		if err := generateRandomData(client); err != nil {
			logger.Fatalln("Generating random data faild. Err:", err.Error())
		}
	}

	go func() {
		for {
			select {
			case <-time.Tick(5 * time.Second):
				stats, _ := client.Stats()
				b, err := json.MarshalIndent(stats, "", "  ")
				if err != nil {
					fmt.Println("error:", err)
				}
				logger.Println(string(b))
				logger.Println("===================================================")
			}
		}
	}()

	readPolicy = as.NewPolicy()
	readPolicy.TotalTimeout = time.Duration(*timeout) * time.Millisecond
	readPolicy.SocketTimeout = time.Duration(*timeout) * time.Millisecond
	readPolicy.MaxRetries = *maxRetries
	readPolicy.SleepBetweenRetries = 1 * time.Millisecond
	// readPolicy.SleepMultiplier = 2

	batchPolicy = as.NewBatchPolicy()
	batchPolicy.ConcurrentNodes = *batchNodes
	batchPolicy.TotalTimeout = time.Duration(*timeout) * time.Millisecond
	batchPolicy.SocketTimeout = time.Duration(*timeout) * time.Millisecond
	batchPolicy.MaxRetries = *maxRetries
	batchPolicy.SleepBetweenRetries = 1 * time.Millisecond
	// batchPolicy.SleepMultiplier = 2

	logger.Println("*************************************************************")
	logger.Println("Starting Server...")
	logger.Println("*************************************************************")

	if *profileMode {
		err = trace.Start(f)
		if err != nil {
			panic(err)
		}
	}

	if !*fastHTTP {
		if *rateLimit > 0 {
			l, err := net.Listen("tcp", ":9999")
			if err != nil {
				log.Fatalf("Listen: %v", err)
			}
			defer l.Close()

			l = netutil.LimitListener(l, *rateLimit)
			log.Fatal(http.Serve(l, controller{}))
		} else {
			err := http.ListenAndServe(":9999", controller{})
			logger.Fatal(err)
		}
	} else {
		h := requestHandler

		if err := fasthttp.ListenAndServe(":9999", h); err != nil {
			logger.Fatalf("Error in ListenAndServe: %s", err)
		}
	}
}

func generateRandomData(client *as.Client) error {
	logger.Println("Generating random data...")
	for i := 0; i < *keyCount; i++ {
		key, _ := as.NewKey(*namespace, *set, i)
		profile := randomdata.GenerateProfile(i % 2)

		err := client.PutObject(nil, key, profile)
		if err != nil {
			return err
		}

		if i%1000 == 0 {
			logger.Println("Generated ", i, "records...")
		}

	}

	logger.Println("Generating random data finished...")
	return nil
}

func transBatch() ([]*as.Record, error) {
	rnd := rand.Intn(*keyCount - *batchSize)
	keys := make([]*as.Key, 0, *batchSize)
	for i := rnd; i < rnd+*batchSize; i++ {
		key, _ := as.NewKey(*namespace, *set, i)
		keys = append(keys, key)
	}

	res, err := client.BatchGet(batchPolicy, keys)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func transGet() (*as.Record, error) {
	rnd := rand.Intn(*keyCount)
	key, _ := as.NewKey(*namespace, *set, rnd)

	res, err := client.Get(nil, key)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func requestHandler(ctx *fasthttp.RequestCtx) {
	if *rateLimit > 0 {
		rl.Take()
	}
	if !*noop {
		res, err := transGet()
		if err != nil {
			ctx.Response.SetStatusCode(http.StatusInternalServerError)
			ctx.Write([]byte(err.Error()))
			return
		}

		if err := json.NewEncoder(ctx).Encode(res); err != nil {
			panic(err)
		}
	}
	// fmt.Fprintf(ctx, "OK")
}

func (h controller) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if *rateLimit > 0 {
		rl.Take()
	}
	if !*noop {
		res, err := transGet()
		if err != nil {
			panic(err)
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		if err := json.NewEncoder(w).Encode(res); err != nil {
			panic(err)
		}
	}
	// fmt.Fprintf(w, "OK")
}
