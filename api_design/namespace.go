package design

// import (
// 	. "github.com/goadesign/goa/design"
// 	. "github.com/goadesign/goa/design/apidsl"
// )

// var _ = Resource("namespace", func() {
// 	BasePath("namespaces")
// 	Parent("connection")
// 	Description("Namespace Endpoints")

// 	Security(JWT, func() {
// 		Scope("api:general")
// 	})

// 	Action("query", func() {
// 		Description("Query a cluster's namespaces")
// 		Routing(GET(""))

// 		Response(OK, ArrayOf(ConnectionNamespaceResponseMedia))
// 		Response(BadRequest, String)
// 		Response(Forbidden)
// 		Response(Unauthorized)
// 		Response(InternalServerError)
// 	})

// 	Action("show", func() {
// 		Description("Get a cluster's namespace")
// 		Routing(GET(":name"))

// 		Response(OK, func() {
// 			Media(ConnectionNamespaceResponseMedia, "full")
// 		})
// 		Response(BadRequest, String)
// 		Response(Unauthorized)
// 		Response(InternalServerError)
// 	})

// Action("save", func() {
// 	Description("Save a namespace in the cluster")
// 	Routing(POST(""))

// 	Payload(func() {
// 		Member("name", String, "Module's Name", func() {
// 			Example("reports")
// 		})
// 		Member("content", String, "Module's Source Code")
// 		Member("type", String, "Module's type", func() {
// 			Example("LUA")
// 			Pattern("(?i)LUA")
// 		})

// 		Required("name", "content", "type")
// 	})

// 	Response(NoContent)
// 	Response(BadRequest, String)
// 	Response(Forbidden)
// 	Response(Unauthorized)
// 	Response(InternalServerError)
// })

// Action("drop", func() {
// 	Description("Drop a namespace from the cluster")
// 	Routing(DELETE(":name"))

// 	Params(func() {
// 		Member("name", String, "Module's Name", func() {
// 			Example("reports")
// 		})
// 		Required("name")
// 	})

// 	Response(NoContent)
// 	Response(BadRequest, String)
// 	Response(Unauthorized)
// 	Response(InternalServerError)
// })

// Action("throughput", func() {
// 	Description("Returns the aggregate throughput of the namespace nodes for a given window of time. If From/To are not specified, the latest throughput will be returned.")
// 	Routing(GET(":connId/throughput"))
// 	Params(func() {
// 		Param("connId", String, "Connection Id", func() {
// 			Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
// 			Pattern(uuidv4Regex)
// 		})

// 		Param("from", Integer, "From time in unix seconds")
// 		Param("until", Integer, "Until time in unix seconds")

// 		Required("connId")
// 	})

// 	Response(OK, HashOf(String, HashOf(String, ThroughputResponseMedia)))
// 	Response(BadRequest, String)
// 	Response(Unauthorized)
// 	Response(InternalServerError)
// })
// })
