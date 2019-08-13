package main

import (
	"errors"
	"flag"
	"fmt"
	"log"
	"math/rand"
	"os"
	"sync"
	"time"

	. "github.com/aerospike/aerospike-client-go"
)

// flag information
var host = flag.String("h", "127.0.0.1", "Aerospike server seed hostnames or IP addresses")
var port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var namespace = flag.String("n", "test", "Aerospike namespace.")
var set = flag.String("s", "testset", "Aerospike set name.")
var recordCount = flag.Int("rc", 2000000, "Test Record Count")
var skipPut = flag.Bool("skip", false, "Skip generating test data")
var tick = flag.Int("tick", int(time.Now().Unix()), "tick")

func main() {
	flag.Parse()
	log.SetOutput(os.Stdout)
	// log.SetFlags(0)

	// connect to the host
	client, err := NewClientWithPolicy(nil, *host, *port)
	if err != nil {
		log.Fatalln(err.Error())
	}

	defer client.Close()

	// Set LuaPath
	luaPath, _ := os.Getwd()
	luaPath += "/"
	SetLuaPath(luaPath)

	const LUA_NAME = "agg_test"
	rt, err := client.RegisterUDFFromFile(nil, luaPath+LUA_NAME+".lua", LUA_NAME+".lua", LUA)
	if err != nil {
		log.Fatalln(err.Error())
	}

	<-rt.OnComplete()

	// irt, err := client.CreateIndex(nil, *namespace, *set, *namespace+*set+"app", "app", STRING)
	// if err != nil {
	// 	log.Fatalln(err.Error())
	// }

	// <-irt.OnComplete()

	log.Println("Registered the UDF...")

	if !*skipPut {
		rc := *recordCount / 10
		wg := sync.WaitGroup{}
		wg.Add(10)
		for i := 0; i < 10; i++ {
			go put(&wg, client, i*rc, rc, "my_app")
		}
		wg.Wait()
		log.Println("Put all records...")
	}

	stm := NewStatement(*namespace, *set)
	stm.SetFilter(NewEqualFilter("app", "my_app"))

	tp := 1
	log.Println("tick:", *tick)

	log.Println("Aggregation beginning...")
	begin := time.Now()
	rs, err := client.QueryAggregate(nil, stm, LUA_NAME, "statUser", *tick, tp)
	if err != nil {
		log.Fatal("1 ", err)
	}

	r := <-rs.Results()
	log.Println("Aggregation took:", time.Since(begin))
	if r.Err != nil {
		log.Fatal("2 ", r.Err)
	}

	bins, ok := r.Record.Bins["SUCCESS"].(map[interface{}]interface{})
	if !ok {
		log.Fatal(errors.New("find_dv_by_tp_err: aerospike query err"))
	}

	log.Println("Aggregation Results:")
	for k, v := range bins {
		log.Printf("\t%s\t:\t%d", k, int64(v.(float64)))
	}

}

func put(wg *sync.WaitGroup, client *Client, from, keyCount int, app string) {
	defer wg.Done()

	tm := time.Now().Unix()
	keyCount += from
	var lapp string
	for i := from; i <= keyCount; i++ {
		key, _ := NewKey(*namespace, *set, i)

		lapp = app
		if rand.Int31n(10) > 5 {
			lapp = "something_else"
		}

		client.Put(nil, key, BinMap{
			"app":    lapp,
			"tp":     1,
			"ignore": 0,
			"mt":     tm - rand.Int63n(60*60*24*1000*30*2),
		})

		if i%10000 == 0 {
			fmt.Println("Records put:", i)
		}
	}
}
