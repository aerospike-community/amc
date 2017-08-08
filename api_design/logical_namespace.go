package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("logical-namespace", func() {
	BasePath("logical-namespaces")
	Parent("connection")
	Description("Logical view of the namespace across all the nodes in the cluster")

	Security(JWT, func() {
		Scope("api:general")
	})

	Action("show", func() {
		Description("Get a cluster's namespace")
		Routing(GET(":namespace"))
		Params(func() {
			Param("namespace", String, "Namespace", func() { Example("test") })

			Required("namespace")
		})

		Response(OK, LogicalNamespaceResponseMedia)
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("throughput", func() {
		Description("Returns the aggregate throughput of the namespace for a given window of time.")
		Routing(GET(":namespace/throughput"))
		Params(func() {
			Param("namespace", String, "Namespace", func() { Example("test") })
			Param("from", Integer, "From time in unix seconds")
			Param("until", Integer, "Until time in unix seconds")

			Required("namespace", "from", "until")
		})

		Response(OK, ThroughputWrapperResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})

var LogicalNamespaceResponseMedia = MediaType("application/vnd.aerospike.amc.logical.namespace.response+json", func() {
	Description("Logical view of namespace end point")

	Attributes(func() {
		Attribute("name", String, "Namespace Name")
		Attribute("objsz", Any, "Object size histogram")
		Attribute("ttl", Any, "Time to live histogram")

		Required("name", "objsz", "ttl")
	})

	View("default", func() {
		Attribute("name")
		Attribute("objsz")
		Attribute("ttl")

		Required("name", "objsz", "ttl")
	})
})
