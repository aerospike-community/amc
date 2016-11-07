package controllers

import (
	"net/http"

	"github.com/labstack/echo"
	"github.com/labstack/echo/engine/standard"
	"github.com/labstack/echo/middleware"
)

var amcVersion string
var amcBuild string

func getDebug(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success", "debugging": "OFF", "initiator": null}`))
}

func getAMCVersion(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(`{"amc_version": "3.6.13", "amc_type": "enterprise"}`))
}

func Server() {
	e := echo.New()

	e.Static("/", "static")
	e.Static("/static", "static")

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())

	// Routes
	e.GET("/aerospike/service/debug", getDebug)
	e.GET("/get_amc_version", getAMCVersion)
	e.GET("/get_current_monitoring_clusters", getCurrentMonitoringClusters)
	e.GET("/aerospike/get_multicluster_view/:port", getMultiClusterView)
	e.GET("/aerospike/service/clusters/:clusterUuid", getCluster)
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput", getClusterThroughput)
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput_history", getClusterThroughputHistory)
	e.GET("/aerospike/service/clusters/:clusterUuid/basic", getClusterBasic)
	e.GET("/aerospike/service/clusters/:clusterUuid/alerts", getClusterAlrets)
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes", getClusterNodes)
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespaces", getClusterNamespaces)
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:xdrPort/nodes/:nodes", getClusterXdrNodes)
	e.POST("/aerospike/service/clusters/get-cluster-id", postGetClusterId)

	// Start server
	e.Run(standard.New(":8090"))
}
