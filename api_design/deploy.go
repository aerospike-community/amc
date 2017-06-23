package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("deploy", func() {
	BasePath("deployments")
	Description("Node Endpoints")

	Security(JWT, func() {
		Scope("api:general")
	})

	Action("show", func() {
		Description("Get a cluster's nodes")
		Routing(GET(":node"))
		Params(func() {
			Param("node", String, "Node Addresses", func() {
				Example("127.0.0.1")
			})

			Required("node")
		})

		Response(OK, HashOf(String, NodeSSHStatResponseMedia))
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

})

var NodeSSHStatResponseMedia = MediaType("application/vnd.aerospike.amc.node.sshstat.response+json", func() {
	Description("Node Config")

	Attributes(func() {
		Attribute("hostname", String, "Node Hostname")
		Attribute("error", String, "Error message")

		Required("hostname")
	})

	View("default", func() {
		Attribute("hostname")
		Attribute("error")

		Required("hostname")
	})

})
