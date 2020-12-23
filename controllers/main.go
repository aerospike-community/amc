package controllers

import (
	"context"
	"crypto/tls"
	"fmt"
	"net/http"
	"os"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	log "github.com/sirupsen/logrus"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"

	"github.com/aerospike-community/amc/common"
	"github.com/aerospike-community/amc/controllers/middleware/sessions"
	"github.com/aerospike-community/amc/models"
)

var (
	_observer            *models.ObserverT
	_defaultClientPolicy = as.NewClientPolicy()

	registerEnterpriseAPI func(*echo.Echo)

	_server *echo.Echo
)

func postSessionTerminate(c echo.Context) error {
	invalidateSession(c)
	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success"}`))
}

func getDebug(c echo.Context) error {
	res := _observer.DebugStatus()
	if res.On {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":            "success",
			"debugging":         "ON",
			"initiator":         res.Initiator,
			"isOriginInitiator": res.Initiator == c.Request().RemoteAddr,
			"start_time":        res.StartTime.UnixNano() / 1e6, //1484923724160,
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":    "success",
		"debugging": "OFF",
		"initiator": nil,
	})
}

func postDebug(c echo.Context) error {
	form := struct {
		Service      string `form:"service"`
		DurationMins int    `form:"duration"`
		Username     string `form:"username"`
	}{}

	c.Bind(&form)

	var res models.DebugStatus
	switch form.Service {
	case "start":
		res = _observer.StartDebug(c.Request().RemoteAddr, time.Duration(form.DurationMins)*time.Minute)
	case "restart":
		res = _observer.StartDebug(c.Request().RemoteAddr, time.Duration(form.DurationMins)*time.Minute)
	case "stop":
		res = _observer.StopDebug()
	default:
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if res.On {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":     "success",
			"debugging":  "ON",
			"initiator":  res.Initiator,
			"start_time": res.StartTime.UnixNano() / 1e6, //1484923724160,
			"service":    form.Service,
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":    "success",
		"debugging": "OFF",
		"initiator": nil,
		"service":   form.Service,
	})
}

func getAMCVersion(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(fmt.Sprintf(`{"amc_version": "%s", "amc_type": "%s"}`, common.AMCVersion, common.AMCEdition)))
}

// ShutdownServer - shutdown server
func ShutdownServer() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := _server.Shutdown(ctx); err != nil {
		log.Fatal(err)
	}
}

