package main

import (
	"fmt"
	"log"
	"math/rand"
	"runtime"

	as "github.com/aerospike/aerospike-client-go"
)

var client *as.Client

const udfBody = `function testFunc1(rec, val)
   if rec['age'] ~= val then
	   	info('Didnt match...')

	   	rec['age'] = -1
	   	aerospike:update(rec)
	end
end`

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	fmt.Println("Connecting...")

	var err error
	client, err = as.NewClient("ubvm", 3000)
	if err != nil {
		log.Fatalf("Error creating aerospike client: %+v\n", err)
	}

	regTask, err := client.RegisterUDF(nil, []byte(udfBody), "udfEcho.lua", as.LUA)
	if err != nil {
		panic(err)
	}
	// wait until UDF is created
	err = <-regTask.OnComplete()
	if err != nil {
		panic(err)
	}

	put(1e4)
	query()

	fmt.Println("done.")
}

func put(times int) {
	for i := 0; i < times; i++ {
		key, _ := as.NewKey("test", "test", i)
		err := client.Put(nil, key, as.BinMap{"name": "K", "age": 20 + rand.Intn(10)})
		if err != nil {
			log.Println(err)
		}
	}
}

func query() {
	stmt := as.NewStatement("test", "test")
	stmt.SetFilter(as.NewEqualFilter("age", 20))
	championSet, err := client.ExecuteUDF(nil, stmt, "udfEcho", "testFunc1", as.NewValue(20))
	if err != nil {
		log.Printf("Error ExecuteUDF: %+v\n", err)
	}

	err = <-championSet.OnComplete()
	if err != nil {
		log.Printf("Error ExecuteUDF: %+v\n", err)
	}

}
