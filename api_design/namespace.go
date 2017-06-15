package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("namespace", func() {
	BasePath("namespaces")
	Parent("node")
	Description("Namespace endpoints")

	Security(JWT, func() {
		Scope("api:general")
	})

	// Action("query", func() {
	// 	Description("Query a cluster's namespaces")
	// 	Routing(GET(""))

	// 	Response(OK, ArrayOf(ConnectionNamespaceResponseMedia))
	// 	Response(BadRequest, String)
	// 	Response(Forbidden)
	// 	Response(Unauthorized)
	// 	Response(InternalServerError)
	// })

	Action("show", func() {
		Description("Get a cluster's namespace")
		Routing(GET(":namespace"))
		Params(func() {
			Param("namespace", String, "Namespace", func() { Example("test") })

			Required("namespace")
		})

		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

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

	Action("throughput", func() {
		Description("Returns the aggregate throughput of the namespace for a given window of time. If From/To are not specified, the latest throughput will be returned.")
		Routing(GET(":namespace/throughput"))
		Params(func() {
			Param("namespace", String, "Namespace", func() { Example("test") })

			Param("from", Integer, "From time in unix seconds")
			Param("until", Integer, "Until time in unix seconds")

			Required("namespace")
		})

		Response(OK, ThroughputWrapperResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("latency", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Returns the aggregate latency of the namespace for a given window of time. If From/To are not specified, the latest throughput will be returned.")
		Routing(GET(":namespace/latency"))
		Params(func() {
			Param("namespace", String, "Namespace name", func() { Example("test") })

			Param("from", Integer, "From time in unix seconds")
			Param("until", Integer, "Until time in unix seconds")

			Required("namespace")
		})

		Response(OK, HashOf(String, LatencyResponseMedia))
		Response(BadRequest, String)
		Response(NotImplemented, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})
