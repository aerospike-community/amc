package main

import (
	log "github.com/Sirupsen/logrus"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/controllers"
)

var amcVersion string
var amcBuild string
var amcEdition string

func main() {
	log.Infof("Starting AMC server, version: %s %s", amcVersion, amcEdition)

	config := common.Config{}
	common.InitConfig(&config)

	controllers.Server(amcEdition, amcVersion, amcBuild, &config)
}
