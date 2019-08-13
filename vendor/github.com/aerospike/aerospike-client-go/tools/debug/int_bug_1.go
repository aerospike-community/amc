package main

import (
	"log"

	as "github.com/aerospike/aerospike-client-go"
	"github.com/aerospike/aerospike-client-go/types"
)

const (
	HOST = "ubvm"
	PORT = 3000
)

const (
	NS_TEST                = "test"
	SET_A                  = "a"
	BIN_NAME               = "app"
	LUA        as.Language = "LUA"
	LUA_SRC                = "bug.lua"
	UDF_FILTER             = `
    local function map_tp_mt(record)
        return map {tp=record["tp"], mt=record["mt"]}
    end
    function filter_by_tp(stream,tp)
        local function filter(record)
            return (record.tp == tp)
        end
        return stream : filter(filter) : map(map_tp_mt)
    end`
)

type Dv struct {
	App string `as:"app"`
	Tp  string `as:"tp"`
	Mt  uint64 `as:"mt"`
}

func main() {
	ac := connect()

	dv := &Dv{
		App: "app1",
		Tp:  "tp1",
		Mt:  1, //int64, here
	}

	key, err := as.NewKey(NS_TEST, SET_A, "foobar")
	chk(err)

	err = ac.PutObject(nil, key, dv)
	chk(err)

	findByLua(ac, dv.App, dv.Tp) //panic
}

func findByLua(ac *as.Client, app, tp string) {
	stm := as.NewStatement(NS_TEST, SET_A)
	stm.SetFilter(as.NewEqualFilter(BIN_NAME, app))
	stm.SetAggregateFunction("bug", "filter_by_tp", []as.Value{as.NewValue(tp)}, true)

	rs, err := ac.Query(nil, stm)
	chk(err)
	for res := range rs.Results() {
		chk(res.Err)
		bins, ok := res.Record.Bins["SUCCESS"].(map[interface{}]interface{})
		if !ok {
			log.Fatal("query err", res.Record.Bins)
		}
		log.Println(bins["mt"])
		log.Println(bins["mt"].(int)) //panic here
	}
}

func connect() *as.Client {
	ac, err := as.NewClient(HOST, PORT)
	chk(err)

	idxTask, err := ac.CreateIndex(nil, NS_TEST, SET_A, SET_A+BIN_NAME, BIN_NAME, as.STRING)
	if err == nil {
		<-idxTask.OnComplete()
	} else {
		if asErr, ok := err.(types.AerospikeError); !ok || asErr.ResultCode() != types.INDEX_FOUND {
			panic(err)
		}
	}

	regTask, err := ac.RegisterUDF(nil, []byte(UDF_FILTER), LUA_SRC, LUA)
	chk(err)

	err = <-regTask.OnComplete()
	chk(err)
	return ac
}

func chk(err error) {
	if err != nil {
		log.Panic("[fatal]", err)
	}
}
