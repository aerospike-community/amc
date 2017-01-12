package common

import (
	"database/sql"
	"io/ioutil"
	"os"
	"strings"

	"github.com/BurntSushi/toml"
	log "github.com/Sirupsen/logrus"

	_ "github.com/mattn/go-sqlite3"
)

var AMCVersion string
var AMCBuild string
var AMCEdition string
var AMCEnv string

var db *sql.DB

func AMCIsProd() bool {
	return AMCEnv == "prod"
}

func AMCIsEnterprise() bool {
	return AMCEdition == "enterprise"
}

type Config struct {
	AMC struct {
		UpdateInterval int    `toml:"update_interval"`
		CertFile       string `toml:"certfile"`
		KeyFile        string `toml:"keyfile"`
		StaticPath     string `toml:"static_dir"`

		// BackupHost         string `toml:"backup_host"`
		// BackupHostUser     string `toml:"backup_host_user"`
		// BackupHostPassword string `toml:"backup_host_password"`
		BackupHostKeyFile string `toml:"backup_host_public_key_file"`

		Database string `toml:"database"`

		Clusters map[string]struct {
			Host     string `toml:"host"`
			TLSName  string `toml:"tls_name"`
			Port     uint16 `toml:"port"`
			User     string `toml:"user"`
			Password string `toml:"password"`
			Alias    string `toml:"alias"`
		} `toml:"clusters"`

		Bind     string `toml:"bind"`
		LogLevel string `toml:"loglevel"`
		ErrorLog string `toml:"errorlog"`
		Chdir    string `toml:"chdir"`
		Timeout  int    `toml:"timeout"`
	}

	Mailer struct {
		TemplatePath string `toml:"template_path"`
		Host         string `toml:"host"`
		Port         uint16 `toml:"port"`
		User         string `toml:"user"`
		Password     string `toml:"password"`
		SendTo       string `toml:"send_to"`
	} `toml:"mailer"`

	BasicAuth struct {
		User     string `toml:"user"`
		Password string `toml:"password"`
	} `toml:"basic_auth"`
}

func InitConfig(configFile, configDir string, config *Config) {
	// to print everything out regarding reading the config in app init
	log.SetLevel(log.DebugLevel)

	log.Info("Reading config file...")
	blob, err := ioutil.ReadFile(configFile)
	if err != nil {
		log.Fatal(err)
	}

	if _, err := toml.Decode(string(blob), &config); err != nil {
		log.Fatal(err)
	}

	if config.AMC.Chdir != "" {
		if err := os.Chdir(config.AMC.Chdir); err != nil {
			log.Fatal("Error while trying to chdir to the specified directory in "+configFile+":", err)
		}
	}

	if AMCIsProd() {
		setLogFile(config.AMC.ErrorLog)
	}
	setLogLevel(config.AMC.LogLevel)
	openDB(config.AMC.Database)
}

func openDB(filepath string) {
	var schema = []string{`
		CREATE TABLE alerts (
			Id          integer,
			Type        integer,
			ClusterId   text,
			NodeAddress text,
			Desc        text,
			Created     datetime,
			LastOccured datetime,
			Resolved    datetime,
			Recurrence  integer,
			Status      text
		);`,
		`CREATE TABLE backups (
			Type      text,
			Id        text primary key,
			ClusterId text,
			Namespace          text,
			DestinationAddress text,
			Username           text,
			Password           text,
			DestinationPath    text,
			Sets               text,
			MetadataOnly       boolean,
			ProgressFile       text,
			TerminateOnClusterChange boolean,
			ScanPriority       integer,
			Created            datetime,
			Finished           datetime,
			Status             text,

			Progress integer,
			Error	 text
		);`,
	}

	log.Infof("Database path is: %s", filepath)

	var err error
	db, err = sql.Open("sqlite3", filepath)
	if err != nil {
		log.Fatalf("Error connecting to the database: %s", err.Error())
	}

	// exec the schema or fail; multi-statement Exec behavior varies between
	// database drivers;  pq will exec them all, sqlite3 won't, ymmv
	for _, ddl := range schema {
		// ignore error
		_, err := db.Exec(ddl)
		if err != nil && !AMCIsProd() {
			log.Warn(err)
		}
	}
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
