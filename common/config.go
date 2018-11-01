package common

import (
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"io/ioutil"
	"os"
	"strings"
	"sync"

	"github.com/BurntSushi/toml"
	log "github.com/Sirupsen/logrus"
	aslog "github.com/aerospike/aerospike-client-go/logger"

	_ "github.com/cznic/ql/driver"
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
		UpdateInterval           int    `toml:"update_interval"`
		InactiveDurBeforeRemoval int    `toml:"cluster_inactive_before_removal"`
		CertFile                 string `toml:"certfile"`
		KeyFile                  string `toml:"keyfile"`
		ForceTLS12               bool   `toml:"force_tls12"`
		MaxTLSSecurity           bool   `toml:"max_tls_security"`
		StaticPath               string `toml:"static_dir"`

		// BackupHost         string `toml:"backup_host"`
		// BackupHostUser     string `toml:"backup_host_user"`
		// BackupHostPassword string `toml:"backup_host_password"`
		BackupHostKeyFile string `toml:"backup_host_public_key_file"`

		Database string `toml:"database"`

		Clusters map[string]struct {
			Host                 string `toml:"host"`
			TLSName              string `toml:"tls_name"`
			Port                 uint16 `toml:"port"`
			User                 string `toml:"user"`
			Password             string `toml:"password"`
			Alias                string `toml:"alias"`
			UseServicesAlternate bool   `toml:"use_services_alternate"`
			ShowInUI             bool   `toml:"show_in_ui"`
		} `toml:"clusters"`

		Bind     string `toml:"bind"`
		LogLevel string `toml:"loglevel"`
		ErrorLog string `toml:"errorlog"`
		Chdir    string `toml:"chdir"`
		Timeout  int    `toml:"timeout"`
		PIDFile  string `toml:"pidfile"`
	}

	Mailer struct {
		mutex sync.RWMutex

		TemplatePath      string   `toml:"template_path"`
		Host              string   `toml:"host"`
		Port              uint16   `toml:"port"`
		User              string   `toml:"user"`
		Password          string   `toml:"password"`
		FromAddress       string   `toml:"from_address"`
		SendTo            []string `toml:"send_to"`
		AcceptInvalidCert bool     `toml:"accept_invalid_cert"`
	} `toml:"mailer"`

	BasicAuth struct {
		User     string `toml:"user"`
		Password string `toml:"password"`
	} `toml:"basic_auth"`

	TLS struct {
		ServerPool []string `toml:"server_cert_pool"`
		ClientPool map[string]struct {
			CertFile string `toml:"cert_file"`
			KeyFile  string `toml:"key_file"`
		} `toml:"client_certs"`
	} `toml:"tls"`

	serverPool *x509.CertPool
	clientPool []tls.Certificate

	LogFile *os.File
}

func (c *Config) AppendAlertEmails(emails []string) error {
	c.Mailer.mutex.Lock()
	defer c.Mailer.mutex.Unlock()

	for i, e := range c.Mailer.SendTo {
		c.Mailer.SendTo[i] = strings.Trim(strings.ToLower(e), "\t ")
	}

	c.Mailer.SendTo = append(c.Mailer.SendTo, emails...)
	c.Mailer.SendTo = StrUniq(c.Mailer.SendTo)

	return nil
}

func (c *Config) DeleteAlertEmails(emails []string) error {
	c.Mailer.mutex.Lock()
	defer c.Mailer.mutex.Unlock()

	for i, e := range c.Mailer.SendTo {
		c.Mailer.SendTo[i] = strings.Trim(strings.ToLower(e), "\t ")
	}

	remEmails := map[string]struct{}{}
	for _, e := range emails {
		remEmails[strings.Trim(strings.ToLower(e), "\t ")] = struct{}{}
	}

	newEmails := make([]string, 0, len(c.Mailer.SendTo))
	for _, e := range c.Mailer.SendTo {
		if _, exists := remEmails[e]; !exists {
			newEmails = append(newEmails, e)
		}
	}

	c.Mailer.SendTo = StrUniq(newEmails)

	return nil
}

func (c *Config) AlertEmails() []string {
	c.Mailer.mutex.RLock()
	defer c.Mailer.mutex.RUnlock()

	res := make([]string, len(c.Mailer.SendTo))
	copy(res, c.Mailer.SendTo)

	return res
}

func (c *Config) FromAddress() string {
	c.Mailer.mutex.RLock()
	defer c.Mailer.mutex.RUnlock()

	fromUser := c.Mailer.FromAddress
	if len(fromUser) == 0 {
		fromUser = c.Mailer.User
	}
	if !strings.Contains(fromUser, "@") {
		fromUser += "@local"
	}

	return fromUser
}

func (c *Config) ServerPool() *x509.CertPool {
	return c.serverPool
}

func (c *Config) ClientPool() []tls.Certificate {
	return c.clientPool
}

