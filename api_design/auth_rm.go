package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var AuthResponseMedia = MediaType("application/vnd.aerospike.amc.auth.response+json", func() {
	Description("AMC Server information")
	Attributes(func() {
		Attribute("roles", ArrayOf(String), "AMC roles of the user")
		Attribute("isEnterprise", Boolean, "Is the AMC an enterprise version")
	})

	View("default", func() {
		Attribute("roles")
		Attribute("isEnterprise")

		Required("roles", "isEnterprise")
	})
})
