// Copyright 2013-2016 Aerospike, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package main

import (
	"flag"
	"log"
	"os"
	"runtime"
	"runtime/pprof"
	"sync"
	"time"

	. "github.com/aerospike/aerospike-client-go"
)

// flag information
var host = flag.String("h", "127.0.0.1", "Aerospike server seed hostnames or IP addresses")
var port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var namespace = flag.String("n", "test", "Aerospike namespace.")
var set = flag.String("s", "testset", "Aerospike set name.")
var operand = flag.String("o", "get", "Operand: get, set, delete")
var binName = flag.String("b", "bin", "Bin name")
var key = flag.String("k", "key", "Key information")
var recordTTL = flag.Int("e", 0, "Record TTL in seconds")
var value = flag.String("v", "", "Value information; used only by get operand")
var verbose = flag.Bool("verbose", false, "Verbose mode")
var showUsage = flag.Bool("u", false, "Show usage information.")
var verify = flag.Bool("verify", false, "Verify the results.")
var genData = flag.Bool("gen", false, "Generate data.")
var keyRange = flag.Int("limit", 3000, "Upper limit for key values [0...N).")
var cpuprofile = flag.String("cpuprofile", "", "write cpu profile to file")
var concurrency = flag.Int("c", 5, "Number of goroutines.")

var globalUser *user
var theTime = time.Now()

func main() {
	flag.Parse()
	runtime.GOMAXPROCS(runtime.NumCPU())

	if *cpuprofile != "" {
		f, err := os.Create(*cpuprofile)
		if err != nil {
			panic(err)
		}
		pprof.StartCPUProfile(f)
		defer pprof.StopCPUProfile()
	}

	log.SetOutput(os.Stdout)
	// log.SetFlags(0)

	// l.Logger.SetLevel(l.DEBUG)

	clientPolicy := NewClientPolicy()
	// clientPolicy.ConnectionQueueSize = 256
	// clientPolicy.LimitConnectionsToQueueSize = true
	// if *user != "" {
	// 	clientPolicy.User = *user
	// 	clientPolicy.Password = *password
	// }

	// connect to the host
	client, err := NewClientWithPolicy(clientPolicy, *host, *port)
	if err != nil {
		panic(err.Error())
	}

	defer client.Close()
	//sample query values
	// hashValue := 800733420254867186
	// hashBin := "h_ap_nt_de"

	log.Println("===================================")

	if *genData {
		generateData(client)
	}

	cnt := *concurrency
	var wg sync.WaitGroup
	wg.Add(cnt)
	for i := 0; i < cnt; i++ {
		go func() {
			defer wg.Done()

			n := 0
			nerr := 0
			start := time.Now()

			policy := NewPolicy()
			newUser := user{}
			for k := 0; k < *keyRange; k++ {
				//queries to aerospike
				key, _ := NewKey(*namespace, *set, k)
				err := client.GetObject(policy, key, &newUser)
				if err != nil {
					log.Println("==========================", err.Error())
				}

				if *verify {
					if err := verifyResult(k, globalUser, &newUser); err != nil {
						log.Println(err)
						nerr++
					}
				}
				n++
			}
			log.Println("Number of resuts:", n, "Errors:", nerr, "Took:", time.Since(start))
		}()
	}

	wg.Wait()
	log.Println("Run Ended")
}

func verifyResult(key int, origUser, newUser *user) error {
	// if newUser == nil {
	// 	return fmt.Errorf("Record not found for id %d", key)
	// }

	// if newUser.Counter != key || len(newUser.Randstr) != (key*713)%619 {
	// 	// log.Println("len bins is:", len(origUser), "len res is:", len(newUser))
	// 	// log.Println("counter:", newUser.counter)
	// 	// log.Println("randstr:", newUser.randstr)
	// 	log.Fatalf("Value mismatch: Counter %d != %d, len(randStr) %d != %d", newUser.Counter, key, len(newUser.Randstr), (key*713)%619)
	// }

	// // newUser.Counter = 0
	// // newUser.Randstr = ""

	// if !cmp.Equal(origUser, newUser) {
	// 	// log.Println("diff is", cmp.Diff(origUser, newUser))
	// 	return fmt.Errorf("diff is %s", cmp.Diff(origUser, newUser))
	// }

	return nil
}

