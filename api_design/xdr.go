package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("xdr", func() {
	BasePath("xdr")
	Description("XDR endpoints")

	Security(JWT, func() {
		Scope("api:enterprise")
	})

	Action("query", func() {
		Description("Query all XDR data")
		Routing(GET(""))

		Response(OK, Any)
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("show", func() {
		Description("Get a node's XDR info")
		Routing(GET(":node"))
		Params(func() {
			Param("node", String, "Set name", func() { Example("test") })

			Required("node")
		})

		Response(OK, Any)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

})
