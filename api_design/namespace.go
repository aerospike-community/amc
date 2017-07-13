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

	Action("query", func() {
		Description("Query a node's namespaces")
		Routing(GET(""))

		Response(OK, HashOf(String, NamespaceResponseMedia))
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("show", func() {
		Description("Get a cluster's namespace")
		Routing(GET(":namespace"))
		Params(func() {
			Param("namespace", String, "Namespace", func() { Example("test") })

			Required("namespace")
		})

		Response(OK, NamespaceResponseMedia)
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("drop", func() {
		Description("Drop a namespace from the cluster")
		Routing(DELETE(":namespace"))

		Params(func() {
			Member("namespace", String, "Module's Name", func() {
				Example("reports")
			})
			Required("namespace")
		})

		Response(NoContent)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

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

	Action("config", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Returns the config of the namespace.")
		Routing(GET(":namespace/config"))
		Params(func() {
			Param("namespace", String, "Namespace name", func() { Example("test") })

			Required("namespace")
		})

		Response(OK, NamespaceConfigResponseMedia)
		Response(BadRequest, String)
		Response(NotImplemented, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("set config", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Changes the config of the namespace.")
		Routing(POST(":namespace/config"))
		Params(func() {
			Param("namespace", String, "Namespace name", func() { Example("test") })

			Required("namespace")
		})

		Payload(func() {
			Member("newConfig", HashOf(String, String), "New config parameters", func() { Example(map[string]interface{}{"some-config": "some-value"}) })

			Required("newConfig")
		})

		Response(OK, NamespaceConfigResponseMedia)
		Response(BadRequest, String)
		Response(NotAcceptable, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})

var NamespaceConfigResponseMedia = MediaType("application/vnd.aerospike.amc.namespace.config.response+json", func() {
	Description("Node Config")

	Attributes(func() {
		Attribute("address", String, "Node Address")
		Attribute("namespace", String, "Namespace Name")
		Attribute("status", String, "Node status")
		Attribute("config", HashOf(String, Any), "Node config")
		Attribute("error", String, "Error message")

		Required("address", "namespace", "status", "config")
	})

	View("default", func() {
		Attribute("address")
		Attribute("namespace")
		Attribute("status")
		Attribute("config")
		Attribute("error")

		Required("address", "namespace", "status", "config")
	})

})
