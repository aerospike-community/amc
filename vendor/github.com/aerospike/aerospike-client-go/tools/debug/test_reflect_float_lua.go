package main

import (
	"log"

	. "github.com/aerospike/aerospike-client-go"
)

const (
	AerospikeUrl  = "vmu1604"
	AerospikePort = 3000
)

type Manos struct {
	Test    float64 `as:"test"`
	TestLua float64 `as:"testLua"`
}

func main() {

	myUdf := []byte(`function addPointOne(rec, price)
    local ret = map()
    if not aerospike:exists(rec) then
        ret['status'] = false
        ret['result'] = 'Record does not exist'
    else
        rec['testLua'] = (rec['testLua'] or 0.000000000000001) + price
        aerospike:update(rec)
        ret['status'] = true
    end
    return ret
end`)

	key, _ := NewKey("test", "test", "manos")

	client, err := NewClient(AerospikeUrl, AerospikePort)
	if err != nil {
		panic(err)
	}

	regTask, err := client.RegisterUDF(nil, myUdf, "test.lua", LUA)
	if err != nil {
		panic(err)
	}

	<-regTask.OnComplete()

	for i := 1; i <= 100; i++ {
		bin1 := NewBin("test", float64(1))
		adOp := AddOp(bin1)
		if _, err := client.Operate(nil, key, adOp); err != nil {
			panic(err)
		}
		if _, err := client.Execute(nil, key, "test", "addPointOne", NewValue(float64(1))); err != nil {
			panic(err)
		}

		manos := &Manos{}
		if err := client.GetObject(nil, key, manos); err != nil {
			panic(err)
		}

		log.Println(manos.Test, manos.TestLua)
	}
}
