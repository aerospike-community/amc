package main

import (
	"fmt"
	"log"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

func main() {
	runRecord_Entry()

	log.Println("Application ran successfully GrandMaster")
}

func runRecord_Entry() {

	// define a client to connect to

	client, err := as.NewClient("vmu1604", 3000)
	if err != nil {
		log.Fatalln(err)
	}

	key, err := as.NewKey("test", "jolardest", "dert")

	if err != nil {
		log.Fatalln(err)
	}
	binName := "gjsn"

	// queries only work on indices
	client.DropIndex(nil, "test", "jolardest", "set+binName")

	idxTask, err := client.CreateIndex(nil, "test", "jolardest", "set+binName", "gjsn", as.GEO2DSPHERE)
	if err != nil {
		log.Fatalln(err)
	}
	<-idxTask.OnComplete()

	time.Sleep(time.Second)

	// The Data
	point := as.GeoJSONValue(`{
		    "type": "Feature",
			"geometry": {
				"type": "Point",
		    	"coordinates": [13.009318762,80.003157854]
				},
			"properties": {
				"name": "workshop block",
				"Demand": "49589",
				"capacity":"808"
			}
		}`)
	// define some bins
	bin := as.NewBin(binName, point)

	// write the bins
	err = client.PutBins(nil, key, bin)
	if err != nil {
		log.Fatalln(err)
	}

	record, err := client.Get(nil, key, binName)
	if err != nil {
		log.Fatalln(err)
	}

	fmt.Println("The record is written:", record.Bins)
}
