package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var IndexResponseMedia = MediaType("application/vnd.aerospike.amc.index.response+json", func() {
	Description("Throughput Point")

	Attributes(func() {
		Attribute("name", String, "Index Name")
		Attribute("namespace", String, "Namespace")
		Attribute("set", String, "Set name")
		Attribute("bin", String, "Bin name that is being indexed")
		Attribute("binType", String, "Index Type")
		Attribute("syncOnAllNodes", Boolean, "Is the index synced on all nodes?")

		Attribute("Stats", HashOf(String, Any), "IndexStats")

		Required("name", "namespace", "set", "bin", "binType", "syncOnAllNodes")
	})

	View("default", func() {
		Attribute("name", String, "Index Name")
		Attribute("namespace", String, "Namespace")
		Attribute("set", String, "Set name")
		Attribute("bin", String, "Bin name that is being indexed")
		Attribute("binType", String, "Index Type")
		Attribute("syncOnAllNodes", Boolean, "Is the index synced on all nodes?")

		Attribute("Stats", HashOf(String, Any), "IndexStats")

		Required("name", "namespace", "set", "bin", "binType", "syncOnAllNodes")
	})
})
