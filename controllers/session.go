package controllers

import (
	"errors"
	"net/http"

	log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	uuid "github.com/satori/go.uuid"

	"github.com/aerospike-community/amc/common"
	"github.com/aerospike-community/amc/controllers/middleware/sessions"
)

func sessionValidator(f func(c echo.Context) error) func(c echo.Context) error {
	return func(c echo.Context) error {
		sid, err := sessionId(c)
		if err != nil || !_observer.SessionExists(sid) {
			invalidateSession(c)
			return c.JSON(http.StatusUnauthorized, errorMap("invalid session : None"))
		}

		return f(c)
	}
}

func sessionId(c echo.Context) (string, error) {
	session := sessions.Default(c)
	id := session.Get("id")

	if id == nil || id.(string) == "" {
		return "", errors.New("Invalid session")
	}

	return id.(string), nil
}

func manageSession(c echo.Context) string {
	id, err := sessionId(c)
	if err != nil || id == "" {
		return setSession(c)
	}

	if !_observer.SessionExists(id) {
		return setSession(c)
	}

	return id
}

func invalidateSession(c echo.Context) {
	session := sessions.Default(c)
	session.Clear()
	if err := session.Save(); err != nil {
		log.Error(err)
	}
}

func setSession(c echo.Context) string {
	sid := "00000000-0000-0000-0000-000000000000"
	// commonity version is single-session
	if common.AMCIsEnterprise() {
		sid = uuid.NewV4().String()
	}

	session := sessions.Default(c)
	session.Options(
		sessions.Options{
			Path: "/",
			// Domain:   options.Domain,
			// MaxAge:   30 * 60,
			Secure:   false,
			HttpOnly: true,
		})
	session.Clear()
	session.Set("id", sid)
	if err := session.Save(); err != nil {
		log.Error(err)
	}

	return sid
}
