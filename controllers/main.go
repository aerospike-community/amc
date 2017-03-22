package controllers

import (
	"fmt"
	"net/http"
	"os"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/controllers/middleware/sessions"
	"github.com/citrusleaf/amc/models"
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

func ShutdownServer() {
	_server.Shutdown(_server.ShutdownTimeout)
}

func Server(config *common.Config) {
	_observer = models.New(config)

	_defaultClientPolicy.Timeout = time.Duration(config.AMC.Timeout) * time.Second
	if _defaultClientPolicy.Timeout <= 0 {
		_defaultClientPolicy.Timeout = 30 * time.Second
	}
	_defaultClientPolicy.LimitConnectionsToQueueSize = true
	_defaultClientPolicy.ConnectionQueueSize = 1

	e := echo.New()
	// Avoid stale connections
	e.ReadTimeout = 30 * time.Second
	e.WriteTimeout = 30 * time.Second

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
		e.Use(middleware.BasicAuth(func(username, password string, c echo.Context) bool {
			if username == basicAuthUser && password == basicAuthPassword {
				return true
			}
			return false
		}))
	}

	e.Use(middleware.GzipWithConfig(middleware.DefaultGzipConfig))
	// e.Use(middleware.CSRFWithConfig(middleware.DefaultCSRFConfig))
	e.Use(middleware.SecureWithConfig(middleware.DefaultSecureConfig))

	// Routes
	e.POST("/session-terminate", postSessionTerminate)

	e.GET("/aerospike/service/debug", getDebug)
	e.POST("/aerospike/service/clusters/:clusterUuid/debug", postDebug) // cluster does not matter here

	e.GET("/get_amc_version", getAMCVersion)
	e.GET("/get_current_monitoring_clusters", sessionValidator(getCurrentMonitoringClusters))

	e.POST("/set-update-interval/:clusterUuid", sessionValidator(setClusterUpdateInterval))
	e.GET("/aerospike/service/clusters/:clusterUuid", sessionValidator(getCluster))
	e.POST("/aerospike/service/clusters/:clusterUuid/logout", postRemoveClusterFromSession)

	e.GET("/aerospike/service/clusters/:clusterUuid/udfs", sessionValidator(getClusterUDFs))
	e.POST("/aerospike/service/clusters/:clusterUuid/drop_udf", sessionValidator(postClusterDropUDF))
	e.POST("/aerospike/service/clusters/:clusterUuid/add_udf", sessionValidator(postClusterAddUDF))

	e.GET("/aerospike/service/clusters/:clusterUuid/throughput", sessionValidator(getClusterThroughput))
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput_history", sessionValidator(getClusterThroughputHistory))
	e.GET("/aerospike/service/clusters/:clusterUuid/basic", sessionValidator(getClusterBasic))
	e.POST("/aerospike/service/clusters/:clusterUuid/add_node", sessionValidator(postAddClusterNodes))
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes", sessionValidator(getClusterNodes))
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allconfig", sessionValidator(getClusterNodeAllConfig))
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:nodes/setconfig", sessionValidator(setClusterNodesConfig))
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:node/switch_off", sessionValidator(postSwitchNodeOff))
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespaces", sessionValidator(getClusterNamespaces))
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:nodes", sessionValidator(getClusterNamespaceNodes))
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/allconfig", sessionValidator(getClusterNamespaceAllConfig))
	e.POST("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/setconfig", sessionValidator(setClusterNamespaceConfig))

	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allstats", sessionValidator(getClusterNodeAllStats))
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/allstats", sessionValidator(getClusterNamespaceNodeAllStats))
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:port/nodes/:node/allstats", sessionValidator(getClusterXdrNodeAllStats))

	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes/:sindex/nodes/:node/allstats", sessionValidator(getClusterNamespaceSindexNodeAllStats))
	e.POST("/aerospike/service/clusters/:clusterUuid/namespace/:namespace/add_index", sessionValidator(postClusterAddIndex))
	e.POST("/aerospike/service/clusters/:clusterUuid/namespace/:namespace/drop_index", sessionValidator(postClusterDropIndex))

	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes", sessionValidator(getClusterNamespaceSindexes))
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sets", sessionValidator(getClusterNamespaceSets))
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/storage", sessionValidator(getClusterNamespaceStorage))
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes/jobs", getClusterNodesJobs)
	e.GET("/aerospike/service/clusters/:clusterUuid/jobs/nodes/:node", getClusterJobsNode)

	e.POST("/aerospike/service/clusters/get-cluster-id", postGetClusterId)

	if registerEnterpriseAPI != nil {
		registerEnterpriseAPI(e)
	}

	log.Infof("Starting AMC server, version: %s %s", common.AMCVersion, common.AMCEdition)
	_server = e
	// Start server
	if config.AMC.CertFile != "" {
		log.Infof("In HTTPS (secure) Mode")
		// redirect all http requests to https
		e.Pre(middleware.HTTPSRedirect())
		e.StartTLS(config.AMC.Bind, config.AMC.CertFile, config.AMC.KeyFile)
	} else {
		log.Infof("In HTTP (insecure) Mode.")
		e.Start(config.AMC.Bind)
	}
}
