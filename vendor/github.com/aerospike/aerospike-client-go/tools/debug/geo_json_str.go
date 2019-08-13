package main

import (
	. "github.com/aerospike/aerospike-client-go"
)

func panicOnError(err error) {
	if err != nil {
		panic(err)
	}
}

func main() {

	cp := NewClientPolicy()
	cp.User = "admin"
	cp.Password = "admin"

	client, err := NewClientWithPolicy(cp, "ubvm", 3000)
	panicOnError(err)

	key, err := NewKey("test", "test", "key")
	panicOnError(err)

	geo := NewGeoJSONValue("{\"type\":\"Point\", \"coordinates\": [55.6728087,12.557570400000031]}")
	bin := NewBin("geobin", geo)
	err = client.PutBins(nil, key, bin)
	panicOnError(err)

}
