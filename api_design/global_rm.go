package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var AMCSystemResponseMedia = MediaType("application/vnd.aerospike.amc.system.response+json", func() {
	Description("AMC Server System information")
	Attributes(func() {
		Attribute("version", String, "AMC Version", func() { Example("5.0") })
	})

	View("default", func() {
		Attribute("version")
	})
})

var ThroughputWrapperResponseMedia = MediaType("application/vnd.aerospike.amc.throughput.wrapper.response+json", func() {
	Description("AMC Throughput Response")
	Attributes(func() {
		Attribute("status", String, "Cluster/Node Status", func() { Example("on") })
		Attribute("throughput", HashOf(String, HashOf(String, ArrayOf(ThroughputResponseMedia))), "Throughput Data")

		Required("status", "throughput")
	})

	View("default", func() {
		Attribute("status")
		Attribute("throughput")

		Required("status", "throughput")
	})
})
