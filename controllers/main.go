package controllers

import (
	"bytes"
	"fmt"
	log1 "log"
	"net/http"
	"os"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/controllers/middleware/sessions"
	"github.com/citrusleaf/amc/models"
)

var (
	_observer            *models.ObserverT
	_defaultClientPolicy = as.NewClientPolicy()
)

func postSessionTerminate(c echo.Context) error {
	invalidateSession(c)
	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success"}`))
}

func getDebug(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success", "debugging": "OFF", "initiator": null}`))
}

func getAMCVersion(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(fmt.Sprintf(`{"amc_version": "%s", "amc_type": "%s"}`, common.AMCVersion, common.AMCEdition)))
}

func Server(config *common.Config) {
	_observer = models.New(config)

	// TODO: set to the same logger
	asl.Logger.SetLogger(log.StandardLogger())

	asl.Logger.SetLevel(asl.INFO)
	if !common.AMCIsProd() {
		asl.Logger.SetLevel(asl.DEBUG)
	}

	var buf bytes.Buffer
	logger := log1.New(&buf, "", log1.LstdFlags|log1.Lshortfile)
	logger.SetOutput(os.Stdout)
	asl.Logger.SetLogger(logger)
	asl.Logger.SetLevel(asl.DEBUG)

	_defaultClientPolicy.Timeout = 10 * time.Second
	_defaultClientPolicy.LimitConnectionsToQueueSize = true
	_defaultClientPolicy.ConnectionQueueSize = 1

	e := echo.New()

	store := sessions.NewCookieStore([]byte("amc-secret-key"))
	e.Use(sessions.Sessions(sessions.DefaultKey, store))

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

	// Routes
	e.POST("/session-terminate", postSessionTerminate)
	e.GET("/aerospike/service/debug", getDebug)
	e.GET("/get_amc_version", getAMCVersion)
	e.GET("/get_current_monitoring_clusters", getCurrentMonitoringClusters)

	e.GET("/aerospike/get_multicluster_view/:port", getMultiClusterView)

	e.POST("/set-update-interval/:clusterUuid", setClusterUpdateInterval)
	e.GET("/aerospike/service/clusters/:clusterUuid", getCluster)

	e.GET("/aerospike/service/clusters/:clusterUuid/udfs", getClusterUDFs)
	e.POST("/aerospike/service/clusters/:clusterUuid/drop_udf", postClusterDropUDF)
	e.POST("/aerospike/service/clusters/:clusterUuid/add_udf", postClusterAddUDF)

	e.POST("/aerospike/service/clusters/:clusterUuid/fire_cmd", postClusterFireCmd)
	e.GET("/aerospike/service/clusters/:clusterUuid/get_all_users", getClusterAllUsers)
	e.GET("/aerospike/service/clusters/:clusterUuid/get_all_roles", getClusterAllRoles)
	e.POST("/aerospike/service/clusters/:clusterUuid/add_user", postClusterAddUser)
	e.POST("/aerospike/service/clusters/:clusterUuid/user/:user/remove", postClusterDropUser)
	e.POST("/aerospike/service/clusters/:clusterUuid/user/:user/update", postClusterUpdateUser)
	e.POST("/aerospike/service/clusters/:clusterUuid/roles/:role/add_role", postClusterAddRole)
	e.POST("/aerospike/service/clusters/:clusterUuid/roles/:role/update", postClusterUpdateRole)
	e.POST("/aerospike/service/clusters/:clusterUuid/roles/:role/drop_role", postClusterDropRole)

	e.POST("/aerospike/service/clusters/:clusterUuid/initiate_backup", postInitiateBackup)
	e.GET("/aerospike/service/clusters/:clusterUuid/get_backup_progress", getBackupProgress)
	e.GET("/aerospike/service/clusters/:clusterUuid/get_successful_backups", getSuccessfulBackups)
	e.POST("/aerospike/service/clusters/:clusterUuid/get_available_backups", getAvailableBackups)

	e.POST("/aerospike/service/clusters/:clusterUuid/initiate_restore", postInitiateRestore)
	e.GET("/aerospike/service/clusters/:clusterUuid/get_restore_progress", getRestoreProgress)

	e.GET("/aerospike/service/clusters/:clusterUuid/throughput", getClusterThroughput)
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput_history", getClusterThroughputHistory)
	e.GET("/aerospike/service/clusters/:clusterUuid/latency/:nodes", getNodeLatency)
	e.GET("/aerospike/service/clusters/:clusterUuid/latency_history/:nodes", getNodeLatencyHistory)
	e.GET("/aerospike/service/clusters/:clusterUuid/basic", getClusterBasic)
	e.POST("/aerospike/service/clusters/:clusterUuid/change_password", postClusterChangePassword)
	e.GET("/aerospike/service/clusters/:clusterUuid/alerts", getClusterAlerts)
	e.POST("/aerospike/service/clusters/:clusterUuid/add_node", postAddClusterNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes", getClusterNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allconfig", getClusterNodeAllConfig)
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:nodes/setconfig", setClusterNodesConfig)
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:node/switch_xdr_off", postSwitchXDROff)
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:node/switch_xdr_on", postSwitchXDROn)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespaces", getClusterNamespaces)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:nodes", getClusterNamespaceNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/allconfig", getClusterNamespaceAllConfig)
	e.POST("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/setconfig", setClusterNamespaceConfig)
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:xdrPort/nodes/:nodes", getClusterXdrNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:xdrPort/nodes/:nodes/allconfig", getClusterXdrNodesAllConfig)
	e.POST("/aerospike/service/clusters/:clusterUuid/xdr/:xdrPort/nodes/:nodes/setconfig", setClusterXdrNodesConfig)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allstats", getClusterNodeAllStats)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/allstats", getClusterNamespaceNodeAllStats)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes/:sindex/nodes/:node/allstats", getClusterNamespaceSindexNodeAllStats)
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:port/nodes/:node/allstats", getClusterXdrNodeAllStats)

	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes", getClusterNamespaceSindexes)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sets", getClusterNamespaceSets)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/storage", getClusterNamespaceStorage)
	e.GET("/aerospike/service/clusters/:clusterUuid/jobs/nodes/:node", getClusterJobsNode)

	e.POST("/aerospike/service/clusters/get-cluster-id", postGetClusterId)
	e.GET("/aerospike/service/clusters/:clusterUuid/get-current-user", getClusterCurrentUser)
	e.GET("/aerospike/service/clusters/:clusterUuid/get_user_roles", getClusterUserRoles)

	log.Infof("Starting AMC server, version: %s %s", common.AMCVersion, common.AMCEdition)
	// Start server
	if config.AMC.CertFile != "" {
		log.Infof("In HTTPS (secure) Mode")
		e.StartTLS(config.AMC.Bind, config.AMC.CertFile, config.AMC.KeyFile)
	} else {
		log.Infof("In HTTP (unsecure) Mode.")
		e.Start(config.AMC.Bind)
	}
}
