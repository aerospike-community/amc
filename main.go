package main

import (
	"flag"
	"net/http"
	_ "net/http/pprof"
	"runtime"

	log "github.com/Sirupsen/logrus"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/controllers"
)

var (
	configFile  = flag.String("config-file", "", "Configuration file.")
	configDir   = flag.String("config-dir", "", "Configuration dir.")
	profileMode = flag.Bool("profile", false, "Run benchmarks with profiler active on port 6060.")
)

func main() {
	defer func() {
		if r := recover(); r != nil {
			log.Error(r)
		}
	}()

	runtime.GOMAXPROCS(runtime.NumCPU())

	flag.Parse()

	// launch profiler if in profile mode
	if *profileMode {
		go func() {
			log.Println(http.ListenAndServe(":6060", nil))
		}()
	}

	log.Infof("Trying to start the AMC server...")

	config := common.Config{}
	common.InitConfig(*configFile, *configDir, &config)

	controllers.Server(&config)
}
