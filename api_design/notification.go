package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("notification", func() {
	BasePath("notifications")
	Parent("connection")
	Description("Alert Endpoints")

	Security(JWT, func() {
		Scope("api:enterprise")
	})

	// Action("show", func() {
	// 	Description("Get a cluster's nodes")
	// 	Routing(GET(":node"))
	// 	Params(func() {
	// 		Param("node", String, "Node Addresses", func() {
	// 			Example("127.0.0.1:3000,127.0.0.2:3000")
	// 		})

	// 		Required("node")
	// 	})

	// 	Response(OK, HashOf(String, NodeResponseMedia))
	// 	Response(BadRequest, String)
	// 	Response(Unauthorized)
	// 	Response(InternalServerError)
	// })

	Action("query", func() {
		Description("Returns the notifications for the cluster.")
		Routing(GET(""))
		Params(func() {
			Param("lastId", Integer, "Last Notification ID the client has")
		})

		Response(OK, NotificationResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

})

// Notification describes a single node connection info
var Notification = Type("Notification", func() {
	Description("Notification Data type")

	Member("id", String, "Notification ID")
	Member("connId", String, "Cluster ID")
	Member("desc", String, "Notification Description")
	Member("status", String, "Status")
	Member("type", String, "Notification Type")
	Member("lastOccured", Integer, "Last Occured Time")

	Required("id", "connId", "desc", "status", "type", "lastOccured")

})

var NotificationResponseMedia = MediaType("application/vnd.aerospike.amc.notification.response+json", func() {
	Description("Notification")

	Attributes(func() {
		Attribute("unresolvedCount", Integer, "UnresolvedNotification Count")
		Attribute("notifications", ArrayOf(Notification), "Notifications")

		Required("unresolvedCount", "notifications")
	})

	View("default", func() {
		Attribute("unresolvedCount")
		Attribute("notifications")

		Required("unresolvedCount", "notifications")
	})

})
