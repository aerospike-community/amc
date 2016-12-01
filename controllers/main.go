package controllers

import (
	"fmt"
	"net/http"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/labstack/echo/middleware"

	"github.com/aerospike/aerospike-console/common"
	"github.com/aerospike/aerospike-console/observer"
)

var (
	_observer            = observer.New()
	_defaultClientPolicy = as.NewClientPolicy()

	amcVersion string
	amcBuild   string
	amcEdition string
)

func postSessionTerminate(c echo.Context) error {
	cookie := new(echo.Cookie)
	cookie.SetName("session")
	cookie.SetValue("")
	cookie.SetExpires(time.Now().Add(-time.Hour * 24 * 365))
	c.SetCookie(cookie)

	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success"}`))
}

func getDebug(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success", "debugging": "OFF", "initiator": null}`))
}

func getAMCVersion(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(fmt.Sprintf(`{"amc_version": "%s", "amc_type": "%s"}`, amcVersion, amcEdition)))
}

func Server(edition, version, build string, config *common.Config) {
	// TODO: set to the same logger
	asl.Logger.SetLogger(log.StandardLogger())
	asl.Logger.SetLevel(asl.DEBUG)

	amcVersion = version
	amcBuild = build
	amcEdition = edition

	_defaultClientPolicy.Timeout = 5 * time.Second
	_defaultClientPolicy.LimitConnectionsToQueueSize = true
	_defaultClientPolicy.ConnectionQueueSize = 2

	e := echo.New()

	// e.Static("/", "/opt/amc/static")
	// e.Static("/static", "/opt/amc/static")
	e.Static("/", "static")
	e.Static("/static", "static")

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Routes
	e.POST("/session-terminate", postSessionTerminate)
	e.GET("/aerospike/service/debug", getDebug)
	e.GET("/get_amc_version", getAMCVersion)
	e.GET("/get_current_monitoring_clusters", getCurrentMonitoringClusters)
	e.GET("/aerospike/get_multicluster_view/:port", getMultiClusterView)
	e.GET("/aerospike/service/clusters/:clusterUuid", getCluster)
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput", getClusterThroughput)
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput_history", getClusterThroughputHistory)
	e.GET("/aerospike/service/clusters/:clusterUuid/latency/:nodes", getNodeLatency)
	e.GET("/aerospike/service/clusters/:clusterUuid/latency_history/:nodes", getNodeLatencyHistory)
	e.GET("/aerospike/service/clusters/:clusterUuid/basic", getClusterBasic)
	e.GET("/aerospike/service/clusters/:clusterUuid/alerts", getClusterAlrets)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes", getClusterNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allconfig", getClusterNodeAllConfig)
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:nodes/setconfig", setClusterNodesConfig)
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

	log.Debugf("Starting AMC server, version: %s %s", amcVersion, amcEdition)

	// Start server
	e.Run(standard.New(config.AMC.Bind))
}
