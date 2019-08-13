package main

import (
	"bytes"
	"flag"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"
	"runtime"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"
)

var Host = flag.String("h", "vmu1604", "Aerospike server seed hostnames or IP addresses.")
var Port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var User = flag.String("U", "", "Database Username.")
var Pass = flag.String("P", "", "Database User Password.")
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
	}
	client, err := as.NewClientWithPolicyAndHost(clientPolicy, h...)
	if err != nil {
		log.Fatalln(err.Error())
	}

	key, err := as.NewKey("test", "test", "k1")
	if err != nil {
		panic(err)
	}

	items := map[interface{}]interface{}{
		"mk1": []interface{}{"v1.0", "v1.1"},
		"mk2": []interface{}{"v2.0", "v2.1"},
	}

	cdtMap, err := client.Operate(nil, key,
		as.MapPutItemsOp(as.NewMapPolicy(as.MapOrder.KEY_VALUE_ORDERED, as.MapWriteMode.UPDATE), "bin", items),
	)
	if err != nil {
		log.Fatal(err)
	}

	cdtMap, err = client.Operate(nil, key,
		as.MapGetByKeyOp("bin", "mk1", as.MapReturnType.VALUE),
		as.MapGetByKeyOp("bin", "mk2", as.MapReturnType.VALUE),
	)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("%#v", cdtMap.Bins)
	log.Printf("%#v", cdtMap.Bins["bin"].([]interface{})[0])

	rec, err := client.Get(nil, key)
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("%#v", rec.Bins)
}
