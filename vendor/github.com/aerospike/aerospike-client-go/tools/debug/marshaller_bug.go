package main

import (
	"time"

	"github.com/aerospike/aerospike-client-go"
)

const (
	namespace = "test"
	set       = "ips"
)

type aeroRepo struct {
	client *aerospike.Client
	qp     *aerospike.QueryPolicy
}

func NewAeroRepo(c *aerospike.Client) aeroRepo {
	return aeroRepo{
		client: c,
		qp:     aerospike.NewQueryPolicy(),
	}
}

func (c aeroRepo) Get(addr string) (ipAddr *IPAddress, err error) {
	var key *aerospike.Key
	key, err = aerospike.NewKey(namespace, set, addr)
	if err != nil {
		return
	}

	ipAddr = &IPAddress{}
	err = c.client.GetObject(nil, key, ipAddr)
	return
}

func (c aeroRepo) Save(ipAddr *IPAddress) (err error) {
	var key *aerospike.Key
	key, err = aerospike.NewKey(namespace, set, ipAddr.IPAddress)
	if err != nil {
		return
	}

	err = c.client.PutObject(nil, key, ipAddr)
	return
}

type IPAddress struct {
	IPAddress  string    `as:"ipaddress"`
	ReverseDNS string    `as:"rdns"`
	Service    int       `as:"service"`
	Created    time.Time `as:"created"`
}

func main() {
	client, err := aerospike.NewClient("ubvm", 3000)
	if err != nil {
		panic(err)
	}

	repo := NewAeroRepo(client)

	ip := IPAddress{
		IPAddress:  "192.168.2.1",
		ReverseDNS: "blah.arpa",
		Service:    3,
		Created:    time.Now(),
	}

	if err := repo.Save(&ip); err != nil {
		panic(err)
	}

	repo.Get("192.168.2.1")
}
