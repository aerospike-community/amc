package design

import (
	"math"

	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

// NodeSeed describes a single node connection info
var NodeSeed = Type("NodeSeed", func() {
	Member("host", String, "Node Host. Valid DNS, IPv4 or IPv6 value", func() { Example("127.0.0.1") })
	Member("tlsName", String, "Node's TLS name", func() { Example("") })
	Member("port", Integer, "Node's port", func() {
		Minimum(0)
		Maximum(math.MaxInt16)
		Example(3000)
	})
	Required("host", "port")
})

var UserConnectionsResponseMedia = MediaType("application/vnd.aerospike.amc.connection.query.response+json", func() {
	Description("User Connection")
	Attributes(func() {
		Attribute("id", String, "Connection Id", func() {
			Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
			Pattern(uuidv4Regex)
		})
		Attribute("name", String, "Connection Name", func() { Example("Payments Cluster") })
		Attribute("seeds", ArrayOf(NodeSeed), "Seeds")

		Attribute("connectOnLogin", Boolean, "UI should connect to this connection automatically after AMC login")
		Attribute("connected", Boolean, "If AMC is already connected to this cluster for the current user.")

		Required("id", "name", "connectOnLogin", "connected")
	})

	View("default", func() {
		Attribute("id")
		Attribute("name")
		Attribute("seeds")

		Attribute("connectOnLogin")
		Attribute("connected")

		Required("name", "connectOnLogin", "connected")
	})
})

var UserConnectionTreeResponseMedia = MediaType("application/vnd.aerospike.amc.connection.tree.response+json", func() {
	Description("User Connection Entity Tree")
	Attributes(func() {
		Attribute("id", String, "Connection Id", func() {
			Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
			Pattern(uuidv4Regex)
		})

		Attribute("lastUpdate", Integer, "Last Update Of This Entity in Unix Seconds")
		Attribute("entityType", String, "Entity Type")
		Attribute("nodes", ArrayOf(EntityNode), "Nodes")
		Attribute("modules", ArrayOf(EntityModule), "modules")

		Attribute("status", String, "Cureent connection status.")

		Required("id", "entityType", "lastUpdate", "status")
	})

	View("default", func() {
		Attribute("lastUpdate")
		Attribute("entityType")
		Attribute("id")
		Attribute("nodes")
		Attribute("modules")
		Attribute("status")
		Required("id", "entityType", "lastUpdate", "status")
	})
})

var EntityNode = MediaType("application/vnd.aerospike.amc.entity.node.response+json", func() {
	Description("Node Entity")
	Attributes(func() {
		Attribute("lastUpdate", Integer, "Last Update Of This Entity in Unix Seconds")
		Attribute("entityType", String, "Type")
		Attribute("host", String, "Network Host Address", func() { Example("127.0.0.1:3000") })
		Attribute("id", String, "Node Id", func() { Example("BB9EB6C71290C00") })

		Attribute("namespaces", ArrayOf(EntityNamespace), "Namespaces")

		Required("host", "id", "entityType", "lastUpdate")
	})

	View("default", func() {
		Attribute("lastUpdate")
		Attribute("entityType")
		Attribute("host")
		Attribute("id")
		Attribute("namespaces")
		Required("host", "id", "entityType", "lastUpdate")
	})
})

var EntityNamespace = MediaType("application/vnd.aerospike.amc.entity.namespace.response+json", func() {
	Description("Namespace Entity")
	Attributes(func() {
		Attribute("lastUpdate", Integer, "Last Update Of This Entity in Unix Seconds")
		Attribute("entityType", String, "Type")
		Attribute("name", String, "Namespace Name", func() { Example("Test") })

		Attribute("sets", ArrayOf(EntitySet), "Namespaces")

		Required("name", "entityType", "lastUpdate")
	})

	View("default", func() {
		Attribute("lastUpdate")
		Attribute("entityType")
		Attribute("name")
		Attribute("sets")
		Required("name", "entityType", "lastUpdate")
	})
})

var EntitySet = MediaType("application/vnd.aerospike.amc.entity.set.response+json", func() {
	Description("Set Entity")
	Attributes(func() {
		Attribute("lastUpdate", Integer, "Last Update Of This Entity in Unix Seconds")
		Attribute("entityType", String, "Type")
		Attribute("name", String, "Set Name", func() { Example("Customers") })

		Attribute("indexes", ArrayOf(EntityIndex), "Indexes")

		Required("name", "entityType", "lastUpdate")
	})

	View("default", func() {
		Attribute("lastUpdate")
		Attribute("entityType")
		Attribute("name")
		Attribute("indexes")
		Required("name", "entityType", "lastUpdate")
	})
})

var EntityIndex = MediaType("application/vnd.aerospike.amc.entity.index.response+json", func() {
	Description("Index Entity")
	Attributes(func() {
		Attribute("lastUpdate", Integer, "Last Update Of This Entity in Unix Seconds")
		Attribute("entityType", String, "Type")
		Attribute("name", String, "Set Name", func() { Example("idx_test_customers_id") })

		Attribute("binName", String, "Bin Name", func() { Example("id") })
		Attribute("type", String, "Index Type", func() { Example("NUMERIC") })

		Required("name", "binName", "type", "entityType", "lastUpdate")
	})

	View("default", func() {
		Attribute("lastUpdate")
		Attribute("entityType")
		Attribute("name")
		Attribute("binName")
		Attribute("type")
		Required("name", "binName", "type", "entityType", "lastUpdate")
	})
})

var EntityModule = MediaType("application/vnd.aerospike.amc.entity.module.response+json", func() {
	Description("Module Entity")
	Attributes(func() {
		Attribute("lastUpdate", Integer, "Last Update Of This Entity in Unix Seconds")
		Attribute("entityType", String, "Type")
		Attribute("name", String, "Module Name", func() { Example("map_reduce.lua") })

		Attribute("hash", String, "Module Hash", func() { Example("06508300d1dc7e308ce8998bb4fe7a12505aa1f9") })
		Attribute("type", String, "Module Type", func() { Example("lua") })

		Required("name", "hash", "type", "entityType", "lastUpdate")
	})

	View("default", func() {
		Attribute("lastUpdate")
		Attribute("entityType")
		Attribute("name")
		Attribute("hash")
		Attribute("type")
		Required("name", "hash", "type", "entityType", "lastUpdate")
	})
})
