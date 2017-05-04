package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var UserResponseMedia = MediaType("application/vnd.aerospike.amc.user.query.response+json", func() {
	Description("User")
	Attributes(func() {
		Attribute("username", String, "User Id", func() { Example("ada") })
		Attribute("roles", ArrayOf(String), "AMC User Roles", func() { Example([]string{"ops", "dev"}) })
		Attribute("fullName", String, "User's fullname", func() { Example("Ada Lovelace") })
		Attribute("notes", String, "Additional Notes", func() { Example("A Genius") })
		Attribute("active", Boolean, "User account is active", func() { Example(true) })
		Required("username")
	})

	View("default", func() {
		Attribute("username")
		Attribute("roles")
		Attribute("fullName")
		Attribute("notes")
		Attribute("active")
		Required("username")
	})
})
