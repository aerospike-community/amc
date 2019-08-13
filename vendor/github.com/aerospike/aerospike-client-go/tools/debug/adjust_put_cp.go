package main

import (
	"log"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"
)

const (
	host = "52.24.247.51"
	// host = "vmu1604"

	namespace = "persistent"
	set       = "demo"
)

func main() {
	asl.Logger.SetLevel(asl.DEBUG)

	policy := as.NewClientPolicy()
	policy.Timeout = 30 * time.Second
	policy.FailIfNotConnected = false

	client, err := as.NewClientWithPolicyAndHost(policy, as.NewHost(host, 3000))
	if err != nil {
		log.Println("failed to connect:", err)
	}

	wp := as.NewWritePolicy(0, 0)
	wp.Timeout = 30 * time.Second
	wp.SocketTimeout = 30 * time.Second

	aeroKey, err := as.NewKey(namespace, set, "key111")
	if err != nil {
		log.Panic(err)
	}
	err = client.Put(wp, aeroKey, as.BinMap{"foo": 123, "bar": "abc"})
	log.Println("key111 put err:", err)

	aeroKey, err = as.NewKey(namespace, set, "key10")
	if err != nil {
		log.Panic(err)
	}
	err = client.Put(wp, aeroKey, as.BinMap{"foo": 123, "bar": "abc"})
	log.Println("key10 put err:", err)

}
