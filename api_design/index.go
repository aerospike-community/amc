package design

// import (
// 	. "github.com/goadesign/goa/design"
// 	. "github.com/goadesign/goa/design/apidsl"
// )

// var _ = Resource("index", func() {
// 	BasePath("indexes")
// 	Parent("set")
// 	Description("Module (UDF) Endpoints")

// 	Security(JWT, func() {
// 		Scope("api:general")
// 	})

// 	Action("query", func() {
// 		Description("Query a cluster's indexes")
// 		Routing(GET(""))

// 		Response(OK, ArrayOf(ConnectionModuleResponseMedia))
// 		Response(BadRequest, String)
// 		Response(Forbidden)
// 		Response(Unauthorized)
// 		Response(InternalServerError)
// 	})

// 	Action("show", func() {
// 		Description("Get a cluster's index")
// 		Routing(GET(":name"))

// 		Response(OK, func() {
// 			Media(ConnectionModuleResponseMedia, "full")
// 		})
// 		Response(BadRequest, String)
// 		Response(Unauthorized)
// 		Response(InternalServerError)
// 	})

// 	Action("save", func() {
// 		Description("Save a index in the cluster")
// 		Routing(POST(""))

// 		Payload(func() {
// 			Member("name", String, "Module's Name", func() {
// 				Example("reports")
// 			})
// 			Member("content", String, "Module's Source Code")
// 			Member("type", String, "Module's type", func() {
// 				Example("LUA")
// 				Pattern("(?i)LUA")
// 			})

// 			Required("name", "content", "type")
// 		})

// 		Response(NoContent)
// 		Response(BadRequest, String)
// 		Response(Forbidden)
// 		Response(Unauthorized)
// 		Response(InternalServerError)
// 	})

// 	Action("drop", func() {
// 		Description("Drop a index from the cluster")
// 		Routing(DELETE(":name"))

// 		Params(func() {
// 			Member("name", String, "Module's Name", func() {
// 				Example("reports")
// 			})
// 			Required("name")
// 		})

// 		Response(NoContent)
// 		Response(BadRequest, String)
// 		Response(Unauthorized)
// 		Response(InternalServerError)
// 	})
// })

// e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes/:sindex/nodes/:node/allstats", sessionValidator(getClusterNamespaceSindexNodeAllStats))
// e.POST("/aerospike/service/clusters/:clusterUuid/namespace/:namespace/add_index", sessionValidator(postClusterAddIndex))
// e.POST("/aerospike/service/clusters/:clusterUuid/namespace/:namespace/drop_index", sessionValidator(postClusterDropIndex))
