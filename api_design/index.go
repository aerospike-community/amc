package design

import (
	. "github.com/goadesign/goa/design"
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("index", func() {
	BasePath("indexes")
	Parent("connection")
	Description("Index Endpoints")

	Security(JWT, func() {
		Scope("api:general")
	})

	Action("query", func() {
		Description("Query a cluster's indexes")
		Routing(GET(""))

		Params(func() {
			Member("includeStats", Boolean, "Index stats should be included in the results", func() { Example(false) })

			Required("includeStats")
		})

		Response(OK, IndexWrapperResponseMedia)
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("show", func() {
		Description("Get a index")
		Routing(GET(":name"))

		Response(OK, IndexWrapperResponseMedia)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("save", func() {
		Description("Save a index in the cluster")
		Routing(POST(""))

		Payload(func() {
			Member("indexName", String, "Index's Name", func() {
				Example("idxAccounts")
			})
			Member("namespace", String, "Index's Namespace")
			Member("setName", String, "Index's Set name")
			Member("binName", String, "Index's Bin name")
			Member("type", String, "Index's type", func() {
				Example("NUMERIC")
				Pattern("(?i)[NUMERIC|STRING]")
			})

			Required("indexName", "namespace", "setName", "binName", "type")
		})

		Response(NoContent)
		Response(BadRequest, String)
		Response(Forbidden)
		Response(Unauthorized)
		Response(InternalServerError)
	})

	Action("drop", func() {
		Description("Drop a index from the cluster")
		Routing(DELETE(":name"))

		Params(func() {
			Member("name", String, "Index's Name", func() { Example("idxIndexName") })

			Required("name")
		})

		Payload(func() {
			Member("namespace", String, "Index's Namespace", func() { Example("test") })
			Member("setName", String, "Index's Set Name", func() { Example("test") })

			Required("namespace", "setName")
		})

		Response(NoContent)
		Response(BadRequest, String)
		Response(Unauthorized)
		Response(InternalServerError)
	})
})

// e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes/:sindex/nodes/:node/allstats", sessionValidator(getClusterNamespaceSindexNodeAllStats))
// e.POST("/aerospike/service/clusters/:clusterUuid/namespace/:namespace/add_index", sessionValidator(postClusterAddIndex))
// e.POST("/aerospike/service/clusters/:clusterUuid/namespace/:namespace/drop_index", sessionValidator(postClusterDropIndex))
