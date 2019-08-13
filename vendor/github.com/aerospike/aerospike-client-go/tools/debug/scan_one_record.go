package main

import (
	"fmt"
	"log"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

func main() {
	fmt.Println("Connecting...")

	client, err := as.NewClient("ubvm", 3000)
	if err != nil {
		log.Fatalf("Error creating aerospike client: %+v\n", err)
	}

	if !client.IsConnected() {
		log.Fatalf("Error, not connected to database: %+v\n", err)
	}

	defer client.Close()

	fmt.Println("Scanning...")

	policy := as.NewScanPolicy()
	policy.Timeout = 100 * time.Microsecond

	championSet, err := client.ScanAll(policy, "test", "demo")
	if err != nil {
		log.Fatalf("Error scanning records: %+v\n", err)
	}

	fmt.Println("Printing...")

	for res := range championSet.Results() {
		fmt.Println("for")
		if res.Err != nil {
			fmt.Println("if.")
			log.Fatalf("Error processing results: %+v\n", res.Err.Error())
		} else {
			fmt.Println("else")
			log.Printf("%+v\n", res.Record.Key.String())
			log.Printf("%+v\n", res.Record.Bins)
		}
	}

	fmt.Println("done.")
}
