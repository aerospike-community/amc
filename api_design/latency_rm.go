package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var LatencyResponseMedia = MediaType("application/vnd.aerospike.amc.latency.response+json", func() {
	Description("Latency Data")

	Attributes(func() {
		Attribute("latency", ArrayOf(Any), "Latency values")
		Attribute("status", String, "Node Status")

		Required("latency", "status")
	})

	View("default", func() {
		Attribute("latency")
		Attribute("status")

		Required("latency", "status")
	})
})
