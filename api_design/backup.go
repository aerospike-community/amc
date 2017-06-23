package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("backup", func() {
	BasePath("backups")
	Parent("connection")
	Description("Backup Endpoints")

	Security(JWT, func() {
		Scope("api:enterprise")
	})

	Action("query", func() {
		Description("Get a cluster's backups")
		Routing(GET(""))
		Params(func() {
		})

		Response(OK, ArrayOf(BackupResponseMedia))
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("show", func() {
		Description("Get a backup")
		Routing(GET(":backupId"))
		Params(func() {
			Param("backupId", String, "Backup Id", func() {
				Example("70f01ba5-b14f-47d9-8d69-c5b4e960d88b")
				Pattern(uuidv4Regex)
			})

			Required("backupId")
		})

		Response(OK, BackupResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("progress", func() {
		Description("Get current backup that is in-progress")
		Routing(GET("/progress"))
		Params(func() {
		})

		Response(OK, BackupResponseMedia)
		Response(NotFound)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("create", func() {
		Description("Create a backup for the cluster")
		Routing(POST(""))
		Params(func() {
		})

		Payload(func() {
			Member("namespace", String, "Namespace", func() { Example("test") })
			Member("destinationAddress", String, "Host on which the backup was created", func() { Example("127.0.0.1") })
			Member("destinationPath", String, "Directory where the backup was created", func() { Example("/tmp") })
			Member("sets", String, "Sets from which backup was created", func() { Example("test,bar") })
			Member("metadataOnly", Boolean, "Indicated whether the backup was created only for the metadata", func() { Example(false) })
			Member("terminateOnClusterChange", Boolean, "Indicates whether the backup was supposed to be terminated in case the cluster experienced a change in its nodes", func() { Example(false) })
			Member("scanPriority", Integer, "Prioity of the scan reading the data for the backup. 0 (auto), 1 (low), 2 (medium), 3 (high).", func() { Example(0) })
			Member("SSHUser", String, "SSH User", func() { Example("user") })
			Member("SSHPassword", String, "SSH user's password", func() { Example("pass") })

			Required("namespace", "destinationAddress", "destinationPath", "sets", "metadataOnly", "terminateOnClusterChange", "scanPriority", "SSHUser", "SSHPassword")
		})

		Response(OK, BackupResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

})

var BackupResponseMedia = MediaType("application/vnd.aerospike.amc.backup.response+json", func() {
	Description("Backup object")

	Attributes(func() {
		Attribute("id", String, "Backup Id")
		Attribute("clusterId", String, "Cluster Id")
		Attribute("namespace", String, "Namespace")
		Attribute("destinationAddress", String, "Host on which the backup was created")
		Attribute("destinationPath", String, "Directory where the backup was created")
		Attribute("sets", String, "Sets from which backup was created")
		Attribute("metadataOnly", Boolean, "Indicated whether the backup was created only for the metadata")
		Attribute("terminateOnClusterChange", Boolean, "Indicates whether the backup was supposed to be terminated in case the cluster experienced a change in its nodes")
		Attribute("scanPriority", Integer, "Prioity of the scan reading the data for the backup")
		Attribute("createDate", Integer, "The date when the backup was created")
		Attribute("finishDate", Integer, "The date when the backup was finished")
		Attribute("status", String, "Backup's status")
		Attribute("progress", Integer, "Backup's progress in percent")
		Attribute("error", String, "Error message in case the backup was not successful")

		Required("id", "clusterId", "namespace", "destinationAddress", "destinationPath", "metadataOnly", "terminateOnClusterChange", "scanPriority", "createDate", "status", "progress")
	})

	View("default", func() {
		Attribute("id")
		Attribute("clusterId")
		Attribute("namespace")
		Attribute("destinationAddress")
		Attribute("destinationPath")
		Attribute("sets")
		Attribute("metadataOnly")
		Attribute("terminateOnClusterChange")
		Attribute("scanPriority")
		Attribute("createDate")
		Attribute("finishDate")
		Attribute("status")
		Attribute("progress")
		Attribute("error")

		Required("id", "clusterId", "namespace", "destinationAddress", "destinationPath", "metadataOnly", "terminateOnClusterChange", "scanPriority", "createDate", "status", "progress")
	})
})