// Server - init server using config
func Server(config *common.Config) {
	_observer = models.New(config)

	_defaultClientPolicy.Timeout = time.Duration(config.AMC.Timeout) * time.Second
	if _defaultClientPolicy.Timeout <= 0 {
		_defaultClientPolicy.Timeout = 30 * time.Second
	}
	_defaultClientPolicy.LimitConnectionsToQueueSize = true
	_defaultClientPolicy.ConnectionQueueSize = 1

	e := echo.New()
	e.Use(middleware.SecureWithConfig(middleware.SecureConfig{
		XSSProtection:         "1; mode=block",
		ContentTypeNosniff:    "nosniff",
		XFrameOptions:         "SAMEORIGIN",
		HSTSMaxAge:            3600,
		HSTSExcludeSubdomains: false,
		// ContentSecurityPolicy: "default-src 'self';script-src 'self' 'unsafe-eval'; object-src 'self'", // does not work with underscore.js
	}))

	// Avoid stale connections
	e.Server.ReadTimeout = 30 * time.Second
	e.Server.WriteTimeout = 30 * time.Second

	store := sessions.NewCookieStore([]byte("amc-secret-key"))
	e.Use(sessions.Sessions("amc_session", store))

	if config.AMC.StaticPath == "" {
		log.Fatalln("No static dir has been set in the config file. Quiting...")
	}
	log.Infoln("Static files path is being set to:" + config.AMC.StaticPath)
	e.Static("/", config.AMC.StaticPath)
	e.Static("/static", config.AMC.StaticPath)

	// Middleware
	if !common.AMCIsProd() {
		// e.Logger.SetOutput(log.StandardLogger().Writer())
		// e.Use(middleware.Logger())
	} else {
		e.Use(middleware.Recover())
	}

	// Basic Authentication Middleware Setup
	basicAuthUser := os.Getenv("AMC_AUTH_USER")
	if basicAuthUser == "" {
		basicAuthUser = config.BasicAuth.User
	}

	basicAuthPassword := os.Getenv("AMC_AUTH_PASSWORD")
	if basicAuthPassword == "" {
		basicAuthPassword = config.BasicAuth.Password
	}

	if basicAuthUser != "" {
		e.Use(middleware.BasicAuth(func(username, password string, c echo.Context) (bool, error) {
			if username == basicAuthUser && password == basicAuthPassword {
				return true, nil
			}
			return false, nil
		}))
	}

	e.Use(middleware.GzipWithConfig(middleware.DefaultGzipConfig))
	// e.Use(middleware.CSRFWithConfig(middleware.DefaultCSRFConfig))
	e.Use(middleware.SecureWithConfig(middleware.DefaultSecureConfig))

	// Routes
	e.POST("/session-terminate", postSessionTerminate)

	e.GET("/aerospike/service/debug", getDebug)
	e.POST("/aerospike/service/clusters/:clusterUUID/debug", postDebug) // cluster does not matter here

	e.GET("/get_amc_version", getAMCVersion)
	e.GET("/get_current_monitoring_clusters", getCurrentMonitoringClusters)

	e.POST("/set-update-interval/:clusterUUID", sessionValidator(setClusterUpdateInterval))
	e.GET("/aerospike/service/clusters/:clusterUUID", sessionValidator(getCluster))
	e.POST("/aerospike/service/clusters/:clusterUUID/logout", postRemoveClusterFromSession)

	e.GET("/aerospike/service/clusters/:clusterUUID/udfs", sessionValidator(getClusterUDFs))
	e.POST("/aerospike/service/clusters/:clusterUUID/drop_udf", sessionValidator(postClusterDropUDF))
	e.POST("/aerospike/service/clusters/:clusterUUID/add_udf", sessionValidator(postClusterAddUDF))

	e.GET("/aerospike/service/clusters/:clusterUUID/throughput", sessionValidator(getClusterThroughput))
	e.GET("/aerospike/service/clusters/:clusterUUID/throughput_history", sessionValidator(getClusterThroughputHistory))
	e.GET("/aerospike/service/clusters/:clusterUUID/basic", sessionValidator(getClusterBasic))
	e.POST("/aerospike/service/clusters/:clusterUUID/add_node", sessionValidator(postAddClusterNodes))
	e.GET("/aerospike/service/clusters/:clusterUUID/nodes/:nodes", sessionValidator(getClusterNodes))
	e.GET("/aerospike/service/clusters/:clusterUUID/nodes/:node/allconfig", sessionValidator(getClusterNodeAllConfig))
	e.POST("/aerospike/service/clusters/:clusterUUID/nodes/:nodes/setconfig", sessionValidator(setClusterNodesConfig))
	e.POST("/aerospike/service/clusters/:clusterUUID/nodes/:node/switch_off", sessionValidator(postSwitchNodeOff))
	e.GET("/aerospike/service/clusters/:clusterUUID/namespaces/:namespaces", sessionValidator(getClusterNamespaces))
	e.GET("/aerospike/service/clusters/:clusterUUID/namespaces/:namespace/nodes/:nodes", sessionValidator(getClusterNamespaceNodes))
	e.GET("/aerospike/service/clusters/:clusterUUID/namespaces/:namespace/nodes/:node/allconfig", sessionValidator(getClusterNamespaceAllConfig))
	e.POST("/aerospike/service/clusters/:clusterUUID/namespaces/:namespace/nodes/:node/setconfig", sessionValidator(setClusterNamespaceConfig))

	e.GET("/aerospike/service/clusters/:clusterUUID/nodes/:node/allstats", sessionValidator(getClusterNodeAllStats))
	e.GET("/aerospike/service/clusters/:clusterUUID/namespaces/:namespace/nodes/:node/allstats", sessionValidator(getClusterNamespaceNodeAllStats))
	e.GET("/aerospike/service/clusters/:clusterUUID/xdr/:port/nodes/:node/allstats", sessionValidator(getClusterXdrNodeAllStats))

	e.GET("/aerospike/service/clusters/:clusterUUID/namespaces/:namespace/sindexes/:sindex/nodes/:node/allstats", sessionValidator(getClusterNamespaceSindexNodeAllStats))
	e.POST("/aerospike/service/clusters/:clusterUUID/namespace/:namespace/add_index", sessionValidator(postClusterAddIndex))
	e.POST("/aerospike/service/clusters/:clusterUUID/namespace/:namespace/drop_index", sessionValidator(postClusterDropIndex))

	e.GET("/aerospike/service/clusters/:clusterUUID/namespaces/:namespace/sindexes", sessionValidator(getClusterNamespaceSindexes))
	e.GET("/aerospike/service/clusters/:clusterUUID/namespaces/:namespace/sets", sessionValidator(getClusterNamespaceSets))
	e.GET("/aerospike/service/clusters/:clusterUUID/namespaces/:namespace/storage", sessionValidator(getClusterNamespaceStorage))
	e.GET("/aerospike/service/clusters/:clusterUUID/nodes/:nodes/jobs", getClusterNodesJobs)
	e.GET("/aerospike/service/clusters/:clusterUUID/jobs/nodes/:node", getClusterJobsNode)

	e.POST("/aerospike/service/clusters/get-cluster-id", postGetClusterID)

	if registerEnterpriseAPI != nil {
		registerEnterpriseAPI(e)
	}

	log.Infof("Starting AMC server, version: %s %s", common.AMCVersion, common.AMCEdition)
	_server = e
	// Start server
	if config.AMC.CertFile != "" {
		log.Infof("In HTTPS (secure) Mode")

		tlsConfig := new(tls.Config)
		tlsConfig.Certificates = make([]tls.Certificate, 1)
		var err error
		tlsConfig.Certificates[0], err = tls.LoadX509KeyPair(config.AMC.CertFile, config.AMC.KeyFile)
		if err != nil {
			log.Fatalln("Error reading the certificate files from disk: " + err.Error())
		}

		if config.AMC.ForceTLS12 || config.AMC.MaxTLSSecurity {
			log.Infof("Forcing TLS v1.2")
			tlsConfig.MinVersion = tls.VersionTLS12
		}

		if config.AMC.MaxTLSSecurity {
			log.Infof("Forcing Maximum security mode for TLS (Uses >=256 bit curves, ciphersuites and prefers server cypher suites)")
			tlsConfig.CurvePreferences = []tls.CurveID{tls.CurveP521, tls.CurveP384, tls.CurveP256}
			tlsConfig.PreferServerCipherSuites = true
			tlsConfig.CipherSuites = []uint16{
				tls.TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384,
				tls.TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA,
				tls.TLS_RSA_WITH_AES_256_GCM_SHA384,
				tls.TLS_RSA_WITH_AES_256_CBC_SHA,
			}
		}

		e.TLSServer.TLSNextProto = make(map[string]func(*http.Server, *tls.Conn, http.Handler), 0)
		e.TLSServer.TLSConfig = tlsConfig
		e.TLSServer.Addr = config.AMC.Bind
		// redirect all http requests to https
		e.Pre(middleware.HTTPSRedirect())

		// starts a listener for normal http port to support http -> https redirect
		log.Errorln(e.StartServer(e.TLSServer))
	} else {
		log.Infof("In HTTP (insecure) Mode.")
		log.Errorln(e.Start(config.AMC.Bind))
	}
}
