package main

import (
	"fmt"

	as "github.com/aerospike/aerospike-client-go"
)

var (
	host      string = "ubvm"
	port      int    = 3000
	namespace string = "foo"
	set       string = "bar"
	bin       string = "geobin"
	chalen    int    = 1000
)

type GeoAddress struct {
	ID      int    `as:"id"`
	City    string `as:"city"`
	State   string `as:"state"`
	Country string `as:"country"`
}

func main() {
	// Initiate the client connection
	client, err := as.NewClient(host, port)
	panicOnError(err)
	defer client.Close()

	// Query GeoContains
	stmt := as.NewStatement(namespace, set)
	stmt.SetFilter(as.NewGeoRegionsContainingPointFilter(bin, "{\"type\":\"Point\",\"coordinates\":[-122.40282565355302, 37.79750922077997]}"))

	resChan := make(chan *GeoAddress, chalen)
	rcs, err := client.QueryObjects(nil, stmt, resChan)
	if err != nil {
		fmt.Errorf("failed to execute query: %v", err)
		return
	}

	for rcs.IsActive() {
		select {
		case obj := <-resChan:
			if obj != nil {
				fmt.Printf("%+v\n", *obj)
			}
		case err := <-rcs.Errors:
			if err != nil {
				fmt.Println("ERROR:", err)
			}
		}
	}

	for obj := range resChan {
		fmt.Printf("%+v\n", *obj)

		// read errors without blocking
		// you could leave this to after range, but then you'll have to
		// read all the results back before finding out about the error
		select {
		case err := <-rcs.Errors:
			if err != nil {
				break
			}
		default:
		}
	}

	// this is in case all nodes returned error without sending any data back
	for err := range rcs.Errors {
		println(err.Error())
	}
}

func panicOnError(err error) {
	if err != nil {
		panic(err)
	}
}
