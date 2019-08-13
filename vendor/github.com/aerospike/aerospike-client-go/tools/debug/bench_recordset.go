// Copyright 2013-2016 Aerospike, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"runtime"
	"runtime/pprof"
	"strings"
	"sync"
	"time"

	. "github.com/aerospike/aerospike-client-go"
	"github.com/google/go-cmp/cmp"
)

// flag information
var host = flag.String("h", "127.0.0.1", "Aerospike server seed hostnames or IP addresses")
var port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var namespace = flag.String("n", "test", "Aerospike namespace.")
var set = flag.String("s", "testset", "Aerospike set name.")
var operand = flag.String("o", "get", "Operand: get, set, delete")
var binName = flag.String("b", "bin", "Bin name")
var key = flag.String("k", "key", "Key information")
var recordTTL = flag.Int("e", 0, "Record TTL in seconds")
var value = flag.String("v", "", "Value information; used only by get operand")
var verbose = flag.Bool("verbose", false, "Verbose mode")
var showUsage = flag.Bool("u", false, "Show usage information.")
var verify = flag.Bool("verify", false, "Verify the results.")
var genData = flag.Bool("gen", false, "Generate data.")
var keyRange = flag.Int("limit", 3000, "Upper limit for key values [0...N).")
var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")
var concurrency = flag.Int("c", 5, "Number of goroutines.")

func main() {
	flag.Parse()
	runtime.GOMAXPROCS(runtime.NumCPU())

	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			panic(err)
		}
		pprof.StartCPUProfile(f)
		defer pprof.StopCPUProfile()
	}

	log.SetOutput(os.Stdout)
	// log.SetFlags(0)

	// l.Logger.SetLevel(l.DEBUG)

	clientPolicy := NewClientPolicy()
	// clientPolicy.ConnectionQueueSize = 256
	// clientPolicy.LimitConnectionsToQueueSize = true
	// if *user != "" {
	// 	clientPolicy.User = *user
	// 	clientPolicy.Password = *password
	// }

	// connect to the host
	client, err := NewClientWithPolicy(clientPolicy, *host, *port)
	if err != nil {
		panic(err.Error())
	}

	defer client.Close()
	//sample query values
	// hashValue := 800733420254867186
	// hashBin := "h_ap_nt_de"

	log.Println("===================================")

	if *genData {
		generateData(client)
	}

	var bins BinMap

	cnt := *concurrency
	var wg sync.WaitGroup
	wg.Add(cnt)
	for i := 0; i < cnt; i++ {
		go func() {
			defer wg.Done()

			n := 0
			nerr := 0
			start := time.Now()

			for ttt := 0; ttt < 1; ttt++ {
				//queries to aerospike
				policy := NewQueryPolicy()
				stmt := NewStatement(*namespace, *set)

				results, err := client.Query(policy, stmt)
				if err != nil {
					log.Println("==========================", err.Error())
				}

				// for r := range results.Results() {
				// 	if r.Err != nil {
				// 		log.Println(r.Err)
				// 	}
				// 	log.Println(r.Record)
				// 	n++
				// }
				for r := range results.Results() {
					if r.Err != nil {
						log.Printf(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> %#v", r.Err.Error())
						nerr++
					} else {
						if bins == nil {
							bins = CopyMap(r.Record.Bins)

							delete(bins, "counter")
							delete(bins, "randstr")
						}

						if *verify {
							if err := verifyResult(r.Record.Bins["counter"].(int), bins, r.Record.Bins); err != nil {
								log.Println(err)
								nerr++
							}
						}
						n++
					}
				}
			}
			log.Println("Number of resuts:", n, "Errors:", nerr, "Took:", time.Since(start))
		}()
	}

	wg.Wait()
	log.Println("Run Ended")
}

func CopyMap(m BinMap) BinMap {
	cp := make(BinMap, len(m))
	for k, v := range m {
		vm, ok := v.(BinMap)
		if ok {
			cp[k] = CopyMap(vm)
		} else {
			cp[k] = v
		}
	}

	return cp
}

func verifyResult(key int, origBins, newBins BinMap) error {
	if origBins == nil {
		origBins = CopyMap(newBins)
		delete(origBins, "counter")
		delete(origBins, "randstr")
	}

	if newBins == nil {
		// log.Println("Record not found for id", key)
		return fmt.Errorf("Record not found for id %d", key)
	}
	if newBins["counter"].(int) != key || len(newBins["randstr"].(string)) != (key*713)%619 || len(newBins) != len(origBins)+2 {
		// log.Println("len bins is:", len(origBins), "len res is:", len(newBins))
		// log.Println("counter:", newBins["counter"])
		// log.Println("randstr:", newBins["randstr"])
		return fmt.Errorf("Value mismatch: Count %d != %d, len(randStr) %d != %d, len(newBins) %d != %d", newBins["counter"].(int), key, len(newBins["randstr"].(string)), (key*713)%619, len(newBins), len(origBins)+2)
	}

	delete(newBins, "counter")
	delete(newBins, "randstr")

	if !cmp.Equal(origBins, newBins) {
		// log.Println("diff is", cmp.Diff(origBins, newBins))
		return fmt.Errorf("diff is %s", cmp.Diff(origBins, newBins))
	}

	return nil
}

