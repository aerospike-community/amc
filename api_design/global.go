package design

import (
	. "github.com/goadesign/goa/design" // Use . imports to enable the DSL
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("amc", func() {
	BasePath("amc")
	Description("Global Endpoints")

	NoSecurity()

	Action("system", func() {
		Description("Get AMC Server Version and Information")
		Routing(GET("system"))
		Params(func() {
		})

		Response(OK, AMCSystemResponseMedia)
		Response(InternalServerError)
	})

})
