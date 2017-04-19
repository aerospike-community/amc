package design

import (
	. "github.com/goadesign/goa/design" // Use . imports to enable the DSL
	. "github.com/goadesign/goa/design/apidsl"
)

// JWT defines a security scheme using JWT.  The scheme uses the "Authorization" header to lookup
// the token.  It also defines then scope "api".
var JWT = JWTSecurity("jwt", func() {
	Header("Authorization")
	Scope("api:driver", "API access to driver resources")
})

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

	Action("logout", func() {
		Description("Logout The User")
		Routing(POST("logout"))
		Params(func() {
		})

		Response(NoContent)
		Response(InternalServerError)
	})

})
