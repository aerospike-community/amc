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

	Action("add-node", func() {

		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Add a node to the cluster")
		Routing(POST(":connId/add-node"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Required("connId")
		})

		Payload(func() {
			Member("node", NodeSeed, "New Node Seed")
			Required("node")
		})

		Response(NoContent)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
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

	Action("user", func() {
		Description("Get the currently logged in user of the cluster")
		Routing(GET(":connId/user"))

		Response(OK, DBRoleResponseMedia)
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

	Action("logout", func() {
		Description("Logout from the connection")
		Routing(POST(":connId/logout"))
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

	Action("entities", func() {
		Description("Return the cluster's entity tree")
		Routing(GET(":connId/entity-tree"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Required("connId")
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

	Action("namespaces", func() {
		Description("Query cluster's namespaces")
		Routing(GET(":connId/namespaces"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Required("connId")
		})

		Response(OK, HashOf(String, ClusterNamespaceResponseMedia))
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("latency", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Returns the aggregate latency of the cluster namespaces for a given window of time. If From/To are not specified, the latest throughput will be returned.")
		Routing(GET(":connId/latency"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Param("from", Integer, "From time in unix seconds")
			Param("until", Integer, "Until time in unix seconds")

			Required("connId")
		})

		Response(OK, ArrayOf(Any))
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("config", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Returns the config of all the nodes in the cluster.")
		Routing(GET(":connId/config"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Required("connId")
		})

		Response(OK, HashOf(String, NodeConfigResponseMedia))
		Response(BadRequest, String)
		Response(NotImplemented, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("set config", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Changes the config of the node.")
		Routing(POST(":connId/config"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Required("connId")
		})

		Payload(func() {
			Member("newConfig", HashOf(String, String), "New config parameters", func() { Example(map[string]interface{}{"some-config": "some-value"}) })
			Required("newConfig")
		})

		Response(OK, HashOf(String, NodeConfigResponseMedia))
		Response(BadRequest, String)
		Response(NotAcceptable, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("overview", func() {
		Description("Get a multi-cluster overview with all XDR replications")
		Routing(GET("overview"))
		Params(func() {
		})

		Response(OK, Any)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("get logs", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})
		Scheme("ws")
		Description("Receive logs via a Websocket")
		Routing(GET(":connId/logs"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Required("connId")
		})
		Response(SwitchingProtocols)
	})

	Action("aql", func() {
		Description("Send an AQL command to server and get the results")
		Routing(POST(":connId/aql"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})
			Required("connId")
		})

		Payload(func() {
			Member("aql", String, "AQL command", func() { Example("SELECT * FROM test.test") })
			Required("aql")
		})

		Response(OK)
		Response(BadRequest, String)
		Response(NotAcceptable, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("check aql UDF", func() {
		Description("Check if the AQL UDF is registered on the server.")
		Routing(GET(":connId/aql/isset"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Required("connId")
		})

		Response(OK, Boolean)
		Response(BadRequest, String)
		Response(NotAcceptable, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("register aql UDF on the server", func() {
		Description("Register the AQL UDF on the server.")
		Routing(GET(":connId/aql/register"))
		Params(func() {
			Param("connId", String, "Connection Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Required("connId")
		})

		Response(OK, String)
		Response(BadRequest, String)
		Response(NotAcceptable, HashOf(String, String))
		Response(Unauthorized)
		Response(InternalServerError)
	})

})
