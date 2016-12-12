package controllers

import (
	"fmt"
	"net/http"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/observer"
)

var (
	_observer            = observer.New()
	_defaultClientPolicy = as.NewClientPolicy()
)

func postSessionTerminate(c echo.Context) error {
	cookie := new(http.Cookie)
	cookie.Name = "session"
	cookie.Value = ""
	cookie.Expires = time.Now().Add(-time.Hour * 24 * 365)
	c.SetCookie(cookie)

	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success"}`))
}

func getDebug(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success", "debugging": "OFF", "initiator": null}`))
}

func getAMCVersion(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(fmt.Sprintf(`{"amc_version": "%s", "amc_type": "%s"}`, common.AMCVersion, common.AMCEdition)))
}

func Server(config *common.Config) {
	// TODO: set to the same logger
	asl.Logger.SetLogger(log.StandardLogger())

	asl.Logger.SetLevel(asl.INFO)
	if !common.AMCIsProd() {
		asl.Logger.SetLevel(asl.DEBUG)
	}

	_defaultClientPolicy.Timeout = 5 * time.Second
	_defaultClientPolicy.LimitConnectionsToQueueSize = true
	_defaultClientPolicy.ConnectionQueueSize = 2

	e := echo.New()
	// e.Logger().SetOutput(log.StandardLogger().Writer())

	if config.AMC.StaticPath == "" {
		log.Fatalln("No static dir has been set in the config file. Quiting...")
	}
	log.Infoln("Static files path is being set to:" + config.AMC.StaticPath)
	e.Static("/", config.AMC.StaticPath)
	e.Static("/static", config.AMC.StaticPath)

	// // Middleware
	if !common.AMCIsProd() {
		e.Use(middleware.Logger())
	}

	e.Use(middleware.Recover())

	// Routes
	e.POST("/session-terminate", postSessionTerminate)
	e.GET("/aerospike/service/debug", getDebug)
	e.GET("/get_amc_version", getAMCVersion)
	e.GET("/get_current_monitoring_clusters", getCurrentMonitoringClusters)

	e.GET("/aerospike/get_multicluster_view/:port", getMultiClusterView)

	e.GET("/aerospike/service/clusters/:clusterUuid", getCluster)
	e.GET("/aerospike/service/clusters/:clusterUuid/fire_cmd", postClusterFireCmd)
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput", getClusterThroughput)
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput_history", getClusterThroughputHistory)
	e.GET("/aerospike/service/clusters/:clusterUuid/latency/:nodes", getNodeLatency)
	e.GET("/aerospike/service/clusters/:clusterUuid/latency_history/:nodes", getNodeLatencyHistory)
	e.GET("/aerospike/service/clusters/:clusterUuid/basic", getClusterBasic)
	e.GET("/aerospike/service/clusters/:clusterUuid/alerts", getClusterAlrets)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes", getClusterNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allconfig", getClusterNodeAllConfig)
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:nodes/setconfig", setClusterNodesConfig)
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:node/switch_xdr_off", postSwitchXDROff)
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:node/switch_xdr_on", postSwitchXDROn)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespaces", getClusterNamespaces)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:nodes", getClusterNamespaceNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/allconfig", getClusterNamespaceAllConfig)
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:xdrPort/nodes/:nodes", getClusterXdrNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allstats", getClusterNodeAllStats)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/allstats", getClusterNamespaceNodeAllStats)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes/:sindex/nodes/:node/allstats", getClusterNamespaceSindexNodeAllStats)
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:port/nodes/:node/allstats", getClusterXdrNodeAllStats)

	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes", getClusterNamespaceSindexes)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sets", getClusterNamespaceSets)
	e.GET("/aerospike/service/clusters/:clusterUuid/jobs/nodes/:node", getClusterJobsNode)

	e.POST("/aerospike/service/clusters/get-cluster-id", postGetClusterId)
	e.GET("/aerospike/service/clusters/:clusterUuid/get_user_roles", getClusterUserRoles)

	log.Infof("Starting AMC server, version: %s %s", common.AMCVersion, common.AMCEdition)

	// Start server
	e.Start(config.AMC.Bind)
}
