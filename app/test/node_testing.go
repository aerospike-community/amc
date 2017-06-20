// Code generated by goagen v1.2.0-dirty, DO NOT EDIT.
//
// API "amc": node TestHelpers
//
// Command:
// $ goagen
// --design=github.com/citrusleaf/amc/api_design
// --out=$(GOPATH)/src/github.com/citrusleaf/amc/temp
// --version=v1.2.0-dirty

package test

import (
	"bytes"
	"context"
	"fmt"
	"github.com/citrusleaf/amc/temp/app"
	"github.com/goadesign/goa"
	"github.com/goadesign/goa/goatest"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
)

// LatencyNodeBadRequest runs the method Latency of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func LatencyNodeBadRequest(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/latency", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	latencyCtx, _err := app.NewLatencyNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Latency(latencyCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 400 {
		t.Errorf("invalid response status code: got %+v, expected 400", rw.Code)
	}

	// Return results
	return rw
}

// LatencyNodeInternalServerError runs the method Latency of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func LatencyNodeInternalServerError(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/latency", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	latencyCtx, _err := app.NewLatencyNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Latency(latencyCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 500 {
		t.Errorf("invalid response status code: got %+v, expected 500", rw.Code)
	}

	// Return results
	return rw
}

// LatencyNodeNotImplemented runs the method Latency of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func LatencyNodeNotImplemented(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/latency", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	latencyCtx, _err := app.NewLatencyNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Latency(latencyCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 501 {
		t.Errorf("invalid response status code: got %+v, expected 501", rw.Code)
	}

	// Return results
	return rw
}

// LatencyNodeOK runs the method Latency of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func LatencyNodeOK(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/latency", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	latencyCtx, _err := app.NewLatencyNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Latency(latencyCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 200 {
		t.Errorf("invalid response status code: got %+v, expected 200", rw.Code)
	}

	// Return results
	return rw
}

// LatencyNodeUnauthorized runs the method Latency of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func LatencyNodeUnauthorized(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/latency", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	latencyCtx, _err := app.NewLatencyNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Latency(latencyCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 401 {
		t.Errorf("invalid response status code: got %+v, expected 401", rw.Code)
	}

	// Return results
	return rw
}

// ShowNodeBadRequest runs the method Show of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func ShowNodeBadRequest(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	u := &url.URL{
		Path: fmt.Sprintf("/api/v1/connections/%v/nodes/%v", connID, node),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	showCtx, _err := app.NewShowNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Show(showCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 400 {
		t.Errorf("invalid response status code: got %+v, expected 400", rw.Code)
	}

	// Return results
	return rw
}

// ShowNodeInternalServerError runs the method Show of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func ShowNodeInternalServerError(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	u := &url.URL{
		Path: fmt.Sprintf("/api/v1/connections/%v/nodes/%v", connID, node),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	showCtx, _err := app.NewShowNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Show(showCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 500 {
		t.Errorf("invalid response status code: got %+v, expected 500", rw.Code)
	}

	// Return results
	return rw
}

// ShowNodeOK runs the method Show of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func ShowNodeOK(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	u := &url.URL{
		Path: fmt.Sprintf("/api/v1/connections/%v/nodes/%v", connID, node),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	showCtx, _err := app.NewShowNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Show(showCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 200 {
		t.Errorf("invalid response status code: got %+v, expected 200", rw.Code)
	}

	// Return results
	return rw
}

// ShowNodeUnauthorized runs the method Show of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func ShowNodeUnauthorized(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	u := &url.URL{
		Path: fmt.Sprintf("/api/v1/connections/%v/nodes/%v", connID, node),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	showCtx, _err := app.NewShowNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Show(showCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 401 {
		t.Errorf("invalid response status code: got %+v, expected 401", rw.Code)
	}

	// Return results
	return rw
}

// ThroughputNodeBadRequest runs the method Throughput of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func ThroughputNodeBadRequest(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/throughput", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	throughputCtx, _err := app.NewThroughputNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Throughput(throughputCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 400 {
		t.Errorf("invalid response status code: got %+v, expected 400", rw.Code)
	}

	// Return results
	return rw
}