func generateData(client *Client) {
	bins := BinMap{
		// "counter":    0,
		"_id":        "5c7fe73c9d23f16d4543987b",
		"index":      0,
		"guid":       "ba75520b-e5f8-4d40-b1db-84e8299c36ed",
		"isActive":   "false",
		"balance":    "$1,647.44",
		"picture":    "http://placehold.it/32x32",
		"age":        24,
		"eyeColor":   "brown",
		"name":       "Isabelle Valentine",
		"gender":     "female",
		"company":    "MOTOVATE",
		"email":      "isabellevalentine@motovate.com",
		"phone":      "+1 (887) 530-3065",
		"address":    "757 Boulevard Court, Shelby, Vermont, 3612",
		"about":      "Adipisicing mollit pariatur eiusmod minim deserunt voluptate dolore et non do culpa ea exercitation. Laboris consequat labore ullamco ullamco aute do aliqua aute mollit. Ipsum elit do dolor nulla nostrud cupidatat ullamco ipsum id. Cupidatat elit fugiat ullamco nisi ipsum dolore ex consectetur cillum aute cillum eu. Ad cillum in exercitation elit commodo consectetur nisi. Ipsum veniam qui ipsum occaecat commodo sint anim. Laboris duis sit duis exercitation mollit id eiusmod officia enim exercitation aliqua sit fugiat.\r\n",
		"registered": "2017-07-14T02:54:30 -02:00",
		"latitude":   65.472523,
		"longitude":  -44.358939,
		"tags": []interface{}{
			"eiusmod",
			"reprehenderit",
			"voluptate",
			"ea",
			"id",
			"sunt",
			"laborum",
		},
		"friends": []map[interface{}]interface{}{
			{
				"id":   0,
				"name": "Eve Rosales",
			},
			{
				"id":   1,
				"name": "Howard Burton",
			},
			{
				"id":   2,
				"name": "Lauren Williamson",
			},
		},
		"greeting":      "Hello, Isabelle Valentine! You have 7 unread messages.",
		"favoriteFruit": "banana",
		"1counter":      0,
		"1_id":          "5c7fe73c9d23f16d4543987b",
		"1index":        0,
		"1guid":         "ba75520b-e5f8-4d40-b1db-84e8299c36ed",
		"1isActive":     "false",
		"1balance":      "$1,647.44",
		"1picture":      "http://placehold.it/32x32",
		"1age":          24,
		"1eyeColor":     "brown",
		"1name":         "Isabelle Valentine",
		"1gender":       "female",
		"1company":      "MOTOVATE",
		"1email":        "isabellevalentine@motovate.com",
		"1phone":        "+1 (887) 530-3065",
		"1address":      "757 Boulevard Court, Shelby, Vermont, 3612",
		"1about":        "Adipisicing mollit pariatur eiusmod minim deserunt voluptate dolore et non do culpa ea exercitation. Laboris consequat labore ullamco ullamco aute do aliqua aute mollit. Ipsum elit do dolor nulla nostrud cupidatat ullamco ipsum id. Cupidatat elit fugiat ullamco nisi ipsum dolore ex consectetur cillum aute cillum eu. Ad cillum in exercitation elit commodo consectetur nisi. Ipsum veniam qui ipsum occaecat commodo sint anim. Laboris duis sit duis exercitation mollit id eiusmod officia enim exercitation aliqua sit fugiat.\r\n",
		"1registered":   "2017-07-14T02:54:30 -02:00",
		"1latitude":     65.472523,
		"1longitude":    -44.358939,
		"1tags": []interface{}{
			"1eiusmod",
			"1reprehenderit",
			"1voluptate",
			"1ea",
			"1id",
			"1sunt",
			"1laborum",
		},
		"1friends": []map[interface{}]interface{}{
			{
				"1id":   0,
				"1name": "Eve Rosales",
			},
			{
				"1id":   1,
				"1name": "Howard Burton",
			},
			{
				"1id":   2,
				"1name": "Lauren Williamson",
			},
		},
		"1greeting":      "Hello, Isabelle Valentine! You have 7 unread messages.",
		"1favoriteFruit": "banana",
		"2counter":       0,
		"2_id":           "5c7fe73c9d23f16d4543987b",
		"2index":         0,
		"2guid":          "ba75520b-e5f8-4d40-b1db-84e8299c36ed",
		"2isActive":      "false",
		"2balance":       "$1,647.44",
		"2picture":       "http://placehold.it/32x32",
		"2age":           24,
		"2eyeColor":      "brown",
		"2name":          "Isabelle Valentine",
		"2gender":        "female",
		"2company":       "MOTOVATE",
		"2email":         "isabellevalentine@motovate.com",
		"2phone":         "+1 (887) 530-3065",
		"2address":       "757 Boulevard Court, Shelby, Vermont, 3612",
		"2about":         "Adipisicing mollit pariatur eiusmod minim deserunt voluptate dolore et non do culpa ea exercitation. Laboris consequat labore ullamco ullamco aute do aliqua aute mollit. Ipsum elit do dolor nulla nostrud cupidatat ullamco ipsum id. Cupidatat elit fugiat ullamco nisi ipsum dolore ex consectetur cillum aute cillum eu. Ad cillum in exercitation elit commodo consectetur nisi. Ipsum veniam qui ipsum occaecat commodo sint anim. Laboris duis sit duis exercitation mollit id eiusmod officia enim exercitation aliqua sit fugiat.\r\n",
		"2registered":    "2017-07-14T02:54:30 -02:00",
		"2latitude":      65.472523,
		"2longitude":     -44.358939,
		"2tags": []interface{}{
			"2eiusmod",
			"2reprehenderit",
			"2voluptate",
			"2ea",
			"2id",
			"2sunt",
			"2laborum",
		},
		"2friends": []map[interface{}]interface{}{
			{
				"2id":   0,
				"2name": "Eve Rosales",
			},
			{
				"2id":   1,
				"2name": "Howard Burton",
			},
			{
				"2id":   2,
				"2name": "Lauren Williamson",
			},
		},
		"2greeting":      "Hello, Isabelle Valentine! You have 7 unread messages.",
		"2favoriteFruit": "banana",
		"3counter":       0,
		"3_id":           "5c7fe73c9d23f16d4543987b",
		"3index":         0,
		"3guid":          "ba75520b-e5f8-4d40-b1db-84e8299c36ed",
		"3isActive":      "false",
		"3balance":       "$1,647.44",
		"3picture":       "http://placehold.it/32x32",
		"3age":           24,
		"3eyeColor":      "brown",
		"3name":          "Isabelle Valentine",
		"3gender":        "female",
		"3company":       "MOTOVATE",
		"3email":         "isabellevalentine@motovate.com",
		"3phone":         "+1 (887) 530-3065",
		"3address":       "757 Boulevard Court, Shelby, Vermont, 3612",
		"3about":         "Adipisicing mollit pariatur eiusmod minim deserunt voluptate dolore et non do culpa ea exercitation. Laboris consequat labore ullamco ullamco aute do aliqua aute mollit. Ipsum elit do dolor nulla nostrud cupidatat ullamco ipsum id. Cupidatat elit fugiat ullamco nisi ipsum dolore ex consectetur cillum aute cillum eu. Ad cillum in exercitation elit commodo consectetur nisi. Ipsum veniam qui ipsum occaecat commodo sint anim. Laboris duis sit duis exercitation mollit id eiusmod officia enim exercitation aliqua sit fugiat.\r\n",
		"3registered":    "2017-07-14T02:54:30 -02:00",
		"3latitude":      65.472523,
		"3longitude":     -44.358939,
		"3tags": []interface{}{
			"3eiusmod",
			"3reprehenderit",
			"3voluptate",
			"3ea",
			"3id",
			"3sunt",
			"3laborum",
		},
		"3friends": []map[interface{}]interface{}{
			{
				"3id":   0,
				"3name": "Eve Rosales",
			},
			{
				"3id":   1,
				"3name": "Howard Burton",
			},
			{
				"3id":   2,
				"3name": "Lauren Williamson",
			},
		},
		"3greeting":      "Hello, Isabelle Valentine! You have 7 unread messages.",
		"3favoriteFruit": "banana",
		// "randstr":        strings.Repeat("s", rand.Intn(150)),
	}

	if *genData {
		log.Println("Generating data...")
		err := client.Truncate(nil, *namespace, *set, nil)
		if err != nil {
			log.Fatal(err)
		}
		time.Sleep(time.Second)
		log.Println("Truncation finished...")

		for i := 0; i < *keyRange; i++ {
			bins["counter"] = i
			bins["randstr"] = strings.Repeat("s", (i*713)%619)
			key, _ := NewKey(*namespace, *set, i)

			err := client.Put(nil, key, bins)
			if err != nil {
				panic(err)
			}
		}
		log.Println("Generating data finished successfully...")
	}

	delete(bins, "counter")
	delete(bins, "randstr")
}
