package main

import (
	"flag"

	log "github.com/Sirupsen/logrus"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/controllers"
)

var (
	configFile = flag.String("config-file", "", "Configuration file.")
	configDir  = flag.String("config-dir", "", "Configuration dir.")
)

func main() {
	flag.Parse()

	log.Infof("Trying to start the AMC server...")

	config := common.Config{}
	common.InitConfig(*configFile, *configDir, &config)

	controllers.Server(&config)
}
