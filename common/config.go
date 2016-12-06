package common

import (
	"fmt"
	"os"
	"strings"

	"github.com/BurntSushi/toml"
	log "github.com/Sirupsen/logrus"
)

type Config struct {
	AMC struct {
		UpdateInterval int    `toml:"update_interval"`
		CertFile       string `toml:"certfile"`
		KeyFile        string `toml:"keyfile"`

		Bind     string `toml:"bind"`
		PidFile  string `toml:"pidfile"`
		LogLevel string `toml:"loglevel"`
		ErrorLog string `toml:"errorlog"`
		ProcName string `toml:"proc_name"`
		Chdir    string `toml:"chdir"`
		Timeout  int    `toml:"timeout"`
	}
}

const blob = `[AMC]
update_interval = 5
#certfile = "<certificate_file_path>"
#keyfile = "<key_file_path>"
#Example : File paths should be double quoted.
#certfile = "/home/amc/self-ssl.crt"
#keyfile = "/home/amc/self-ssl.key"

bind = "0.0.0.0:8081"
pidfile = "/tmp/amc.pid"
loglevel = "debug"
errorlog = "/var/log/amc/aerospike_amc.log"
proc_name = "amc"
chdir = "/opt/amc/server"
timeout = 150
`

func InitConfig(config *Config) {
	log.SetLevel(log.DebugLevel)
	log.Debugf("Reading config file...")

	// blob, err := ioutil.ReadFile("/etc/amc/config/amc.conf")
	// if err != nil {
	// 	log.Fatal(err)
	// }

	if _, err := toml.Decode(string(blob), &config); err != nil {
		log.Fatal(err)
	}

	fmt.Println(config)

	// setLogFile(config.AMC.ErrorLog)
	setLogLevel(config.AMC.LogLevel)
}

func setLogFile(filepath string) {
	out, err := os.OpenFile(filepath, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}
	log.SetOutput(out)
}

func setLogLevel(level string) {
	level = strings.ToLower(level)
	log.SetLevel(log.InfoLevel)
	switch level {
	case "info":
		log.SetLevel(log.InfoLevel)
	case "warning":
		log.SetLevel(log.WarnLevel)
	case "error":
		log.SetLevel(log.ErrorLevel)
	case "debug":
		log.SetLevel(log.DebugLevel)
	}
}