func generateData(client *Client) {
	globalUser = makeUser()

	if *genData {
		t := time.Now()
		err := client.Truncate(nil, *namespace, *set, nil)
		if err != nil {
			log.Fatal(err)
		}
		time.Sleep(time.Second)
		log.Println("Truncation finished...", time.Since(t))

		log.Println("Generating data...")
		t = time.Now()
		for i := 0; i < *keyRange; i++ {
			globalUser.Counter = i
			// globalUser.Randstr = strings.Repeat("s", (i*713)%619)
			key, _ := NewKey(*namespace, *set, i)

			err := client.PutObjectFast(nil, key, globalUser)
			if err != nil {
				panic(err)
			}
		}
		log.Println("Generating data finished successfully...", time.Since(t))
		os.Exit(1)
	}

	// globalUser.Counter = 0
	// globalUser.Randstr = ""
}

func makeUser() *user {
	return &user{
		Counter:    0,
		Id:         "5c7fe73c9d23f16d4543987b",
		Index:      0,
		Guid:       "ba75520b-e5f8-4d40-b1db-84e8299c36ed",
		IsActive:   false,
		Balance:    164744,
		Picture:    "http://placehold.it/32x32",
		Age:        24,
		EyeColor:   "brown",
		Name:       "Isabelle Valentine",
		Gender:     "female",
		Company:    "MOTOVATE",
		Email:      "isabellevalentine@motovate.com",
		Phone:      "+1 (887) 530-3065",
		Address:    "757 Boulevard Court, Shelby, Vermont, 3612",
		About:      "Adipisicing mollit pariatur eiusmod minim deserunt voluptate dolore et non do culpa ea exercitation. Laboris consequat labore ullamco ullamco aute do aliqua aute mollit. Ipsum elit do dolor nulla nostrud cupidatat ullamco ipsum id. Cupidatat elit fugiat ullamco nisi ipsum dolore ex consectetur cillum aute cillum eu. Ad cillum in exercitation elit commodo consectetur nisi. Ipsum veniam qui ipsum occaecat commodo sint anim. Laboris duis sit duis exercitation mollit id eiusmod officia enim exercitation aliqua sit fugiat.\r\n",
		Registered: theTime,
		Latitude:   65.472523,
		Longitude:  -44.358939,
		// Tags: []string{
		// 	"eiusmod",
		// 	"reprehenderit",
		// 	"voluptate",
		// 	"ea",
		// 	"id",
		// 	"sunt",
		// 	"laborum",
		// },
		// Friends: []map[string]interface{}{
		// 	{
		// 		"id":   0,
		// 		"name": "Eve Rosales",
		// 	},
		// 	{
		// 		"id":   1,
		// 		"name": "Howard Burton",
		// 	},
		// 	{
		// 		"id":   2,
		// 		"name": "Lauren Williamson",
		// 	},
		// },
		Greeting:      "Hello, Isabelle Valentine! You have 7 unread messages.",
		FavoriteFruit: "banana",
	}
}

type user struct {
	Counter    int
	Id         string
	Index      int
	Guid       string
	IsActive   bool
	Balance    uint64
	Picture    string
	Age        uint8
	EyeColor   string
	Name       string
	Gender     string
	Company    string
	Email      string
	Phone      string
	Address    string
	About      string
	Registered time.Time
	Latitude   float64
	Longitude  float64
	// Tags          []string
	// Friends       []map[string]interface{}
	Greeting      string
	FavoriteFruit string
	Randstr       string
}

var _ RecordWriter = &user{}

