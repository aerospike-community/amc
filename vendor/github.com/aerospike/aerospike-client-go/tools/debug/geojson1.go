package main

import (
	"log"

	as "github.com/aerospike/aerospike-client-go"
)

func main() {
	// define a client to connect to
	client, err := as.NewClient("vmu1804", 3000)
	PanicOnError(err)

	// The Data
	bins := []as.BinMap{
		{
			"name":     "Work shop",
			"demand":   "49589",
			"capacity": "4231",
			"coord":    as.GeoJSONValue(`{"type" : "Point", "coordinates": [13.009318762,80.003157854]}`),
		},
		{
			"name":     "main block",
			"demand":   "247859",
			"capacity": "2974",
			"coord":    as.GeoJSONValue(`{"type" : "Point", "coordinates": [13.00961276, 80.003422154]}`),
		},
		{
			"name":     "Work shop",
			"demand":   "49589",
			"capacity": "4231",
			"coord":    as.GeoJSONValue(`{"type" : "Point", "coordinates": [13.009318762,80.003157854]}`),
		},
		{
			"name":     "main block",
			"demand":   "247859",
			"capacity": "2974",
			"coord":    as.GeoJSONValue(`{"type" : "Point", "coordinates": [13.00961276, 80.003422154]}`),
		},
	}

	// write the records to the database
	for i, b := range bins {
		// define some bins
		key, _ := as.NewKey("test", "testset", i)
		err = client.Put(nil, key, b)
		PanicOnError(err)
	}

	log.Println("The records are written !!")

	// queries only work on indices; you should create the index only once
	// The index is created on the namespace, set and bin that should be indexed.
	client.CreateIndex(nil, "test", "testset", "ma_geo_index", "coord", as.GEO2DSPHERE)

	stm := as.NewStatement("test", "testset")
	// there are multiple different types of filters. You can find the list in the docs.
	stm.SetFilter(as.NewGeoWithinRadiusFilter("coord", float64(13.009318762), float64(80.003157854), float64(50000)))
	recordset, err := client.Query(nil, stm)
	PanicOnError(err)

	count := 0
	for res := range recordset.Results() {
		PanicOnError(res.Err)
		log.Println(res.Record.Bins)
		count++
	}

	// 1 region should be found
	log.Println("Records found: ", count)

	log.Println("Application ran successfully GrandMaster")
}

func PanicOnError(err error) {
	if err != nil {
		log.Fatalln(err)
	}
}
