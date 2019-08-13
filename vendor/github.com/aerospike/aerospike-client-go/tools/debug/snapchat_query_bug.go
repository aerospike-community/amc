package main

import (
	"fmt"
	"strings"

	as "github.com/aerospike/aerospike-client-go"
)

var (
	host      string = "ubvm"
	port      int    = 3000
	namespace string = "test"
	set       string = "test"
	bin       string = "geobin"
	chalen    int    = 1000
	N         int    = 5000
)

type GeoAddress struct {
	ID      int    `as:"id"`
	City    string `as:"name"`
	State   string `as:"is_in:state"`
	Country string `as:"is_in:country"`
}

func main() {
	// Initiate the client connection
	client, err := as.NewClient(host, port)
	panicOnError(err)
	defer client.Close()

	putRecords(client, 250)

	// Query GeoContains
	// Query GeoContains
	for i := 0; i < N; i++ {
		stmt := as.NewStatement(namespace, set)

		rgnsb := `{
		    "type": "Polygon",
		    "coordinates": [
		        [[-122.500000, 37.000000],[-121.000000, 37.000000],
		         [-121.000000, 38.080000],[-122.500000, 38.080000],
		         [-122.500000, 37.000000]]
		    ]
		}`
		// stmt.SetFilter(as.NewGeoRegionsContainingPointFilter(bin, "{\"type\":\"Point\",\"coordinates\":[-97.0560583, 36.1178406]}"))
		stmt.SetFilter(as.NewGeoRegionsContainingPointFilter(bin, rgnsb))

		resChan := make(chan *GeoAddress, chalen)
		rcs, err := client.QueryObjects(nil, stmt, resChan)
		if err != nil {
			fmt.Errorf("failed to execute query: %v", err)
			return
		}

		cnt := 0
		for range resChan {
			cnt++
			// fmt.Printf("%+v\n", *obj)
		}
		fmt.Printf("%+v\n", cnt)

		// this is in case all nodes returned error without sending any data back
		for err := range rcs.Errors {
			fmt.Println(err)
		}
	}
}

func panicOnError(err error) {
	if err != nil {
		panic(err)
	}
}

func putRecords(client *as.Client, n int) {
	for i := 0; i < n; i++ {
		key, _ := as.NewKey(namespace, set, i)

		lng := -122.0 + (0.1 * float64(i))
		lat := 37.5 + (0.1 * float64(i))
		ptsb := "{ \"type\": \"Point\", \"coordinates\": ["
		ptsb += fmt.Sprintf("%f", lng)
		ptsb += ", "
		ptsb += fmt.Sprintf("%f", lat)
		ptsb += "] }"

		panicOnError(client.Put(nil, key, as.BinMap{
			"id":            i,
			"name":          strings.Repeat("a", 100),
			"is_in:state":   strings.Repeat("a", 100),
			"is_in:country": strings.Repeat("a", 10),
			"balast":        strings.Repeat("a", 1e5),
			bin:             as.NewGeoJSONValue(ptsb),
		}))
	}
}
