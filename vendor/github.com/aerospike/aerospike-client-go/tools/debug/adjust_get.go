package main

import (
	"fmt"
	"log"
	"math"
	"os"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

const (
	namespace = "test"
	set       = "adjust"
	key       = "key"
)

func main() {

	policy := as.NewClientPolicy()
	policy.Timeout = 5 * time.Second
	client, err := as.NewClientWithPolicyAndHost(policy, as.NewHost("ubvm", 3000))
	if err != nil {
		log.Panicf("failed to connect (%s)", err)
	}

	client.DefaultPolicy.MaxRetries = 10
	client.DefaultWritePolicy = as.NewWritePolicy(0, math.MaxUint32)

	if len(os.Args) < 2 {
		log.Panicf("missing arg")
	}

	aeroKey, err := as.NewKey(namespace, set, key)
	if err != nil {
		log.Panic(err)
	}

	switch arg := os.Args[1]; arg {
	case "get":
		record, err := client.Get(nil, aeroKey)
		if err != nil {
			log.Panicf("Get failed %s: %s", aeroKey, err)
		}
		if record == nil || record.Bins == nil {
			log.Printf("Get found nothing %s", aeroKey)
			return
		}

		log.Printf("Get got %d bins with gen %d (%s)", len(record.Bins), record.Generation, aeroKey)
		// for key, value := range record.Bins {
		// 	// log.Printf("    %#v -> %#v", key, value)
		// }
		// for i := 0; i < 17; i++ {
		// 	log.Println(i)
		// 	bin := record.Bins[fmt.Sprintf("bin%d", i)].(map[interface{}]interface{})
		// 	// log.Println(bin)
		// 	if len(bin) != i {
		// 		panic("Error")
		// 	}

		// 	for j := 1; j < i; j++ {
		// 		key := bin[fmt.Sprintf("key%d", j)].(map[interface{}]interface{})
		// 		fmt.Println(key, len(key), i, j, 2^(j-1))
		// 		if len(key) != i {
		// 			panic("err")
		// 		}
		// 		for k := 0; k < i; k++ {
		// 			val := key[fmt.Sprintf("val%d", k)].(string)
		// 			fmt.Println(val, len(val), k, 2^k, 2<<uint(k))
		// 			if len(val) != 1<<uint(k) {
		// 				panic("err")
		// 			}
		// 		}
		// 	}
		// 	// log.Printf("    %#v -> %#v", key, value)
		for i := 0; i < 17; i++ {
			log.Println(i)
			bin := record.Bins[fmt.Sprintf("bin%d", i)].(map[interface{}]interface{})
			// log.Println(bin)
			if len(bin) != i {
				panic("Error")
			}

			for j := 1; j < i; j++ {
				key := bin[fmt.Sprintf("key%d", j)].([]interface{})
				fmt.Println(key, len(key), i, j, 2^(j-1))
				if len(key) != i {
					panic("err")
				}
				for k := 0; k < i; k++ {
					val := key[k].(string)
					fmt.Println(val, len(val), k, 2^k, 2<<uint(k))
					if len(val) != 1<<uint(k) {
						panic("err")
					}
				}
			}
			// log.Printf("    %#v -> %#v", key, value)
		}

	case "batchget":
		keys := []*as.Key{aeroKey}
		records, err := client.BatchGet(nil, keys)
		if err != nil {
			log.Panicf("BatchGet failed %s: %s", aeroKey, err)
		}
		if len(records) == 0 {
			log.Printf("BatchGet found nothing %s", keys)
			return
		}

		log.Printf("BatchGet got %d records (%s)", len(records), aeroKey)
		for i, record := range records {
			log.Printf("  record %d with gen %d", i, record.Generation)
			if record == nil {
				log.Printf("    not found")
				continue
			}

			for key, value := range record.Bins {
				log.Printf("    %#v -> %#v", key, value)
			}
		}

	case "set", "put":
		value := map[string]string{}
		for i := 0; i < 20; i++ {
			key := fmt.Sprintf("k%d", i)
			value[key] = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
		}

		bins := []*as.Bin{as.NewBin("go_long", value)}

		if err := client.PutBins(nil, aeroKey, bins...); err != nil {
			log.Panicf("failed to set %s -> %q: %s", aeroKey, bins, err)
		}

		log.Printf("set bins %s -> %q", aeroKey, bins)

	case "delete":
		existed, err := client.Delete(nil, aeroKey)
		if err != nil {
			log.Panicf("failed to delete %s: %s", aeroKey, err)
		}

		if existed {
			log.Printf("deleted %s", aeroKey)
		} else {
			log.Printf("didn't exist: %s", aeroKey)
		}

	default:
		log.Printf("not supported: %q", arg)
	}
}
