package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("node", func() {
	BasePath("nodes")
	Parent("connection")
	Description("Node Endpoints")

	Security(JWT, func() {
		Scope("api:general")
	})

	Action("show", func() {
		Description("Get a cluster's node")
		Routing(GET(":node"))
		Params(func() {
			Param("node", String, "Node Address", func() {
				Example("127.0.0.1:3000")
			})

			Required("node")
		})

		Response(OK, ThroughputWrapperResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("throughput", func() {
		Description("Returns the aggregate throughput of the node namespaces for a given window of time. If From/To are not specified, the latest throughput will be returned.")
		Routing(GET(":node/throughput"))
		Params(func() {
			Param("node", String, "Node Address", func() {
				Example("127.0.0.1:3000")
			})

			Param("from", Integer, "From time in unix seconds")
			Param("until", Integer, "Until time in unix seconds")

			Required("node")
		})

		Response(OK, ThroughputWrapperResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})
