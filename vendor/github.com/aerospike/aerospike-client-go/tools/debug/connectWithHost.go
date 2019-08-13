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

	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"
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

	// l.Logger.SetLevel(l.DEBUG)

	// host1 := &Host{
	// 	Name: "ubvm1", // a non-existing host
	// 	Port: 3000,
	// }

	// host2 := &Host{
	// 	Name: "ubvm", // a existing host, but without aerospike server on the specified port
	// 	Port: 3040,
	// }

	// host3 := &Host{
	// 	Name: "ubvm", // a aerospike server host
	// 	Port: 3000,
	// }

	// // cli, err := NewClientWithPolicyAndHost(nil, host2, host3) // that's right

	// cli, err := NewClientWithPolicyAndHost(nil, host1, host2, host3) // bug, should not return err but it do!
	// if err != nil {
	// 	panic(err)
	// }
	// defer cli.Close()
	// log.Println("Successful...")

	var err error

	valid := &as.Host{
		Name: "vmu1604",
		Port: 3000,
	}

	noexist := &as.Host{
		Name: "noexist",
		Port: 3000,
	}

	asl.Logger.SetLevel(asl.DEBUG)
	clientPolicy := as.NewClientPolicy()
	// clientPolicy.FailIfNotConnected = false

	// _, err = as.NewClientWithPolicyAndHost(nil, valid)
	// fmt.Printf("NewClient(valid)          err: %q \t(should be nil)\n", err)

	// _, err = as.NewClientWithPolicyAndHost(nil, noexist)
	// fmt.Printf("NewClient(noexist)        err: %q \t(should not be nil)\n", err)

	// _, err = as.NewClientWithPolicyAndHost(nil, valid, noexist)
	// fmt.Printf("NewClient(valid, noexist) err: %q \t(should be nil)\n", err)

	c, err := as.NewClientWithPolicyAndHost(clientPolicy, noexist, valid)
	fmt.Printf("NewClient(noexist, valid) err: %q \t(should be nil)\n", err)

	for {
		c.IsConnected()
		time.Sleep(1 * time.Second)
	}

}
