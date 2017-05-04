package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("user", func() {
	BasePath("users")
	Description("User Endpoints")

	Security(JWT, func() {
		Scope("api:admin")
	})

	Action("query", func() {
		Description("Get the list of users")
		Routing(GET(""))
		Params(func() {
		})

		Response(OK, ArrayOf(UserResponseMedia))
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("get", func() {
		Description("Get the list of users")
		Routing(GET(":username"))
		Params(func() {
			Attribute("username", String)
			Required("username")
		})

		Response(OK, UserResponseMedia)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("save", func() {
		Description("Register or Update a new user")
		Routing(POST(""))
		Params(func() {
		})

		Payload(func() {
			Member("username", String, "AMC User Id", func() { Example("ada") })
			Member("password", String, "Password", func() { Example("password") })
			Member("roles", ArrayOf(String), "AMC User Roles", func() {
				Description("Valid roles are: admin, ops, dev")
				Example([]string{"ops", "dev"})
			})
			Member("fullName", String, "User's fullname", func() { Example("Ada Lovelace") })
			Member("notes", String, "Additional Notes", func() { Example("A Genius") })
			Member("active", Boolean, "User account is active", func() { Example(true) })
			Required("username", "roles")
		})

		Response(OK, UserResponseMedia)
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
		Response(Unauthorized)
		Response(NotFound)
		Response(InternalServerError)
	})
})
