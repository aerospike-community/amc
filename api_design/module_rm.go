package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var ConnectionModuleResponseMedia = MediaType("application/vnd.aerospike.amc.connection.modules.response+json", func() {
	Description("Cluster Modules")
	Attributes(func() {
		Attribute("hash", String, "Module's Hash")
		Attribute("name", String, "Module's Name")

		Attribute("source", String, "Module's Source Code")
		Attribute("type", String, "Module's Source Type")

		Attribute("nodesPresent", ArrayOf(String), "Nodes in which the module is present")
		Attribute("nodesAbsent", ArrayOf(String), "Nodes from which the module is absent")
		Attribute("synced", Boolean, "Is Module present in all nodes?")
	})

	View("default", func() {
		Attribute("hash")
		Attribute("name")
		Attribute("type")
		Attribute("nodesPresent")
		Attribute("nodesAbsent")
		Attribute("synced")
		Required("name", "hash", "nodesPresent", "nodesAbsent", "synced", "type")
	})

	View("full", func() {
		Attribute("name")
		Attribute("source")
		Attribute("type")
		Required("name", "source", "type")
	})
})
