package main

import (
	"bufio"
	"flag"
	"fmt"
	"log"
	"net/http"
	_ "net/http/pprof"
	"os"
	"runtime"
	"sync/atomic"
	"time"

	as "github.com/aerospike/aerospike-client-go"
)

var WritePolicy = as.NewWritePolicy(0, 0)
var Policy = as.NewPolicy()

var Host = flag.String("h", "127.0.0.1", "Aerospike server seed hostnames or IP addresses")
var Port = flag.Int("p", 3000, "Aerospike server seed hostname or IP address port number.")
var Namespace = flag.String("n", "test", "Aerospike namespace.")
var Set = flag.String("s", "testset", "Aerospike set name.")
var initdb = flag.Bool("i", false, "Write all keys to the db.")
var concurrency = flag.Int("c", 32, "Concurrency level.")
var showUsage = flag.Bool("u", false, "Show usage information.")
var profileMode = flag.Bool("profile", false, "Run benchmarks with profiler active on port 6060.")

var spend_lowerThan_1ms int64
var spend_greaterThan_1ms int64
var spend_greaterThan_2ms int64
var spend_greaterThan_4ms int64
var spend_greaterThan_8ms int64
var spend_greaterThan_16ms int64
var spend_greaterThan_32ms int64
var spend_greaterThan_64ms int64
var spend_greaterThan_128ms int64
var spend_greaterThan_256ms int64
var existCount int64

func PanicOnError(err error) {
	if err != nil {
		log.Fatalln(err.Error())
	}
}

func printParams() {
	log.Printf("hosts:\t\t%s", *Host)
	log.Printf("port:\t\t%d", *Port)
	log.Printf("namespace:\t\t%s", *Namespace)
	log.Printf("set:\t\t%s", *Set)
}

/////////////////////////////////////////////////////////////////

type Reader struct {
	ac     *as.Client
	idChan chan string
	flag   chan bool
}

func ReadLinesSlice(path string, idChan chan string) {
	for {
		file, err := os.Open(path)
		PanicOnError(err)

		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			idChan <- scanner.Text()
		}
		file.Close()
	}
	// p.flag <- true
}

func (p *Reader) initdb(path string) {
	// go p.ReadLinesSlice(path)
	fmt.Println(".....start writing .....")
	for {
		select {
		case uuid := <-p.idChan:
			key, err := as.NewKey(*Namespace, *Set, uuid)
			PanicOnError(err)

			err = p.ac.PutBins(nil, key, as.NewBin("bin1", 1))
			PanicOnError(err)

		case <-p.flag:
			return
		default:
			time.Sleep(time.Millisecond * 10)
		}
	}
	fmt.Println(".....finish writing.....")
	return
}

// func (p *Reader) do4ever(path string) {
// 	for {
// 		if err := p.do(path); err != nil {
// 			fmt.Println("[read error ] @err:", err)
// 		}
// 		// fmt.Println("####finish####")
// 	}
// }

func (p *Reader) do(path string) error {
	// go p.ReadLinesSlice(path)

	// fmt.Println(".....start.....")
	for {
		select {
		case uuid := <-p.idChan:
			p.business(uuid)
		case <-p.flag:
			return nil
		}
	}
	// fmt.Println(".....finish.....")
	return nil
}

func (p *Reader) business(uuid string) error {
	key, err := as.NewKey(*Namespace, *Set, uuid)
	if err != nil {
		return err
	}
	begin := time.Now().UnixNano()
	// _, e := p.ac.Exists(nil, key)
	_, e := p.ac.Get(nil, key)
	if e != nil {
		fmt.Println("[read error ] @err:", e)
	}
	spend := time.Now().UnixNano() - begin

	atomic.AddInt64(&existCount, 1)
	t := spend / 1e6
	if t < 1 {
		atomic.AddInt64(&spend_lowerThan_1ms, 1)
	} else if t >= 1 && t < 2 {
		atomic.AddInt64(&spend_greaterThan_1ms, 1)
	} else if t >= 2 && t < 4 {
		atomic.AddInt64(&spend_greaterThan_2ms, 1)
	} else if t >= 4 && t < 8 {
		atomic.AddInt64(&spend_greaterThan_4ms, 1)
	} else if t >= 8 && t < 16 {
		atomic.AddInt64(&spend_greaterThan_8ms, 1)
	} else if t >= 16 && t < 32 {
		atomic.AddInt64(&spend_greaterThan_16ms, 1)
	} else if t >= 32 && t < 64 {
		atomic.AddInt64(&spend_greaterThan_32ms, 1)
	} else if t >= 64 && t < 128 {
		atomic.AddInt64(&spend_greaterThan_64ms, 1)
	} else if t >= 128 && t < 256 {
		atomic.AddInt64(&spend_greaterThan_128ms, 1)
	} else {
		atomic.AddInt64(&spend_greaterThan_256ms, 1)
	}

	if atomic.LoadInt64(&existCount)%100000 == 0 {
		log.Printf("task execute:\t\t\t%d\n", atomic.LoadInt64(&existCount))
		log.Printf("\t <1ms:\t\t\t\t%d\n", atomic.LoadInt64(&spend_lowerThan_1ms))
		log.Printf("\t >=1ms && <2ms :\t\t%d\n", atomic.LoadInt64(&spend_greaterThan_1ms))
		log.Printf("\t >=2ms && <4ms :\t\t%d\n", atomic.LoadInt64(&spend_greaterThan_2ms))
		log.Printf("\t >=4ms && <8ms :\t\t%d\n", atomic.LoadInt64(&spend_greaterThan_4ms))
		log.Printf("\t >=8ms && <16ms :\t\t%d\n", atomic.LoadInt64(&spend_greaterThan_8ms))
		log.Printf("\t >=16ms && <32ms :\t\t%d\n", atomic.LoadInt64(&spend_greaterThan_16ms))
		log.Printf("\t >=32ms && <64ms :\t\t%d\n", atomic.LoadInt64(&spend_greaterThan_32ms))
		log.Printf("\t >=64ms && <128ms :\t\t%d\n", atomic.LoadInt64(&spend_greaterThan_64ms))
		log.Printf("\t >=128ms && <256ms :\t\t%d\n", atomic.LoadInt64(&spend_greaterThan_128ms))
		log.Printf("\t >=256ms :\t\t\t%d\n\n", atomic.LoadInt64(&spend_greaterThan_256ms))
	}
	return e
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	flag.Parse()

	printParams()

	// launch profiler if in profile mode
	// if *profileMode {
	go func() {
		log.Println(http.ListenAndServe(":6060", nil))
	}()
	// }

	cpolicy := as.NewClientPolicy()
	cpolicy.ConnectionQueueSize = 300
	cpolicy.LimitConnectionsToQueueSize = true
	client, err := as.NewClient(*Host, *Port)
	PanicOnError(err)

	idChan := make(chan string, 1024)

	p := Reader{
		ac:     client,
		idChan: idChan,
		flag:   make(chan bool),
	}

	path, _ := os.Getwd()

	if *initdb {
		p.initdb(path + "/keys")
	}

	go ReadLinesSlice(path+"/keys", idChan)

	l := make(chan bool)
	for i := 0; i < *concurrency; i++ {
		go p.do(path + "/keys")
	}

	<-l
}
