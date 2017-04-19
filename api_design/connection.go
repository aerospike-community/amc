package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("cluster", func() {
	BasePath("clusters")
	Description("Cluster Endpoints")

	Security(JWT, func() {
		Scope("api:general")
	})

	Action("query", func() {
		Description("Get the list of user connections")
		Routing(GET(""))
		Params(func() {
		})

		Response(OK, ArrayOf(UserConnectionsResponseMedia))
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("save", func() {
		Description("Register or Update a new connection for user")
		Routing(POST(""))
		Params(func() {
		})

		Payload(func() {
			Member("name", String, "Connection Name")
			Member("seeds", ArrayOf(NodeSeed), "Seeds")
			Required("name", "seeds")
		})

		Response(NoContent)
		Response(BadRequest)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("delete", func() {
		Description("Delete a connection")
		Routing(DELETE(":name"))
		Params(func() {
			Param("name", String, "Connection name")
			Required("name")
		})

		Response(Gone)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})
