package middleware

import (
	"context"
	"net/http"
	"strconv"
	"strings"

	"github.com/goadesign/goa"
)

// CacheMiddleware adds cache headers for resources
func CacheMiddleware(h goa.Handler) goa.Handler {
	return func(ctx context.Context, rw http.ResponseWriter, req *http.Request) error {
		if isCacheable(req) {
			age := strconv.Itoa(60 * 60 * 24 * 365) // a year from now
			rw.Header().Set("Cache-Control", "max-age="+age)

			// Webpack generates a hashed name for the cached resources. So if
			// a browser requests an Etag for the same cached resource we can be sure
			// that the file is still valid.
			//
			// In case of javascript resources --
			//   If any of the javascript resource changes then the Webpack build
			//   system generates a hashed name of the file (ex: app.ab123hcdsf.js),
			//   and inserts the hashed name in index.html. Since index.html is
			//   never cached we can be sure that if the browser requests an Etag for
			//   a javascript file, then the file is still valid.
			rw.Header().Set("Etag", "etag")
		} else {
			rw.Header().Set("Cache-Control", "no-store")
		}

		return h(ctx, rw, req)
	}
}

// isCacheable returns true iff the requested resource is cacheable
func isCacheable(req *http.Request) bool {
	// Webpack build system will generate hashed name for these file types.
	// CSS is excluded since it is bundled as javascript.
	types := []string{"js", "png", "jpg", "gif", "ttf", "eot", "svg", "woff", "woff2"}
	for i := 0; i < len(types); i++ {
		s := "." + types[i]
		if strings.HasSuffix(req.URL.Path, s) {
			return true
		}
	}

	return false
}
