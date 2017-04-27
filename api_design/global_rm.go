package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var AMCSystemResponseMedia = MediaType("application/vnd.aerospike.amc.system.response+json", func() {
	Description("AMC Server System information")
	Attributes(func() {
		Attribute("version", String, "AMC Version")
	})

	View("default", func() {
		Attribute("version")
	})
})
