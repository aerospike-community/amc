package middleware

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/citrusleaf/amc/app"
	jwtgo "github.com/dgrijalva/jwt-go"
	"github.com/goadesign/goa"
	"github.com/goadesign/goa/middleware/security/jwt"
)

var pubKeys = [...]string{
	`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsCl/3TZSdNCfB8kcfcQx
gKN5Kl6MVRfQntPrX1rZdITdEbAcFUDFUVlMGSNX21XB0bqa4UmYtDKAasEG/uW8
EFM+/nvHEpErT3AXp/KblClVYjfOjsJMnksR4vpUed0pdlDthPY4LEOVBE9ZicQI
KA8yoyQrbkl6/Y3NBSRYIyVmI/UVDBCQC6pKl1NQoeTZp2hiFD6HgFrpz7lUQker
nCxQbPOuwR01IHUd2HcwdzQ1KpykjpvxvZIMmAlS5xlxUe4uELOpdSRx5oEpM3Ki
u51zEZ8l16REUTzuI+jBgvs59ITts2UCuOWQyqKjltxUxa2PYcFgyu5p1PnaVFVh
vwIDAQAB
-----END PUBLIC KEY-----`,
}

// NewJWTMiddleware creates a middleware that checks for the presence of a JWT Authorization header
// and validates its content. A real app would probably use goa's JWT security middleware instead.
//
// Note: the code below assumes the example is compiled against the master branch of goa.
// If compiling against goa v1 the call to jwt.New needs to be:
//
//    middleware := jwt.New(keys, ForceFail(), app.NewJWTSecurity())
func NewJWTMiddleware(logger goa.LogAdapter) (goa.Middleware, error) {
	keys, err := LoadJWTPublicKeys()
	if err != nil {
		return nil, err
	}
	return jwt.New(jwt.NewSimpleResolver(keys), SpecializeContext(logger), app.NewJWTSecurity()), nil
}

// LoadJWTPublicKeys loads PEM encoded RSA public keys used to validata and decrypt the JWT.
func LoadJWTPublicKeys() ([]jwt.Key, error) {
	keys := make([]jwt.Key, len(pubKeys))
	for i, pem := range pubKeys {
		key, err := jwtgo.ParseRSAPublicKeyFromPEM([]byte(pem))
		if err != nil {
			return nil, fmt.Errorf("failed to load public key: %s", err)
		}
		keys[i] = key
	}
	if len(keys) == 0 {
		return nil, fmt.Errorf("couldn't load public keys for JWT security")
	}

	return keys, nil
}

// SpecializeContext is a middleware illustrating the use of validation middleware with JWT auth.  It checks
// for the presence of a "fail" query string and fails validation if set to the value "true".
func SpecializeContext(logger goa.LogAdapter) goa.Middleware {
	errValidationFailed := goa.NewErrorClass("validation_failed", 401)
	specializeContext := func(h goa.Handler) goa.Handler {
		return func(ctx context.Context, rw http.ResponseWriter, req *http.Request) error {
			username, amcRoles, err := userInfoFromJWTToken(ctx)
			if err != nil {
				return errValidationFailed("JWT middleware: username not found")
			}

			ctx = context.WithValue(ctx, "username", username)
			ctx = context.WithValue(ctx, "roles", amcRoles)
			return h(ctx, rw, req)
		}
	}
	fm, _ := goa.NewMiddleware(specializeContext)
	return fm
}

// Show runs the show action.
func userInfoFromJWTToken(ctx context.Context) (string, []string, error) {
	token := jwt.ContextJWT(ctx)
	claims := token.Claims.(jwtgo.MapClaims)
	username, ok := claims["username"].(string)
	if !ok {
		return "", nil, errors.New("token not found")
	}
	amcRolesIfc, ok := claims["roles"].([]interface{})
	if !ok {
		return "", nil, errors.New("token not found")
	}

	var amcRoles = []string{}
	for _, role := range amcRolesIfc {
		amcRoles = append(amcRoles, role.(string))
	}

	return username, amcRoles, nil
}
