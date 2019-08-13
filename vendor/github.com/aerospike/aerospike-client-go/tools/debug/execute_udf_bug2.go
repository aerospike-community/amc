package main

import (
	"fmt"
	"math/rand"
	"runtime"

	as "github.com/aerospike/aerospike-client-go"
)

var client *as.Client

const udfBody = `function noopcalc(r)
    if not aerospike:exists(r) then
        return "does not exist"
    end

	r['age'] = 0
	aerospike:update(r)
end`

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())

	fmt.Println("Connecting...")

	var err error
	client, err = as.NewClient("ubvm", 3000)
	if err != nil {
		panic(fmt.Sprintf("Error creating aerospike client: %+v\n", err))
	}

	regTask, err := client.RegisterUDF(nil, []byte(udfBody), "debugdemographics.lua", as.LUA)
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
			fmt.Println(err)
		}
	}
}

func query() {
	// stmt := as.NewStatement("test", "test")
	k, _ := as.NewKey("test", "test", 1)
	_, err := client.Execute(nil, k, "debugdemographics", "noopcalc2")
	// championSet, err := client.ExecuteUDF(nil, stmt, "debugdemographics", "noopcalc2")
	if err != nil {
		fmt.Printf("Error ExecuteUDF: %+v\n", err)
	}

	// err = <-championSet.OnComplete()
	// if err != nil {
	// 	fmt.Printf("Error ExecuteUDF: %+v\n", err)
	// }

}
