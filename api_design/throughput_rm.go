package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var ThroughputResponseMedia = MediaType("application/vnd.aerospike.amc.throughput.response+json", func() {
	Description("Throughput Point")

	Attributes(func() {
		Attribute("timestamp", Integer, "Timestamp in unix seconds")
		Attribute("successful", Number, "Main Value. `Null` means the value was not available or missed.")
		Attribute("failed", Number, "Secondary Value. `Null` means the value was not available or missed.")

		// Required("timestamp")
	})

	View("default", func() {
		Attribute("timestamp")
		Attribute("successful")
		Attribute("failed")

		// Required("timestamp")
	})
})

var ThroughputWrapperResponseMedia = MediaType("application/vnd.aerospike.amc.throughput.wrapper.response+json", func() {
	Description("AMC Throughput Response Wrapper")
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
