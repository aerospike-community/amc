package design

import (
	. "github.com/goadesign/goa/design" // Use . imports to enable the DSL
	. "github.com/goadesign/goa/design/apidsl"
)

// JWT defines a security scheme using JWT.  The scheme uses the "Authorization" header to lookup
// the token.  It also defines then scope "api".
var JWT = JWTSecurity("jwt", func() {
	Header("Authorization")
	Scope("api:cluster", "API access to cluster resources")
})

var _ = Resource("auth", func() { // Resources group related API endpoints
	BasePath("auth")                        // together. They map to REST resources for REST
	Description("Authentication Endpoints") // and exactly one API definition appearing in

	NoSecurity()

	Action("authenticate", func() { // Actions define a single API endpoint together
		Description("Authenticate a device") // with its path, parameters (both path
		Routing(POST("authenticate"))        // parameters and querystring values) and payload
		Params(func() {                      // (shape of the request body).
		})

		Payload(func() { // Attributes define the media type shape.
			Member("user", String, "AMC User Name (this is not the same as Database user name)")
			Member("password", String, "AMC User's Password")
			Required("user", "password")
		})

		Response(NoContent, func() {
			Headers(func() {
				Header("Authorization", String, "Generated JWT")
			})
		})

		Response(Unauthorized)        // auth input not match
		Response(Forbidden)           // user not active
		Response(InternalServerError) // other errors
	})

	Action("logout", func() { // Actions define a single API endpoint together
		Description("Logout The User") // with its path, parameters (both path
		Routing(POST("logout"))        // parameters and querystring values) and payload
		Params(func() {                // (shape of the request body).
		})

		Response(NoContent)
		Response(InternalServerError) // other errors
	})

})