// ThroughputNodeInternalServerError runs the method Throughput of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func ThroughputNodeInternalServerError(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/throughput", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	throughputCtx, _err := app.NewThroughputNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Throughput(throughputCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 500 {
		t.Errorf("invalid response status code: got %+v, expected 500", rw.Code)
	}

	// Return results
	return rw
}

// ThroughputNodeOK runs the method Throughput of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers and the media type struct written to the response.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func ThroughputNodeOK(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) (http.ResponseWriter, *app.AerospikeAmcThroughputWrapperResponse) {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/throughput", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	throughputCtx, _err := app.NewThroughputNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Throughput(throughputCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 200 {
		t.Errorf("invalid response status code: got %+v, expected 200", rw.Code)
	}
	var mt *app.AerospikeAmcThroughputWrapperResponse
	if resp != nil {
		var ok bool
		mt, ok = resp.(*app.AerospikeAmcThroughputWrapperResponse)
		if !ok {
			t.Fatalf("invalid response media: got %+v, expected instance of app.AerospikeAmcThroughputWrapperResponse", resp)
		}
		_err = mt.Validate()
		if _err != nil {
			t.Errorf("invalid response media type: %s", _err)
		}
	}

	// Return results
	return rw, mt
}

// ThroughputNodeUnauthorized runs the method Throughput of the given controller with the given parameters.
// It returns the response writer so it's possible to inspect the response headers.
// If ctx is nil then context.Background() is used.
// If service is nil then a default service is created.
func ThroughputNodeUnauthorized(t goatest.TInterface, ctx context.Context, service *goa.Service, ctrl app.NodeController, connID string, node string, from *int, until *int) http.ResponseWriter {
	// Setup service
	var (
		logBuf bytes.Buffer
		resp   interface{}

		respSetter goatest.ResponseSetterFunc = func(r interface{}) { resp = r }
	)
	if service == nil {
		service = goatest.Service(&logBuf, respSetter)
	} else {
		logger := log.New(&logBuf, "", log.Ltime)
		service.WithLogger(goa.NewLogger(logger))
		newEncoder := func(io.Writer) goa.Encoder { return respSetter }
		service.Encoder = goa.NewHTTPEncoder() // Make sure the code ends up using this decoder
		service.Encoder.Register(newEncoder, "*/*")
	}

	// Setup request context
	rw := httptest.NewRecorder()
	query := url.Values{}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		query["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		query["until"] = sliceVal
	}
	u := &url.URL{
		Path:     fmt.Sprintf("/api/v1/connections/%v/nodes/%v/throughput", connID, node),
		RawQuery: query.Encode(),
	}
	req, err := http.NewRequest("GET", u.String(), nil)
	if err != nil {
		panic("invalid test " + err.Error()) // bug
	}
	prms := url.Values{}
	prms["connId"] = []string{fmt.Sprintf("%v", connID)}
	prms["node"] = []string{fmt.Sprintf("%v", node)}
	if from != nil {
		sliceVal := []string{strconv.Itoa(*from)}
		prms["from"] = sliceVal
	}
	if until != nil {
		sliceVal := []string{strconv.Itoa(*until)}
		prms["until"] = sliceVal
	}
	if ctx == nil {
		ctx = context.Background()
	}
	goaCtx := goa.NewContext(goa.WithAction(ctx, "NodeTest"), rw, req, prms)
	throughputCtx, _err := app.NewThroughputNodeContext(goaCtx, req, service)
	if _err != nil {
		panic("invalid test data " + _err.Error()) // bug
	}

	// Perform action
	_err = ctrl.Throughput(throughputCtx)

	// Validate response
	if _err != nil {
		t.Fatalf("controller returned %+v, logs:\n%s", _err, logBuf.String())
	}
	if rw.Code != 401 {
		t.Errorf("invalid response status code: got %+v, expected 401", rw.Code)
	}

	// Return results
	return rw
}