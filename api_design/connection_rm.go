package design

import (
	"math"

	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

// NodeSeed describes a single node connection info
var NodeSeed = Type("NodeSeed", func() {
	Member("host", String, "Node Host. Valid DNS, IPv4 or IPv6 value")
	Member("tlsName", String, "Node's TLS name")
	Member("port", Integer, "Node's port", func() {
		Minimum(0)
		Maximum(math.MaxInt16)
	})
	Required("name", "port")
})

var UserConnectionsResponseMedia = MediaType("application/vnd.aerospike.amc.connection.query.response+json", func() {
	Description("User Connection")
	Attributes(func() {
		Attribute("name", String, "Connection Name")
		Attribute("seeds", ArrayOf(NodeSeed), "Seeds")
	})

	View("default", func() {
		Attribute("name")
		Attribute("seeds")
	})
})
