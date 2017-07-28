package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("db-role", func() {
	BasePath("roles")
	Parent("connection")
	Description("Database Role Endpoints")

	Security(JWT, func() {
		Scope("api:enterprise")
	})

	Action("query", func() {
		Description("Get the list of roles")
		Routing(GET(""))
		Params(func() {
		})

		Response(OK, ArrayOf(DBRoleResponseMedia))
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	// Action("show", func() {
	// 	Description("Get the information of a role")
	// 	Routing(GET(":role"))
	// 	Params(func() {
	// 		Attribute("role", String)

	// 		Required("role")
	// 	})

	// 	Response(OK, DBRoleResponseMedia)
	// 	Response(Unauthorized)
	// 	Response(InternalServerError)
	// })

	Action("create", func() {
		Description("Register or Update a role")
		Routing(PUT(""))
		Params(func() {
		})

		Payload(func() {
			Member("name", String, "Role name", func() { Example("report") })
			Member("privileges", ArrayOf(Privilege), "DB Privileges", func() { Description("Valid database privileges") })

			Required("name", "privileges")
		})

		Response(OK, DBRoleResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("update", func() {
		Description("Register or Update a role")
		Routing(POST(""))
		Params(func() {
		})

		Payload(func() {
			Member("name", String, "Role name", func() { Example("report") })
			Member("grantPrivileges", ArrayOf(Privilege), "DB Privileges to be granted")
			Member("revokePrivileges", ArrayOf(Privilege), "DB Privileges to be revoked")

			Required("name")
		})

		Response(OK, DBRoleResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("delete", func() {
		Description("Delete a role")
		Routing(DELETE(":role"))
		Params(func() {
			Param("role", String)
			Required("role")
		})

		Response(NoContent)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(NotFound)
		Response(InternalServerError)
	})
})

var Privilege = Type("Privilege", func() {
	Member("namespace", String, "Namespace", func() { Example("test") })
	Member("set", String, "Set", func() { Example("test") })
	Member("privilege", String, "Database Privileges", func() {
		Example("read|read-write|read-write-udf|sys-admin|user-admin|data-admin")
	})

	Required("privilege")
})

var DBRoleResponseMedia = MediaType("application/vnd.aerospike.amc.cluster.role.response+json", func() {
	Description("Database User")
	Attributes(func() {
		Attribute("name", String, "User Id", func() { Example("ada") })
		Attribute("roles", ArrayOf(Privilege), "Database Roles")

		Required("name", "roles")
	})

	View("default", func() {
		Attribute("name")
		Attribute("roles")

		Required("name", "roles")
	})
})
