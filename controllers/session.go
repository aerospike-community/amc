package controllers

import (
	"errors"

	// . "github.com/ahmetalpbalkan/go-linq"
	// log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"
	"github.com/satori/go.uuid"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/controllers/middleware/sessions"
)

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
		panic(err)
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
		panic(err)
	}

	return sid
}