func (u *user) EstimateRecordSize() (int, error) {
	total := 0

	// Counter
	n, err := EstimateOperationSize("Counter", IntegerValue(u.Counter))
	total += n
	if err != nil {
		return total, err
	}

	// Id
	n, err = EstimateOperationSize("Id", StringValue(u.Id))
	total += n
	if err != nil {
		return total, err
	}

	// Index
	n, err = EstimateOperationSize("Index", IntegerValue(u.Index))
	total += n
	if err != nil {
		return total, err
	}

	// Guid
	n, err = EstimateOperationSize("Guid", StringValue(u.Guid))
	total += n
	if err != nil {
		return total, err
	}

	// IsActive
	fldIsActive := 0
	if u.IsActive {
		fldIsActive = 1
	}
	n, err = EstimateOperationSize("IsActive", IntegerValue(fldIsActive))
	total += n
	if err != nil {
		return total, err
	}

	// Balance
	n, err = EstimateOperationSize("Balance", IntegerValue(u.Balance))
	total += n
	if err != nil {
		return total, err
	}

	// Picture
	n, err = EstimateOperationSize("Picture", StringValue(u.Picture))
	total += n
	if err != nil {
		return total, err
	}

	// Age
	n, err = EstimateOperationSize("Age", StringValue(u.Age))
	total += n
	if err != nil {
		return total, err
	}

	// EyeColor
	n, err = EstimateOperationSize("EyeColor", StringValue(u.EyeColor))
	total += n
	if err != nil {
		return total, err
	}

	// Name
	n, err = EstimateOperationSize("Name", StringValue(u.Name))
	total += n
	if err != nil {
		return total, err
	}

	// Gender
	n, err = EstimateOperationSize("Gender", StringValue(u.Gender))
	total += n
	if err != nil {
		return total, err
	}

	// Company
	n, err = EstimateOperationSize("Company", StringValue(u.Company))
	total += n
	if err != nil {
		return total, err
	}

	// Email
	n, err = EstimateOperationSize("Email", StringValue(u.Email))
	total += n
	if err != nil {
		return total, err
	}

	// Phone
	n, err = EstimateOperationSize("Phone", StringValue(u.Phone))
	total += n
	if err != nil {
		return total, err
	}

	// Address
	n, err = EstimateOperationSize("Address", StringValue(u.Address))
	total += n
	if err != nil {
		return total, err
	}

	// About
	n, err = EstimateOperationSize("About", StringValue(u.About))
	total += n
	if err != nil {
		return total, err
	}

	// Registered
	n, err = EstimateOperationSize("Registered", IntegerValue(u.Registered.UnixNano()))
	total += n
	if err != nil {
		return total, err
	}

	// Latitude
	n, err = EstimateOperationSize("Latitude", FloatValue(u.Latitude))
	total += n
	if err != nil {
		return total, err
	}

	// Longitude
	n, err = EstimateOperationSize("Longitude", FloatValue(u.Longitude))
	total += n
	if err != nil {
		return total, err
	}

	// // Tags
	// n, err = EstimateOperationSize( "Tags", ListValue(u.Tags))
	// total += n
	// if err != nil {
	// 	return total, err
	// }

	// // Friends
	// n, err = EstimateOperationSize( "Friends", MapValue(u.Friends))
	// total += n
	// if err != nil {
	// 	return total, err
	// }

	// Greeting
	n, err = EstimateOperationSize("Greeting", StringValue(u.Greeting))
	total += n
	if err != nil {
		return total, err
	}

	// FavoriteFruit
	n, err = EstimateOperationSize("FavoriteFruit", StringValue(u.FavoriteFruit))
	total += n
	if err != nil {
		return total, err
	}

	// Randstr
	n, err = EstimateOperationSize("Randstr", StringValue(u.Randstr))
	total += n
	if err != nil {
		return total, err
	}

	return total, nil
}

func (u *user) OpCount() int {
	return 24 - 2 // fields
}

