package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("set", func() {
	BasePath("sets")
	Parent("namespace")
	Description("Set endpoints")

	Security(JWT, func() {
		Scope("api:general")
	})

	Action("query", func() {
		Description("Query a cluster's namespaces")
		Routing(GET(""))

		Response(OK, ArrayOf(HashOf(String, Any)))
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("show", func() {
		Description("Get a namespace's set")
		Routing(GET(":setName"))
		Params(func() {
			Param("setName", String, "Set name", func() { Example("test") })

			Required("setName")
		})

		Response(OK, HashOf(String, Any))
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("drop", func() {
		Description("Drop a set from the cluster (Supported by Aerospike server versions v3.12+)")
		Routing(DELETE(":setName"))

		Params(func() {
			Member("setName", String, "Set's Name", func() {
				Example("reports")
			})
			Required("setName")
		})

		Response(NoContent)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})
