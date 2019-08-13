package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"math/rand"
	"strconv"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

const (
	namespace = "test"
	set       = "signal1"
	key       = "P2898"
)

const udf = `
function pushSignal(rec, value)
  local binName = "value"
  local l = rec[binName]
  if (l == nil) then
   l = list()
 end


  if #l >= 7 then
    -- lets make room for incoming guy by dropping the last element.
     list.trim(l, 7)
  end
  -- prepend the new incomer to the first position and store the list for get optimization.
  list.prepend(l, value)

  -- store back the list in bin.
  rec[binName] = l
  if aerospike:exists(rec) then
    aerospike:update(rec)
  else
    aerospike:create(rec)
  end

  -- Lets return success so that it can be returned to api caller if the writing was indeed successful.
  return l
end
`

func main() {
	//bulkGetGenerator(80, 1000);
	//bulkGetAssertGenerator(80, 1000);

	// bulkSetGenerator(10, 10)

	policy := as.NewClientPolicy()
	policy.Timeout = 5 * time.Second
	client, err := as.NewClientWithPolicyAndHost(policy, as.NewHost("vmu1604", 3000))
	if err != nil {
		log.Panicf("failed to connect (%s)", err)
	}

	client.DefaultPolicy.MaxRetries = 10
	client.DefaultWritePolicy = as.NewWritePolicy(0, math.MaxUint32)
	client.DefaultWritePolicy.Timeout = time.Second * 2

	regTask, err := client.RegisterUDF(nil, []byte(udf), "signal.lua", as.LUA)
	if err != nil {
		log.Panicf("failed to connect (%s)", err)
	}

	// wait until UDF is created
	err = <-regTask.OnComplete()
	if err != nil {
		log.Panicf("failed to connect (%s)", err)
	}

	aeroKey, err := as.NewKey(namespace, set, key)
	if err != nil {
		log.Panic(err)
	}

	rand.Seed(time.Now().UnixNano())
	// s := []interface{}{
	// 	2898.2899000000002,
	// 	2898.7232389234568,
	// 	2898.2899000000002,
	// 	2898.7232389234568,
	// 	2898.2899000000002,
	// 	2898.7232389234568,
	// 	2898.7232389234568,
	// }
	i := 0
	for {
		aeroKey, err = as.NewKey(namespace, set, i%1000000)
		if err != nil {
			log.Panic(err)
		}

		// if i == i {
		_, err = client.Execute(nil, aeroKey, "signal", "pushSignal", as.NewValue(rand.Float64()))
		if err != nil {
			log.Panicf("failed to connect (%s)", err)
		}
		// }

		record, err := client.Get(nil, aeroKey)
		if err != nil {
			log.Panicf("Get failed %s: %s", aeroKey, err)
		}

		if record == nil || record.Bins == nil {
			log.Panicf("Get found nothing")
			return
		}

		if record.Bins["value"] == nil || len(record.Bins["value"].([]interface{})) == 0 {
			log.Panicf("Record found, but returned nothing", record.Bins)
		}

		// fmt.Println(record)
	}

	// log.Printf("Get got %d bins with gen %d (%s)", len(record.Bins), record.Generation, aeroKey)
}

type signal struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
	Fact1 bool    `json:"fact1"`
	Fact2 bool    `json:"fact2"`
}

type signalPacket struct {
	Id            string   `json:"id"`
	Subgroupid    string   `json:"subgroupid"`
	Groupid       string   `json:"groupid"`
	Label         string   `json:"label"`
	LabelPath     string   `json:"labelPath"`
	Groupquantile float64  `json:"groupquantile"`
	LabelQuantile float64  `json:"labelQuantile"`
	Date          string   `json:"date"`
	Signals       []signal `json:"signals"`
}

func bulkSetGenerator(lines int, packetSize int) {
	for i := 0; i < lines; i++ {
		signalsList := []signalPacket{}
		for j := 0; j < packetSize; j++ {

			counter := i*packetSize + j
			floatCounter := float64(counter)

			var buffer bytes.Buffer
			buffer.WriteString("P")
			buffer.WriteString(strconv.Itoa(counter))

			signals := []signal{{Name: "signal1", Value: 0.7892345652323 + floatCounter, Fact1: false, Fact2: false}, {Name: "signal2", Value: floatCounter + 0.7232389234565, Fact1: false, Fact2: false}, {Name: "signal3", Value: floatCounter + 0.78922343234565, Fact1: false, Fact2: false}, {Name: "signal4", Value: floatCounter + 0.78234329234565, Fact1: false, Fact2: false}}
			signalsList = append(signalsList, signalPacket{Id: buffer.String(), Subgroupid: "i" + strconv.Itoa(counter), Groupid: "v" + strconv.Itoa(counter), Label: "b" + strconv.Itoa(counter), LabelPath: "l1/l2/l" + strconv.Itoa(counter), LabelQuantile: 50.23423, Groupquantile: 53.23423432, Date: "21-03-2018", Signals: signals})
		}
		bytes, _ := json.Marshal(&signalsList)
		fmt.Println(string(bytes))
	}
}
