package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("db-user", func() {
	BasePath("users")
	Parent("connection")
	Description("Database User Endpoints")

	Security(JWT, func() {
		Scope("api:enterprise")
	})

	Action("query", func() {
		Description("Get the list of users")
		Routing(GET(""))
		Params(func() {
		})

		Response(OK, ArrayOf(DBUserResponseMedia))
		Response(BadRequest, String)
		Response(NotFound)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("show", func() {
		Description("Get the information for users")
		Routing(GET(":username"))
		Params(func() {
			Attribute("username", String)
			Required("username")
		})

		Response(OK, DBUserResponseMedia)
		Response(BadRequest, String)
		Response(NotFound)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("create", func() {
		Description("Register or Update a user")
		Routing(PUT(""))
		Params(func() {
		})

		Payload(func() {
			Member("username", String, "Database User Id", func() { Example("ada") })
			Member("password", String, "Password. If Password is not provided, the user will be updated.", func() { Example("password") })
			Member("roles", ArrayOf(String), "Database User Roles to be granted to the User")

			Required("username", "password", "roles")
		})

		Response(OK, DBUserResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("update", func() {
		Description("Register or Update a user")
		Routing(POST(""))
		Params(func() {
		})

		Payload(func() {
			Member("username", String, "Database User Id", func() { Example("ada") })
			Member("password", String, "Password. If Password is not provided, the user will be updated.", func() { Example("password") })
			Member("grantRoles", ArrayOf(String), "Database User Roles to be granted to the User")
			Member("revokeRoles", ArrayOf(String), "Database User Roles to be revoked from the User")
			Required("username")
		})

		Response(OK, DBUserResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("delete", func() {
		Description("Delete a user")
		Routing(DELETE(":username"))
		Params(func() {
			Param("username", String)
			Required("username")
		})

		Response(NoContent)
		Response(BadRequest, String)
		Response(NotFound)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})

var DBUserResponseMedia = MediaType("application/vnd.aerospike.amc.cluster.user.response+json", func() {
	Description("Database User")
	Attributes(func() {
		Attribute("username", String, "User Id", func() { Example("ada") })
		Attribute("roles", ArrayOf(String), "Database User Roles", func() { Example([]string{"ops", "dev"}) })

		Required("username", "roles")
	})

	View("default", func() {
		Attribute("username")
		Attribute("roles")

		Required("username", "roles")
	})
})
