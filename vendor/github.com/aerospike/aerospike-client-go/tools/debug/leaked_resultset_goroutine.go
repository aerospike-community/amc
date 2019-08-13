package main

import (
	"fmt"
	"log"

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

	for i := 0; i < 10; i++ {
		championSet, err := client.ScanAll(policy, "test", "demo")
		if err != nil {
			log.Fatalf("Error scanning records: %+v\n", err)
		}

		fmt.Println("Printing...")

		for range championSet.Results() {
			championSet.Close()
			break
		}
	}

	fmt.Println("done.")
}
