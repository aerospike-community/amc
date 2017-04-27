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
		Required("id", "name")
	})

	View("default", func() {
		Attribute("id")
		Attribute("name")
		Attribute("seeds")
		Required("name")
	})
})
