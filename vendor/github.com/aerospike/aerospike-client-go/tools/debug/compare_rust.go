package main

import (
	"fmt"
	"log"
	"strings"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

const (
	HOST = "ubvm"
	PORT = 3000
)

func main() {
	ac, err := as.NewClient(HOST, PORT)
	chk(err)

	for i := 0; i < 1e1; i++ {
		key, err := as.NewKey("test", "test", i)
		chk(err)

		err = ac.Put(nil,
			key,
			as.BinMap{
				"bin1": 1,
				"bin2": "a string long enough",
				"bin3": float64(11.891),
				"bin4": strings.Repeat("A", 1024*10),
			})
		chk(err)
	}

	tm := time.Now()
	for i := 0; i < 1e1; i++ {
		key, _ := as.NewKey("test", "test", i%1e4)
		// chk(err)

		rec, _ := ac.Get(nil, key)
		fmt.Println(rec.Bins)
		// chk(err)
	}

	fmt.Println(time.Since(tm))

	// fmt.Println(rec)
}

func chk(err error) {
	if err != nil {
		log.Panic("[fatal]", err)
	}
}
