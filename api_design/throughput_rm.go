package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var ThroughputResponseMedia = MediaType("application/vnd.aerospike.amc.throughput.response+json", func() {
	Description("Throughput Point")

	Attributes(func() {
		Attribute("timestamp", Integer, "Timestamp in unix seconds")
		Attribute("x1", Number, "Main Value. `Null` means the value was not available or missed.")
		Attribute("x2", Number, "Secondary Value. `Null` means the value was not available or missed.")

		// Required("timestamp")
	})

	View("default", func() {
		Attribute("timestamp")
		Attribute("x1")
		Attribute("x2")

		// Required("timestamp")
	})
})
