// +build !darwin

package main

import (
	"flag"
	"io/ioutil"
	"net/http"
	_ "net/http/pprof"
	"os"
	"runtime"
	"runtime/debug"
	"syscall"

	log "github.com/Sirupsen/logrus"
	"github.com/sevlyar/go-daemon"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/controllers"
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

	if *daemonSignal == "stop" {
		log.SetOutput(ioutil.Discard)
	}

	// launch profiler if in profile mode
	if *profileMode {
		go func() {
			log.Println(http.ListenAndServe(":6060", nil))
		}()
	}

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
		log.Infoln("Starting AMC daemon...")
		go controllers.Server(&config)
		log.Infoln("AMC daemon started.")

		err = daemon.ServeSignals()
		if err != nil {
			log.Errorln("Error: ", err)
		}
		log.Println("daemon terminated.")
	} else {
		common.SetupDatabase(config.AMC.Database)
		controllers.Server(&config)
	}
}

func shutdownHandler(sig os.Signal) error {
	log.Println("Shutting down AMC gracefully...")
	controllers.ShutdownServer()
	return daemon.ErrStop
}
