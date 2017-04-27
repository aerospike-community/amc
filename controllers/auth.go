package controllers

import (
	"crypto/rsa"
	"fmt"
	"time"

	jwtgo "github.com/dgrijalva/jwt-go"
	"github.com/goadesign/goa"
	"github.com/satori/go.uuid"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/models"
)

const privKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEAsCl/3TZSdNCfB8kcfcQxgKN5Kl6MVRfQntPrX1rZdITdEbAc
FUDFUVlMGSNX21XB0bqa4UmYtDKAasEG/uW8EFM+/nvHEpErT3AXp/KblClVYjfO
jsJMnksR4vpUed0pdlDthPY4LEOVBE9ZicQIKA8yoyQrbkl6/Y3NBSRYIyVmI/UV
DBCQC6pKl1NQoeTZp2hiFD6HgFrpz7lUQkernCxQbPOuwR01IHUd2HcwdzQ1Kpyk
jpvxvZIMmAlS5xlxUe4uELOpdSRx5oEpM3Kiu51zEZ8l16REUTzuI+jBgvs59ITt
s2UCuOWQyqKjltxUxa2PYcFgyu5p1PnaVFVhvwIDAQABAoIBABdaaQj6WpQB1BNE
JfLGP4m+IiHrxs7BCXcEwP8zHADGXEgsAI0QuRe/rsbmWI9LHxaelkmnaAb7auq8
DCFecz/2yTMTVaCwff1Z7sjk8JsDn74Vh9yFBYM2kHh2lxxQpV55/ALUYT3895RK
sKQCyNIGsb/O27MTKqrSUYuM9eIyqrf0o/dUOYuCKtEEkLRCI7zOlT/gQGHAe4cE
F0tv68rnyJQw1RiQg52zwd6u5+mKKGWUUgZlXzlbxzJ41UYGGenDy0+j12rNzy8H
Op2bpcKXxIJVMytSGOaRqRdiokLqBJW9RhRWZd1rk022qYFy6nX+uB/uv6STsVNA
So1muoECgYEA16pitqqv5xhVA2k7gF+6LsF4bmNyvP+ct1NehlXNAVzddr7NKA2F
k4QPLfEadH40yDUAbaVcucLxjMs11FtCoi10vK1wPhgDnRZ2mAGMVb24gcHNKil6
xTV74aauOcpsCgMLL+49TOcqlSoKwLJz5LtUqukt73/+mksySmFVL30CgYEA0RvF
Z+2hOTk8GsT6D6UWoYAI4OC47NwuAx6L4q6BhhkDyUxIMoFz6cvMQWS/EvFkuzqK
Ezx5/CRDIoDryCB70fmjuWtNlVz5Z//w0w5bH1AAE+bfBZDG1ostflCQ/l006x41
gOes1NKhgMZ8zPdfIQt9uKpY/qGWD3OS0va8EusCgYBW2/XT8hzUa1VaAVkIlAVt
bVhuxTjh6+UXZMluO0JM6TT87U29cuy4g/iFHVT1VBs4Azi/8FjPLDeS6AkvFO5a
WQpqL0REjfFupCxxfjYiFj4obICQGZKruKXDNRl4hxFKWv13eXFQ9s2MtBkOkRDi
L5yjFTT9/8PwKpb/pAHmFQKBgApKPI+dsPZY661BjjCg5hkybL1sMY1uVFFQ+n9A
KR2JM5d/Sno5xpN1tOpu47wx5swT2GGT80jGHAuhnnitqIovp6/jKOE1vwwwGxC3
vyIuVKKmFMl4U2CRXr69hjUOLyF2zhk2zVl3t/zXR6LqdWLx5tDkiRaWqwS9ojcB
b0XbAoGAFnr6DbfqmQEA+VhtnZhiE1WQ2w7pfEulSIZx9fMm0Rg8wIbbRPS6J+hL
6vdtfTHj9PsiOkMxhU63adFyPvJOKHb9TKjCPZslqabQ86Bbe6OMf6J5TFHOjneR
DH3EwmYIUjM9+UXGPRfMadju9rBd1dZP/D64G/3hxipO3YOkdBw=
-----END RSA PRIVATE KEY-----`

// AuthController implements the auth resource.
type AuthController struct {
	*goa.Controller

	privateKey *rsa.PrivateKey
}

// NewAuthController creates a auth controller.
func NewAuthController(service *goa.Service) *AuthController {
	privKey, err := jwtgo.ParseRSAPrivateKeyFromPEM([]byte(privKey))
	if err != nil {
		service.LogError("jwt: failed to load private key: %s", err)
		return nil
	}

	return &AuthController{
		Controller: service.NewController("AuthController"),
		privateKey: privKey,
	}
}

// Authenticate runs the authenticate action.
func (c *AuthController) Authenticate(ctx *app.AuthenticateAuthContext) error {
	username := ctx.Payload.User
	password := ctx.Payload.Password

	user, err := models.LoginUser(username, password)
	if err != nil {
		return ctx.Unauthorized()
	}

	if user == nil {
		return ctx.Forbidden()
	}

	// Generate JWT
	token := jwtgo.New(jwtgo.SigningMethodRS512)
	in24h := time.Now().Add(24 * time.Hour).Unix()
	token.Claims = jwtgo.MapClaims{
		"iss":      "Aerospike",                                 // who creates the token and signs it
		"aud":      "Aerospike AMC Client",                      // to whom the token is intended to be sent
		"exp":      in24h,                                       // time when the token will expire (10 minutes from now)
		"jti":      uuid.NewV4().String(),                       // a unique identifier for the token
		"iat":      time.Now().Unix(),                           // when the token was issued/created (now)
		"nbf":      2,                                           // time before which the token is not yet valid (2 minutes ago)
		"sub":      "AMC Client Authentication",                 // the subject/principal is whom the token is about
		"scopes":   []interface{}{"api:cluster", "api:general"}, // token scope - not a standard claim
		"username": username,                                    // username - not a standard claim
		"roles":    user.Roles,                                  // roles - not a standard claim
	}

	signedToken, err := token.SignedString(c.privateKey)
	if err != nil {
		return fmt.Errorf("failed to sign token: %s", err) // internal error
	}

	// Set auth header for client retrieval
	ctx.ResponseData.Header().Set("Authorization", "Bearer "+signedToken)

	// AuthController_Authenticate: end_implement
	return ctx.NoContent()
}

// Logout runs the logout action.
func (c *AuthController) Logout(ctx *app.LogoutAuthContext) error {
	// AuthController_Logout: start_implement

	ctx.ResponseData.Header().Set("Authorization", "")

	// AuthController_Logout: end_implement
	return ctx.NoContent()
}
