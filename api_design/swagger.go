package design

import (
	. "github.com/goadesign/goa/design/apidsl"
)

var _ = Resource("swagger", func() {
	Origin("*", func() {
		Methods("GET") // Allow all origins to retrieve the Swagger JSON (CORS)
	})
	Files("/swagger.json", "swagger/swagger.json")
})

var _ = Resource("public", func() {
	Origin("*", func() {
		Methods("GET", "OPTIONS")
	})
	Files("/*filepath", "static_v5/")
})

// var _ = Resource("js", func() {
// 	Origin("*", func() {
// 		Methods("GET", "OPTIONS")
// 	})
// 	Files("/swagger", "static/swagger")
// })
