package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("restore", func() {
	BasePath("restores")
	Parent("connection")
	Description("Restore Endpoints")

	Security(JWT, func() {
		Scope("api:enterprise")
	})

	Action("progress", func() {
		Description("Get current restore that is in-progress")
		Routing(GET("/progress"))
		Params(func() {
		})

		Response(OK, RestoreResponseMedia)
		Response(NotFound)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("create", func() {
		Description("Create a restore for the cluster")
		Routing(POST(""))
		Params(func() {
		})

		Payload(func() {
			Member("namespace", String, "Namespace", func() { Example("test") })
			Member("sourceAddress", String, "Host on which the backup file is located", func() { Example("127.0.0.1") })
			Member("sourcePath", String, "Host on which the backup file is located", func() { Example("/tmp") })
			Member("Threads", Integer, "Number of working threads.", func() { Example(0) })
			Member("SSHUser", String, "SSH User", func() { Example("user") })
			Member("SSHPassword", String, "SSH user's password", func() { Example("pass") })
			Member("MissingRecordsOnly", Boolean, "Indicates whether to restore records which do not exist on the cluster only", func() { Example(false) })
			Member("IgnoreGenerationNumber", Boolean, "Indicates whether the restore should only update records with smaller generation number", func() { Example(false) })

			Required("namespace", "sourceAddress", "sourcePath", "Threads", "SSHUser", "SSHPassword", "MissingRecordsOnly", "IgnoreGenerationNumber")
		})

		Response(OK, RestoreResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

})

var RestoreResponseMedia = MediaType("application/vnd.aerospike.amc.restore.response+json", func() {
	Description("Restore object")

	Attributes(func() {
		Attribute("id", String, "Restore Id")
		Attribute("clusterId", String, "Cluster Id")
		Attribute("namespace", String, "Namespace")
		Attribute("sourceAddress", String, "Host on which the backup file is located")
		Attribute("sourcePath", String, "Host on which the backup file is located")
		Attribute("Threads", Integer, "Number of working threads.")
		Attribute("SSHUser", String, "SSH User")
		Attribute("SSHPassword", String, "SSH user's password")
		Attribute("MissingRecordsOnly", Boolean, "Indicates whether to restore records which do not exist on the cluster only")
		Attribute("IgnoreGenerationNumber", Boolean, "Indicates whether the restore should only update records with smaller generation number")
		Attribute("createDate", Integer, "The date when the restore was created")
		Attribute("finishDate", Integer, "The date when the restore was finished")
		Attribute("status", String, "Restore's status")
		Attribute("progress", Integer, "Restore's progress in percent")
		Attribute("error", String, "Error message in case the restore was not successful")

		Required("id", "clusterId", "namespace", "sourceAddress", "sourcePath", "Threads", "SSHUser", "SSHPassword", "MissingRecordsOnly", "IgnoreGenerationNumber", "createDate", "status", "progress")
	})

	View("default", func() {
		Attribute("id")
		Attribute("clusterId")
		Attribute("namespace")
		Attribute("sourceAddress")
		Attribute("sourcePath")
		Attribute("Threads")
		Attribute("SSHUser")
		Attribute("SSHPassword")
		Attribute("MissingRecordsOnly")
		Attribute("IgnoreGenerationNumber")
		Attribute("createDate")
		Attribute("finishDate")
		Attribute("status")
		Attribute("progress")
		Attribute("error")

		Required("id", "clusterId", "namespace", "sourceAddress", "sourcePath", "Threads", "SSHUser", "SSHPassword", "MissingRecordsOnly", "IgnoreGenerationNumber", "createDate", "status", "progress")
	})
})
