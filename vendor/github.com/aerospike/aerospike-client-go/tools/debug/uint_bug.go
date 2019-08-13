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
	"time"
	// "time"

	. "github.com/aerospike/aerospike-client-go"
	l "github.com/aerospike/aerospike-client-go/logger"
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

func main() {
	flag.Parse()
	log.SetOutput(os.Stdout)
	log.SetFlags(0)

	l.Logger.SetLevel(l.DEBUG)

	clientPolicy := NewClientPolicy()
	// clientPolicy.ConnectionQueueSize = 256
	// clientPolicy.LimitConnectionsToQueueSize = true
	// if *user != "" {
	// 	clientPolicy.User = *user
	// 	clientPolicy.Password = *password
	// }

	// connect to the host
	if client, err := NewClientWithPolicy(clientPolicy, *host, *port); err != nil {
		log.Fatalln(err.Error())
	} else {
		defer client.Close()
		//sample query values
		log.Println("===================================")

		//put
		bins := BinMap{"foo": time.Now().UnixNano()}
		key, _ := NewKey("test", "test", 1)
		client.Put(nil, key, bins)

		statement := NewStatement("test", "test")

		// query
		rs, _ := client.Query(nil, statement)
		for res := range rs.Results() {
			bins, _ := res.Record.Bins["SUCCESS"].(map[interface{}]interface{})

			fmt.Println(bins)

			val1 := bins["foo"].(uint64) //this line works
			val2 := bins["foo"].(int64)  //panic here

			println(val1, val2)
		}

	}
	log.Println("-HAHA")
}
