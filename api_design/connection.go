package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("connection", func() {
	BasePath("connections")
	Description("Connection Endpoints")

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
			Member("id", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Member("name", String, "Connection Name", func() { Example("Payments Cluster") })
			Member("seeds", ArrayOf("NodeSeed"), "Seeds")
			Required("name", "seeds")
		})

		Response(NoContent)
		Response(BadRequest)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("delete", func() {
		Description("Delete a connection")
		Routing(DELETE(":id"))
		Params(func() {
			Param("id", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Required("id")
		})

		Response(NoContent)
		Response(Unauthorized)
		Response(NotFound)
		Response(InternalServerError)
	})
})