func (c *Config) LogLevel() log.Level {
	switch strings.ToLower(c.AMC.LogLevel) {
	case "debug":
		return log.DebugLevel
	case "warn", "warning":
		return log.WarnLevel
	case "err", "error":
		return log.ErrorLevel
	case "info":
		return log.InfoLevel
	default:
		return log.InfoLevel
	}
}

func (c *Config) AeroLogLevel() aslog.LogPriority {
	switch strings.ToLower(c.AMC.LogLevel) {
	case "debug":
		return aslog.DEBUG
	case "warn", "warning":
		return aslog.WARNING
	case "err", "error":
		return aslog.ERR
	case "info":
		return aslog.INFO
	default:
		return aslog.INFO
	}
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
		config.LogFile = setLogFile(config.AMC.ErrorLog)
	}

	// Try to load system CA certs, otherwise just make an empty pool
	serverPool, err := x509.SystemCertPool()
	if err != nil {
		log.Errorf("FAILED: Adding system certificates to the pool failed: %s", err)
		serverPool = x509.NewCertPool()
	}

	// Try to load system CA certs and add them to the system cert pool
	for _, caFile := range config.TLS.ServerPool {
		caCert, err := ioutil.ReadFile(caFile)
		if err != nil {
			log.Errorf("FAILED: Adding server certificate %s to the pool failed: %s", caFile, err)
			continue
		}

		log.Debugf("Adding server certificate %s to the pool...", caFile)
		serverPool.AppendCertsFromPEM(caCert)
	}

	config.serverPool = serverPool

	// Try to load system CA certs and add them to the system cert pool
	for _, cFiles := range config.TLS.ClientPool {
		cert, err := tls.LoadX509KeyPair(cFiles.CertFile, cFiles.KeyFile)
		if err != nil {
			log.Errorf("FAILED: Adding client certificate %s to the pool failed: %s", cFiles.CertFile, err)
			continue
		}

		log.Debugf("Adding client certificate %s to the pool...", cFiles.CertFile)
		config.clientPool = append(config.clientPool, cert)
	}

	aslog.Logger.SetLogger(log.StandardLogger())

	setLogLevel(config.AMC.LogLevel)
}

func SetupDatabase(filepath string) {
	var schema = []string{`
		CREATE TABLE IF NOT EXISTS alerts (
			Id          int64,
			Type        int64,
			ClusterId   string,
			NodeAddress string,
			Namespace   string,
			Description string,
			Created     time,
			LastOccured time,
			Resolved    time,
			Recurrence  int64,
			Status      string
		);`,
		`CREATE INDEX IF NOT EXISTS idxAlertsNodeAddress ON alerts (NodeAddress);`,
		`CREATE TABLE IF NOT EXISTS backups (
			Type      string,
			Id        string,
			ClusterId string,
			Namespace          string,
			DestinationAddress string,
			Username           string,
			Password           string,
			DestinationPath    string,
			Sets               string,
			MetadataOnly       bool,
			ProgressFile       string,
			TerminateOnClusterChange bool,
			ScanPriority       int64,
			Created            time,
			Finished           time,
			Status             string,

			Progress int64,
			Error	 string
		);`,
		`CREATE INDEX IF NOT EXISTS idxBackupsId ON backups (Id);`,
		`CREATE TABLE IF NOT EXISTS migrations (
			Version      int64
		);
		BEGIN TRANSACTION;
			ALTER TABLE backups ADD ModifiedBefore string;
			ALTER TABLE backups ADD ModifiedAfter string;
		COMMIT;`,
	}

	log.Infof("Database path is: %s", filepath)

	var err error
	db, err = sql.Open("ql", filepath)
	if err != nil {
		log.Fatalf("Error connecting to the database: %s", err.Error())
	}

	// exec the schema or fail; multi-statement Exec behavior varies between
	for _, ddl := range schema {
		// ignore error

		tx, err := db.Begin()
		if err != nil {
			log.Fatal(err)
		}

		_, err = tx.Exec(ddl)
		if err != nil {
			log.Warn(err)
		}

		if err = tx.Commit(); err != nil {
			log.Fatal(err)
		}
	}
}

func setLogFile(filepath string) *os.File {
	out, err := os.OpenFile(filepath, os.O_RDWR|os.O_CREATE|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("error opening file: %v", err)
	}
	log.SetOutput(out)

	return out
}

func setLogLevel(level string) {
	level = strings.ToLower(level)
	log.SetLevel(log.InfoLevel)
	aslog.Logger.SetLevel(aslog.INFO)

	switch level {
	case "info":
		log.SetLevel(log.InfoLevel)
		aslog.Logger.SetLevel(aslog.INFO)
	case "warning", "warn":
		log.SetLevel(log.WarnLevel)
		aslog.Logger.SetLevel(aslog.WARNING)
	case "error", "err":
		log.SetLevel(log.ErrorLevel)
		aslog.Logger.SetLevel(aslog.ERR)
	case "debug":
		log.SetLevel(log.DebugLevel)
		aslog.Logger.SetLevel(aslog.DEBUG)
	}
}
