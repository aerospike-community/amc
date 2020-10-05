package main

import (
	"log"
	"sync"

	"github.com/aerospike-community/amc/tools/load"
)

const nconn = 10 // connections per cluster

func main() {

	// base url of the AMC server
	load.BaseURL = "http://localhost:8082/aerospike/service/clusters/"

	// instances of the aerospike clusters
	var clients []load.Client = []load.Client{
		{IP: "172.17.0.2", Port: "3000"},
		{IP: "172.17.0.5", Port: "7000", Username: "all", Password: "all"},
		{IP: "192.168.121.116", Port: "3000", Username: "admin", Password: "admin"},
		{IP: "192.168.121.116", Port: "3000", Username: "subadmin", Password: "subadmin"},
	}

	var wg sync.WaitGroup
	for i := 0; i < len(clients); i++ {
		cc := clients[i]
		for j := 0; j < nconn; j++ {
			c := load.Client{
				IP:       cc.IP,
				Port:     cc.Port,
				Username: cc.Username,
				Password: cc.Password,
				TLSName:  cc.TLSName,
			}
			err := c.Connect()
			if err != nil {
				log.Println(err.Error())
				break
			}
			c.Start(&wg)
		}
	}

	wg.Wait()
}