func (u *user) EncodeRecord(buf BufferEx) (int, error) {
	total := 0

	// Counter
	n, err := AeroWriteOperationForValue(buf, "Counter", IntegerValue(u.Counter))
	total += n
	if err != nil {
		return total, err
	}

	// Id
	n, err = AeroWriteOperationForValue(buf, "Id", StringValue(u.Id))
	total += n
	if err != nil {
		return total, err
	}

	// Index
	n, err = AeroWriteOperationForValue(buf, "Index", IntegerValue(u.Index))
	total += n
	if err != nil {
		return total, err
	}

	// Guid
	n, err = AeroWriteOperationForValue(buf, "Guid", StringValue(u.Guid))
	total += n
	if err != nil {
		return total, err
	}

	// IsActive
	fldIsActive := 0
	if u.IsActive {
		fldIsActive = 1
	}
	n, err = AeroWriteOperationForValue(buf, "IsActive", IntegerValue(fldIsActive))
	total += n
	if err != nil {
		return total, err
	}

	// Balance
	n, err = AeroWriteOperationForValue(buf, "Balance", IntegerValue(u.Balance))
	total += n
	if err != nil {
		return total, err
	}

	// Picture
	n, err = AeroWriteOperationForValue(buf, "Picture", StringValue(u.Picture))
	total += n
	if err != nil {
		return total, err
	}

	// Age
	n, err = AeroWriteOperationForValue(buf, "Age", StringValue(u.Age))
	total += n
	if err != nil {
		return total, err
	}

	// EyeColor
	n, err = AeroWriteOperationForValue(buf, "EyeColor", StringValue(u.EyeColor))
	total += n
	if err != nil {
		return total, err
	}

	// Name
	n, err = AeroWriteOperationForValue(buf, "Name", StringValue(u.Name))
	total += n
	if err != nil {
		return total, err
	}

	// Gender
	n, err = AeroWriteOperationForValue(buf, "Gender", StringValue(u.Gender))
	total += n
	if err != nil {
		return total, err
	}

	// Company
	n, err = AeroWriteOperationForValue(buf, "Company", StringValue(u.Company))
	total += n
	if err != nil {
		return total, err
	}

	// Email
	n, err = AeroWriteOperationForValue(buf, "Email", StringValue(u.Email))
	total += n
	if err != nil {
		return total, err
	}

	// Phone
	n, err = AeroWriteOperationForValue(buf, "Phone", StringValue(u.Phone))
	total += n
	if err != nil {
		return total, err
	}

	// Address
	n, err = AeroWriteOperationForValue(buf, "Address", StringValue(u.Address))
	total += n
	if err != nil {
		return total, err
	}

	// About
	n, err = AeroWriteOperationForValue(buf, "About", StringValue(u.About))
	total += n
	if err != nil {
		return total, err
	}

	// Registered
	n, err = AeroWriteOperationForValue(buf, "Registered", IntegerValue(u.Registered.UnixNano()))
	total += n
	if err != nil {
		return total, err
	}

	// Latitude
	n, err = AeroWriteOperationForValue(buf, "Latitude", FloatValue(u.Latitude))
	total += n
	if err != nil {
		return total, err
	}

	// Longitude
	n, err = AeroWriteOperationForValue(buf, "Longitude", FloatValue(u.Longitude))
	total += n
	if err != nil {
		return total, err
	}

	// // Tags
	// n, err = AeroWriteOperationForValue(buf, "Tags", ListValue(u.Tags))
	// total += n
	// if err != nil {
	// 	return total, err
	// }

	// // Friends
	// n, err = AeroWriteOperationForValue(buf, "Friends", MapValue(u.Friends))
	// total += n
	// if err != nil {
	// 	return total, err
	// }

	// Greeting
	n, err = AeroWriteOperationForValue(buf, "Greeting", StringValue(u.Greeting))
	total += n
	if err != nil {
		return total, err
	}

	// FavoriteFruit
	n, err = AeroWriteOperationForValue(buf, "FavoriteFruit", StringValue(u.FavoriteFruit))
	total += n
	if err != nil {
		return total, err
	}

	// Randstr
	n, err = AeroWriteOperationForValue(buf, "Randstr", StringValue(u.Randstr))
	total += n
	if err != nil {
		return total, err
	}

	return total, nil
}
