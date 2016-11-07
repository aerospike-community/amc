package main

import (
	log "github.com/Sirupsen/logrus"

	"github.com/aerospike/aerospike-console/controllers"
)

var amcVersion string
var amcBuild string
var amcEdition string

func main() {
	log.Debugf("Starting AMC server, version: %s %s", amcVersion, amcEdition)

	controllers.Server(amcEdition, amcVersion, amcBuild)
}

func init() {
	log.SetLevel(log.DebugLevel)
}
