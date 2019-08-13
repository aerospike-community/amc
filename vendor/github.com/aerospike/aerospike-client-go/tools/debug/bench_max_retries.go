package main

import (
	"errors"
	"log"
	"runtime"

	"github.com/aerospike/aerospike-client-go"
	"github.com/valyala/fasthttp"
)

var (
	Client *aerospike.Client
)

func Init(poolSize int) *aerospike.Client {
	policy := aerospike.NewClientPolicy()
	policy.ConnectionQueueSize = poolSize
	// policy.IdleTimeout = 3 * time.Second

	c, err := aerospike.NewClientWithPolicy(policy, "ubvm", 3000)
	if err != nil {
		log.Println(err.Error())
	}

	return c
}

func get(key string) (string, error) {
	k, _ := aerospike.NewKey("test", "test", key)
	reply, err := Client.Get(nil, k)
	if err != nil {
		log.Panic(err)
	}
	if reply == nil {
		return "", errors.New("Key not found")
	} else {
		return reply.String(), nil
	}
}

func query() (string, error) {
	stmt := aerospike.NewStatement("test", "test")
	stmt.SetFilter(aerospike.NewRangeFilter("age", 1, 10))
	rs, err := Client.Query(nil, stmt)
	if err != nil {
		log.Panic(err)
	}

	for r := range rs.Results() {
		if r.Err != nil {
			println(r.Err.Error())
		}
	}

	return "", nil
}

func main() {

	runtime.GOMAXPROCS(4)
	Client = Init(1024)
	fasthttp.ListenAndServe(":8080", loaderHandler)
}

func loaderHandler(ctx *fasthttp.RequestCtx) {
	get("somekey")
	// query()
}
