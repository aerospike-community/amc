package sessions

import (
	"errors"
	"log"
	"net/http"

	"github.com/gorilla/context"
	"github.com/gorilla/sessions"
	"github.com/labstack/echo/v4"
)

const (
	DefaultKey  = "session_key"
	errorFormat = "[sessions] ERROR! %s\n"
)

var (
	ErrDefaultSessionMiddlewareNotRegistered = errors.New("Default session middleware not registered")
)

type Store interface {
	sessions.Store
	Options(Options)
}

// Options stores configuration for a session or session store.
// Fields are a subset of http.Cookie fields.
type Options struct {
	Path   string
	Domain string
	// MaxAge=0 means no 'Max-Age' attribute specified.
	// MaxAge<0 means delete cookie now, equivalently 'Max-Age: 0'.
	// MaxAge>0 means Max-Age attribute present and given in seconds.
	MaxAge   int
	Secure   bool
	HttpOnly bool
}

// Session stores the values and optional configuration for a session.
// Wraps thinly gorilla-session methods.
type Session interface {
	// Get returns the session value associated to the given key.
	Get(key interface{}) interface{}
	// Set sets the session value associated to the given key.
	Set(key interface{}, val interface{})
	// Delete removes the session value associated to the given key.
	Delete(key interface{})
	// Clear deletes all values in the session.
	Clear()
	// AddFlash adds a flash message to the session.
	// A single variadic argument is accepted, and it is optional: it defines the flash key.
	// If not defined "_flash" is used by default.
	AddFlash(value interface{}, vars ...string)
	// Flashes returns a slice of flash messages from the session.
	// A single variadic argument is accepted, and it is optional: it defines the flash key.
	// If not defined "_flash" is used by default.
	Flashes(vars ...string) []interface{}
	// Options sets confuguration for a session.
	Options(Options)
	// Save saves all sessions used during the current request.
	Save() error
}

func Sessions(name string, store Store) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			request := c.Request()

			// w := c.Response().Writer
			// allow cross domain AJAX requests
			// w.Header().Set("Access-Control-Allow-Credentials", "true")
			// w.Header().Set("Access-Control-Allow-Methods", "GET")
			// w.Header().Set("Access-Control-Allow-Origin", "*")
			// w.Header().Set("Access-Control-Max-Age", "10")
			// w.Header().Set("Cache-Control", "must-revalidate, post-check=0, pre-check=0")

			s := &session{name: name, request: request, store: store, session: nil, hasChanged: false, writer: c.Response().Writer}
			c.Set(DefaultKey, s)

			defer context.Clear(request)
			return next(c)
		}
	}
}

type session struct {
	name       string
	request    *http.Request
	store      Store
	session    *sessions.Session
	hasChanged bool
	writer     http.ResponseWriter
}

func (s *session) Get(key interface{}) interface{} {
	return s.Session().Values[key]
}

func (s *session) Set(key interface{}, val interface{}) {
	s.Session().Values[key] = val
	s.hasChanged = true
}

func (s *session) Delete(key interface{}) {
	delete(s.Session().Values, key)
	s.hasChanged = true
}

func (s *session) Clear() {
	for key := range s.Session().Values {
		s.Delete(key)
	}
}

func (s *session) AddFlash(value interface{}, vars ...string) {
	s.Session().AddFlash(value, vars...)
	s.hasChanged = true
}

func (s *session) Flashes(vars ...string) []interface{} {
	s.hasChanged = true
	return s.Session().Flashes(vars...)
}

func (s *session) Options(options Options) {
	s.Session().Options = &sessions.Options{
		Path:     options.Path,
		Domain:   options.Domain,
		MaxAge:   options.MaxAge,
		Secure:   options.Secure,
		HttpOnly: options.HttpOnly,
	}

	s.hasChanged = true
}

func (s *session) Save() error {
	if s.HasChanged() {
		e := s.Session().Save(s.request, s.writer)
		if e == nil {
			s.hasChanged = false
		}
		return e
	}
	return nil
}

func (s *session) Session() *sessions.Session {
	if s.session == nil {
		var err error
		s.session, err = s.store.Get(s.request, s.name)
		if err != nil {
			log.Printf(errorFormat, err)
		}
	}
	return s.session
}

func (s *session) HasChanged() bool {
	return s.hasChanged
}

// Default - shortcut to get session
func Default(c echo.Context) Session {
	ses, ok := c.Get(DefaultKey).(Session)
	if !ok {
		c.Error(ErrDefaultSessionMiddlewareNotRegistered)
	}
	return ses
}
