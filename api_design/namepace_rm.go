package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var NamespaceResponseMedia = MediaType("application/vnd.aerospike.amc.namespace.response+json", func() {
	Description("Namespace End Point")

	Attributes(func() {
		Attribute("name", String, "Namespace Name")
		Attribute("memory", ResourceUsageResponseMedia, "Memory Usage")
		Attribute("disk", ResourceUsageResponseMedia, "Disk Usage")
		Attribute("status", String, "Cluster/Node status")
		Attribute("stats", HashOf(String, Any), "Namespace statistics")

		Required("name", "memory", "disk", "status", "stats")
	})

	View("default", func() {
		Attribute("name")
		Attribute("memory")
		Attribute("disk")
		Attribute("status")
		Attribute("stats")

		Required("name", "memory", "disk", "status", "stats")
	})

})

var ClusterNamespaceResponseMedia = MediaType("application/vnd.aerospike.amc.cluster.namespace.response+json", func() {
	Description("Namespace End Point")

	Attributes(func() {
		Attribute("name", String, "Namespace Name")
		Attribute("memory", ResourceUsageResponseMedia, "Memory Usage")
		Attribute("disk", ResourceUsageResponseMedia, "Disk Usage")
		Attribute("status", String, "Cluster/Node status")
		Attribute("stats", HashOf(String, Any), "Namespace statistics")
		Attribute("leastAvailablePct", HashOf(String, Any), "Overall least resources available across all nodes")

		Required("name", "memory", "disk", "status", "stats", "leastAvailablePct")
	})

	View("default", func() {
		Attribute("name")
		Attribute("memory")
		Attribute("disk")
		Attribute("status")
		Attribute("stats")
		Attribute("leastAvailablePct")

		Required("name", "memory", "disk", "status", "stats", "leastAvailablePct")
	})

})
