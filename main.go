package main

import (
	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"

	"github.com/aerospike/aerospike-console/controllers"
	"github.com/aerospike/aerospike-console/observer"
)

func main() {
	observer := observer.New()

	cp := as.NewClientPolicy()
	cp.LimitConnectionsToQueueSize = true
	cp.ConnectionQueueSize = 2
	observer.Register(cp, "ubvm", 3000)

	controllers.Server()
}

func init() {
	log.SetLevel(log.DebugLevel)
}
