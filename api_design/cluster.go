package design

import (
	. "github.com/goadesign/goa/design" // Use . imports to enable the DSL
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("cluster", func() { // Resources group related API endpoints
	BasePath("clusters")              // together. They map to REST resources for REST
	Description("Cluster Endpoints") // and exactly one API definition appearing in

	Security(JWT, func() { // Use JWT to auth requests to this endpoint
		Scope("api:cluster") // Enforce presence of "api" scope in JWT claims.
	})

	Action("checkin", func() { // Actions define a single API endpoint together
		Description("Announce checkin to a station") // with its path, parameters (both path
		Routing(PUT(":state"))                       // parameters and querystring values) and payload
		Params(func() {                              // (shape of the request body).
		})

		Headers(func() {
			Header("X-Lat", Number, "Latitude")
			Header("X-Long", Number, "Longitude")

			Required("X-Lat", "X-Long")
		})

		Response(OK, DriverStateResponseMedia)   // Responses define the shape and status code
		Response(Gone, DriverStateResponseMedia) // Responses define the shape and status code
		Response(Unauthorized)                   // authentication error
		Response(Forbidden)                      // Not Allowed in the network
		Response(InternalServerError)            // of HTTP responses.
		Response(NoContent)                      // of HTTP responses.
		Response(NotAcceptable)                  // of HTTP responses.
	})

	Action("checkout", func() { // Actions define a single API endpoint together
		Description("Request checkout from a station") // with its path, parameters (both path
		Routing(DELETE(":state"))                      // parameters and querystring values) and payload
		Params(func() {                                // (shape of the request body).
			Param("state", String, "State Signature")
		})

		Headers(func() {
			Header("X-Lat", Number, "Latitude")
			Header("X-Long", Number, "Longitude")
		})

		Response(OK, DriverStateResponseMedia)   // Responses define the shape and status code
		Response(Gone, DriverStateResponseMedia) // Responses define the shape and status code
		Response(Unauthorized)                   // of HTTP responses.
		Response(InternalServerError)            // of HTTP responses.
		Response(NoContent)                      // of HTTP responses.
	})

})

	e.GET("/aerospike/service/debug", getDebug)
	e.POST("/aerospike/service/clusters/:clusterUuid/debug", postDebug) // cluster does not matter here

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

