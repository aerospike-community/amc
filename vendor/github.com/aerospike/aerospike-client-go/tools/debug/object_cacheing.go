package main

import (
	"log"

	as "github.com/aerospike/aerospike-client-go"
)

type TestStrct struct {
	ID  int64  `as:"i"`
	Key string `as:"k"`
}

func main() {
	Namespace := "test"
	SetName := "test"

	client, err := as.NewClient("ubvm", 3000)

	BIN_KEY := "k"
	BIN_ID := "i"
	KEY := "someKey"
	Key, _ := as.NewKey(Namespace, SetName, KEY)
	//Procedure succeeds
	if err := client.PutBins(nil, Key, as.NewBin(BIN_ID, 1), as.NewBin(BIN_KEY, KEY)); err != nil {
		panic(err)
	}

	r, err := client.Get(nil, Key, BIN_ID, BIN_KEY)
	if err != nil {
		panic(err)
	}
	log.Print("Just bins: ", r.Bins)

	st := as.NewStatement(Namespace, SetName)
	st.SetFilter(as.NewEqualFilter(BIN_ID, 1))
	ch := make(chan *TestStrct, 10)

	client.QueryObjects(nil, st, ch)

	for v := range ch {
		log.Print("Querying objects: ", *v)
	}

	o := &TestStrct{}
	if err := client.GetObject(nil, Key, o); err != nil {
		panic(err)
	}
	log.Print("Simple getObject-call: ", *o)

	ch = make(chan *TestStrct, 10)
	client.QueryObjects(nil, st, ch)
	for v := range ch {
		log.Print("Querying objects again: ", *v)
	}

}
