package main

import (
	"fmt"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

const lua = `
function echoint(r, now)
    info("call echoint with %d", now)
    return now
end
`

func main() {
	client, err := as.NewClient("ubvm", 3000)
	if err != nil {
		panic(err)
	}

	task, err := client.RegisterUDF(
		nil,
		[]byte(lua),
		"echoint.lua",
		as.LUA,
	)
	if err != nil {
		panic(err)
	}
	if err, ok := <-task.OnComplete(); ok && err != nil {
		panic(err)
	}
	fmt.Printf("RegisterUDF done\n")

	key, _ := as.NewKey("test", "test", "test")
	now := time.Now().UnixNano()
	fmt.Printf("now: %d\n", now)
	res, err := client.Execute(
		nil,
		key,
		"echoint",
		"echoint",
		as.NewValue(now),
	)
	if err != nil {
		panic(err)
	}

	r, _ := client.Get(nil, key)
	fmt.Printf("res via Get: %+v\n", r)

	fmt.Printf("res: %+v\n", res)
	if have, want := res, now; have != want {
		fmt.Printf("oops: have %d, want %d\n", have, want)
	}
}
