package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("node", func() {
	BasePath("nodes")
	Parent("connection")
	Description("Node Endpoints")

	Security(JWT, func() {
		Scope("api:general")
	})

	Action("show", func() {
		Description("Get a cluster's nodes")
		Routing(GET(":node"))
		Params(func() {
			Param("node", String, "Node Addresses", func() {
				Example("127.0.0.1:3000,127.0.0.2:3000")
			})

			Required("node")
		})

		Response(OK, HashOf(String, NodeResponseMedia))
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("throughput", func() {
		Description("Returns the aggregate throughput of the node namespaces for a given window of time. If From/To are not specified, the latest throughput will be returned.")
		Routing(GET(":node/throughput"))
		Params(func() {
			Param("node", String, "Node Address", func() {
				Example("127.0.0.1:3000")
			})

			Param("from", Integer, "From time in unix seconds")
			Param("until", Integer, "Until time in unix seconds")

			Required("node")
		})

		Response(OK, ThroughputWrapperResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("latency", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Returns the aggregate latency of the node namespaces for a given window of time. If From/To are not specified, the latest throughput will be returned.")
		Routing(GET(":node/latency"))
		Params(func() {
			Param("node", String, "Node Address", func() {
				Example("127.0.0.1:3000")
			})

			Param("from", Integer, "From time in unix seconds")
			Param("until", Integer, "Until time in unix seconds")

			Required("node")
		})

		Response(OK, HashOf(String, LatencyResponseMedia))
		Response(BadRequest, String)
		Response(NotImplemented, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("jobs", func() {
		// Security(JWT, func() {
		// 	Scope("api:enterprise")
		// })

		Description("Returns the list of jobs for the node.")
		Routing(GET(":node/jobs"))
		Params(func() {
			Param("node", String, "Node Address", func() {
				Example("127.0.0.1:3000")
			})

			Param("sortBy", String, "Field by which to sort the results", func() { Example("time-since-done") })
			Param("sortOrder", String, "Sort Order", func() {
				Example("desc")
				Pattern("desc|asc")
			})
			Param("offset", Integer, "Page number of the job list", func() { Example(1) })
			Param("limit", Integer, "Number of jobs per page", func() { Example(1) })
			Param("status", String, "Status of the job", func() {
				Example("in-progress|completed")
				Pattern("in-progress|completed")
			})
			// Param("module", String, "Module", func() { Example("scan|query") })

			Required("node")
		})

		Response(OK, JobResponseMedia)
		Response(BadRequest, String)
		Response(NotImplemented, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("kill-job", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Returns the list of jobs for the node.")
		Routing(GET(":node/jobs/:trid"))
		Params(func() {
			Param("node", String, "Node Address", func() { Example("127.0.0.1:3000") })
			Param("module", String, "Module", func() {
				Example("scan|query")
				Pattern("scan|query")
			})
			Param("trid", String, "TransactionId", func() {
				Example("3177513851364758020")
			})

			Required("node", "module", "trid")
		})

		Response(NoContent)
		Response(BadRequest, String)
		Response(NotImplemented, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("config", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Returns the config of the node.")
		Routing(GET(":node/config"))
		Params(func() {
			Param("node", String, "Node Address", func() {
				Example("127.0.0.1:3000")
			})

			Required("node")
		})

		Response(OK, NodeConfigResponseMedia)
		Response(BadRequest, String)
		Response(NotImplemented, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("set config", func() {
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Changes the config of the node.")
		Routing(POST(":node/config"))
		Params(func() {
			Param("node", String, "Node Address", func() {
				Example("127.0.0.1:3000")
			})

			Required("node")
		})

		Payload(func() {
			Member("newConfig", HashOf(String, String), "New config parameters", func() { Example(map[string]interface{}{"some-config": "some-value"}) })
			Required("newConfig")
		})

		Response(OK, NodeConfigResponseMedia)
		Response(BadRequest, String)
		Response(NotAcceptable, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})

var NodeResponseMedia = MediaType("application/vnd.aerospike.amc.node.response+json", func() {
	Description("Node End Point")

	Attributes(func() {
		Attribute("memory", ResourceUsageResponseMedia, "Memory Usage")
		Attribute("disk", ResourceUsageResponseMedia, "Disk Usage")
		Attribute("clusterVisibility", String, "Cluster Visibility")
		Attribute("sameCluster", Boolean, "If it belongs to the same cluster as the other nodes")
		Attribute("status", String, "Node status")
		Attribute("stats", HashOf(String, Any), "Node statistics")

		Required("memory", "disk", "clusterVisibility", "sameCluster", "status", "stats")
	})

	View("default", func() {
		Attribute("memory")
		Attribute("disk")
		Attribute("clusterVisibility")
		Attribute("sameCluster")
		Attribute("status")
		Attribute("stats")

		Required("memory", "disk", "clusterVisibility", "sameCluster", "status", "stats")
	})
})

var NodeConfigResponseMedia = MediaType("application/vnd.aerospike.amc.node.config.response+json", func() {
	Description("Node Config")

	Attributes(func() {
		Attribute("address", String, "Node Address")
		Attribute("status", String, "Node status")
		Attribute("config", HashOf(String, Any), "Node config")
		Attribute("error", String, "Error message")

		Required("address", "status", "config")
	})

	View("default", func() {
		Attribute("address")
		Attribute("status")
		Attribute("config")
		Attribute("error")

		Required("address", "status", "config")
	})

})

var JobResponseMedia = MediaType("application/vnd.aerospike.amc.job.response+json", func() {
	Description("Job")

	Attributes(func() {
		Attribute("offset", Integer, "Module Name")
		Attribute("limit", Integer, "Transaction ID")
		Attribute("jobs", ArrayOf(HashOf(String, Any)), "namespace")
		Attribute("jobCount", Integer, "set name")

		Required("offset", "limit", "jobs", "jobCount")
	})

	View("default", func() {
		Attribute("offset")
		Attribute("limit")
		Attribute("jobs")
		Attribute("jobCount")

		Required("offset", "limit", "jobs", "jobCount")
	})

})
