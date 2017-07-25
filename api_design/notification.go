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
		Security(JWT, func() {
			Scope("api:enterprise")
		})

		Description("Returns the notifications for the cluster.")
		Routing(GET(""))
		Params(func() {
			Param("lastId", Integer, "Last Notification ID the client has")
		})

		Response(OK, ArrayOf(NotificationResponseMedia))
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

})

var NotificationResponseMedia = MediaType("application/vnd.aerospike.amc.notification.response+json", func() {
	Description("Notification")

	Attributes(func() {
		Attribute("id", String, "Notification ID")
		Attribute("connId", String, "Cluster ID")
		Attribute("desc", String, "Notification Description")
		Attribute("status", String, "Status")
		Attribute("type", String, "Notification Type")
		Attribute("lastOccured", Integer, "Last Occured Time")

		Required("id", "connId", "desc", "status", "type", "lastOccured")
	})

	View("default", func() {
		Attribute("id", String, "Notification ID")
		Attribute("connId", String, "Cluster ID")
		Attribute("desc", String, "Notification Description")
		Attribute("status", String, "Status")
		Attribute("type", String, "Notification Type")
		Attribute("lastOccured", Integer, "Last Occured Time")

		Required("id", "connId", "desc", "status", "type", "lastOccured")
	})

})
