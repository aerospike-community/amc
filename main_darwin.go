// +build darwin

package main

import (
	"flag"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"runtime/debug"

	log "github.com/Sirupsen/logrus"

	"github.com/aerospike-community/amc/common"
	"github.com/aerospike-community/amc/controllers"
)

var (
	configFile   = flag.String("config-file", "/etc/amc/amc.conf", "Configuration file.")
	configDir    = flag.String("config-dir", "/etc/amc/", "Configuration dir.")
	profileMode  = flag.Bool("profile", false, "Run benchmarks with profiler active on port 6060.")
	daemonMode   = flag.Bool("daemon", false, "Run AMC in daemon mode.")
	daemonSignal = flag.String("signal", "", `send signal to the daemon
		stop — graceful shutdown.`)
)

func main() {
	defer func() {
		if err := recover(); err != nil {
			log.Fatal(string(debug.Stack()))
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

	// close the log file on exit
	defer func() {
		if config.LogFile != nil {
			config.LogFile.Close()
		}
	}()

	common.SetupDatabase(config.AMC.Database)
	controllers.Server(&config)
}
