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

	Action("show", func() {
		Description("Get the user connection")
		Routing(GET(":connId"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Required("connId")
		})

		Response(OK, UserConnectionResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("connect", func() {
		Description("Connect to the cluster and return the entity tree")
		Routing(POST(":connId"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Required("connId")
		})

		Payload(func() {
			Member("username", String, "Database Username", func() { Example("admin") })
			Member("password", String, "Database User's Password", func() { Example("123456") })
			Required("username", "password")
		})

		Response(OK, UserConnectionTreeResponseMedia)
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
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
			Member("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Member("name", String, "Connection Name", func() { Example("Payments Cluster") })
			Member("seeds", ArrayOf("NodeSeed"), "Seeds")
			Member("connectOnLogin", Boolean, "Should AMC connect to this cluster automatically after user login?")
			Required("name", "seeds")
		})

		Response(NoContent)
		Response(BadRequest)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("delete", func() {
		Description("Delete a connection")
		Routing(DELETE(":connId"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Required("connId")
		})

		Response(NoContent)
		Response(Unauthorized)
		Response(NotFound)
		Response(InternalServerError)
	})

	Action("throughput", func() {
		Description("Returns the aggregate throughput of the connection nodes for a given window of time. If From/To are not specified, the latest throughput will be returned.")
		Routing(GET(":connId/throughput"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Param("from", Integer, "From time in unix seconds")
			Param("until", Integer, "Until time in unix seconds")

			Required("connId")
		})

		Response(OK, ThroughputWrapperResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	// Action("namespace", func() {
	// 	Description("Returns the aggregate throughput of the connection nodes for a given window of time. If From/To are not specified, the latest throughput will be returned.")
	// 	Routing(GET(":connId/namespaces/:naemspace"))
	// 	Params(func() {
	// 		Param("connId", String, "Connection Id", func() {
	// 			Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
	// 			Pattern(uuidv4Regex)
	// 		})

	// 		Param("namespace", string, "Namespace name")

	// 		Required("connId")
	// 	})

	// 	Response(OK, HashOf(String, ThroughputWrapperResponseMedia))
	// 	Response(BadRequest, String)
	// 	Response(Unauthorized)
	// 	Response(InternalServerError)
	// })

})
