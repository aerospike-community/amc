package main

import (
	"log"

	"google.golang.org/appengine"

	ae "github.com/aerospike/aerospike-client-go"
)

func main() {
	client, err := ae.NewClient("vmu1604", 3000)
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	defer client.Close()
	// Run code and tests with *http.Request req1 and req2,
	// and context.Context c1 and c2.
	// ...

	appengine.Main()
}
