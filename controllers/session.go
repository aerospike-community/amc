package controllers

import (
	"errors"
	"net/http"
	"time"

	// . "github.com/ahmetalpbalkan/go-linq"
	"github.com/labstack/echo"
	"github.com/satori/go.uuid"

	"github.com/citrusleaf/amc/common"
)

func sessionId(c echo.Context) (string, error) {
	cookie, err := c.Cookie("session")
	if err != nil || cookie.Value == "" {
		return "", errors.New("Invalid session")
	}

	return cookie.Value, nil
}

func manageSession(c echo.Context) string {
	cookie, err := c.Cookie("session")
	if err != nil || cookie.Value == "" {
		return setSession(c)
	}

	if !_observer.SessionExists(cookie.Value) {
		return setSession(c)
	}

	return cookie.Value
}

func invalidateSession(c echo.Context) {
	cookie := new(http.Cookie)
	cookie.Name = "session"
	cookie.Value = ""
	cookie.Expires = time.Unix(0, 0).Add(time.Duration(-1 * time.Hour))
	c.SetCookie(cookie)
}

func setSession(c echo.Context) string {
	sid := "00000000-0000-0000-0000-000000000000"
	// commonity version is single-session
	if common.AMCIsEnterprise() {
		sid = uuid.NewV4().String()
	}

	cookie, err := c.Cookie("session")
	if err != nil {
		cookie = new(http.Cookie)
	}
	cookie.Value = sid
	cookie.Path = "/"
	cookie.HttpOnly = true
	// cookie.Expires = time.Now().Add(24 * time.Hour)
	c.SetCookie(cookie)

	return sid
}
