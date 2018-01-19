// +build !darwin

package main

import (
	"context"
	"flag"
	"io/ioutil"
	"net/http"
	_ "net/http/pprof"
	"os"
	"runtime"
	"runtime/debug"
	"strconv"
	"strings"
	"syscall"
	"time"

	log "github.com/Sirupsen/logrus"
	"github.com/sevlyar/go-daemon"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/controllers"

	"github.com/citrusleaf/amc-agent/logmanager"
	"github.com/citrusleaf/amc-agent/network"
	"github.com/citrusleaf/amc-agent/util"
)

var (
	agentMode    = flag.Bool("agent", false, "Start AMC in agent mode.")
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

	if *daemonSignal == "stop" {
		log.SetOutput(ioutil.Discard)
	}

	// launch profiler if in profile mode
	if *profileMode {
		go func() {
			log.Println(http.ListenAndServe(":6060", nil))
		}()
	}

	if *agentMode {
		setupAgent()
	} else {
		setupServer()
	}
}

func setupServer() {
	log.Infof("Trying to start the AMC server...")

	config := common.Config{}
	common.InitConfig(*configFile, *configDir, &config)

	/*

		manage daemon

	*/

	daemon.AddCommand(daemon.StringFlag(daemonSignal, "stop"), syscall.SIGTERM, shutdownHandler)

	cntxt := &daemon.Context{
		PidFileName: config.AMC.PIDFile,
		PidFilePerm: 0644,
		LogFileName: config.AMC.ErrorLog,
		LogFilePerm: 0640,
		WorkDir:     config.AMC.Chdir,
		Umask:       027,
		Args:        flag.Args(),
	}

	if len(daemon.ActiveFlags()) > 0 {
		d, err := cntxt.Search()
		if err != nil {
			log.Fatalln("Unable to send signal to the daemon:", err)
		}
		if err := daemon.SendCommands(d); err != nil {
			log.Fatalln(err)
		}
		return
	}

	if *daemonMode {
		d, err := cntxt.Reborn()
		if err != nil {
			log.Fatalln(err)
		}
		if d != nil {
			return
		}
		defer cntxt.Release()

		common.SetupDatabase(config.AMC.Database)
		common.SetupTSDatabase(config.AMC.TimeSeriesDatabase)
		log.Infoln("Starting AMC daemon...")
		controllers.GoaServer(&config)
		// go controllers.Server(&config)
		log.Infoln("AMC daemon started.")

		err = daemon.ServeSignals()
		if err != nil {
			log.Errorln("Error: ", err)
		}
		log.Println("daemon terminated.")
	} else {
		common.SetupDatabase(config.AMC.Database)
		common.SetupTSDatabase(config.AMC.TimeSeriesDatabase)
		controllers.GoaServer(&config)
	}
}

func setupAgent() {
	log.Infof("Trying to start the AMC Agent...")

	config := common.Config{}
	common.InitConfig(*configFile, *configDir, &config)

	/*
		manage daemon
	*/

	daemon.AddCommand(daemon.StringFlag(daemonSignal, "stop"), syscall.SIGTERM, shutdownHandler)

	cntxt := &daemon.Context{
		PidFileName: config.AGENT.PIDFile,
		PidFilePerm: 0644,
		LogFileName: config.AGENT.ErrorLog,
		LogFilePerm: 0640,
		WorkDir:     config.AGENT.Chdir,
		Umask:       027,
		Args:        flag.Args(),
	}

	if len(daemon.ActiveFlags()) > 0 {
		d, err := cntxt.Search()
		if err != nil {
			log.Fatalln("Unable to send signal to the daemon:", err)
		}
		if err := daemon.SendCommands(d); err != nil {
			log.Fatalln(err)
		}
		return
	}

	if *daemonMode {
		d, err := cntxt.Reborn()
		if err != nil {
			log.Fatalln(err)
		}
		if d != nil {
			return
		}
		defer cntxt.Release()

		log.Infoln("Starting AMC Agent daemon...")
		go initAgent(&config)
		log.Infoln("AMC Agent daemon started.")

		err = daemon.ServeSignals()
		if err != nil {
			log.Errorln("Error: ", err)
		}
		log.Println("daemon terminated.")
	} else {
		initAgent(&config)
	}
}

func shutdownHandler(sig os.Signal) error {
	log.Println("Shutting down AMC gracefully...")
	controllers.ShutdownServer()
	return daemon.ErrStop
}

func initAgent(config *common.Config) {
	util.NewAmcAgentLog(config.AGENT.ErrorLog, strings.ToUpper(config.AGENT.LogLevel))

	ctx1, _ := context.WithCancel(context.Background())

	logManagerObj, err := logmanager.NewLogManager(ctx1, config.AGENT.AerospikeServerLogPath, config.AGENT.AerospikeServerCurrentLogFileName)
	if err != nil {
		util.Log.Error("Error in creating Agent's Log Manager. ", err.Error())
		return
	}

	go logMemStats()

	protocol := network.Protocol{
		ListnerIP:   config.AGENT.BindIP,
		ListnerPort: strconv.Itoa(int(config.AGENT.BindPort)),
	}

	if config.AGENT.Protocol == "tcp" {
		tcp := network.Tcp(protocol)

		if err := network.Listner(&tcp, logManagerObj); err != nil {
			util.Log.Error("Error initializing the TCP network listner")
			return
		}
	} else if config.AGENT.Protocol == "udp" {
		udp := network.Udp(protocol)

		if err := network.Listner(&udp, logManagerObj); err != nil {
			util.Log.Error("Error initializing the UDP network listner")
			return
		}
	} else {
		util.Log.Error("Invalid protocol ", protocol)
		return
	}
}

func logMemStats() {
	var mstats runtime.MemStats
	for {
		runtime.ReadMemStats(&mstats)
		util.Log.Printf("Alloc: %v, TotalAlloc: %v, Sys: %v, Lookups: %v, Mallocs: %v, Frees: %v, HeapAlloc: %v, HeapSys: %v, HeapIdle: %v, HeapInuse: %v, HeapReleased: %v, HeapObjects: %v, StackInuse: %v, StackSys: %v", mstats.Alloc, mstats.TotalAlloc, mstats.Sys, mstats.Lookups, mstats.Mallocs, mstats.Frees, mstats.HeapAlloc, mstats.HeapSys, mstats.HeapIdle, mstats.HeapInuse, mstats.HeapReleased, mstats.HeapObjects, mstats.StackInuse, mstats.StackSys)
		time.Sleep(30 * time.Second)
	}
}
