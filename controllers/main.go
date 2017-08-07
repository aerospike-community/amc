package controllers

import (
	"compress/gzip"
	"context"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"time"

	"github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	"github.com/tylerb/graceful"

	"github.com/goadesign/goa"
	gmiddleware "github.com/goadesign/goa/middleware"
	gzm "github.com/goadesign/goa/middleware/gzip"

	"github.com/labstack/echo"
	"github.com/labstack/echo/middleware"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
	mw "github.com/citrusleaf/amc/controllers/middleware"
	"github.com/citrusleaf/amc/controllers/middleware/sessions"
	"github.com/citrusleaf/amc/models"
)

var (
	_observer            *models.ObserverT
	_defaultClientPolicy = as.NewClientPolicy()

	registerEnterpriseAPI func(*echo.Echo)

	_server *echo.Echo
)

func postSessionTerminate(c echo.Context) error {
	invalidateSession(c)
	return c.JSONBlob(http.StatusOK, []byte(`{"status": "success"}`))
}

func getDebug(c echo.Context) error {
	res := _observer.DebugStatus()
	if res.On {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":            "success",
			"debugging":         "ON",
			"initiator":         res.Initiator,
			"isOriginInitiator": res.Initiator == c.Request().RemoteAddr,
			"start_time":        res.StartTime.UnixNano() / 1e6, //1484923724160,
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":    "success",
		"debugging": "OFF",
		"initiator": nil,
	})
}

func postDebug(c echo.Context) error {
	form := struct {
		Service      string `form:"service"`
		DurationMins int    `form:"duration"`
		Username     string `form:"username"`
	}{}

	c.Bind(&form)

	var res models.DebugStatus
	switch form.Service {
	case "start":
		res = _observer.StartDebug(c.Request().RemoteAddr, time.Duration(form.DurationMins)*time.Minute)
	case "restart":
		res = _observer.StartDebug(c.Request().RemoteAddr, time.Duration(form.DurationMins)*time.Minute)
	case "stop":
		res = _observer.StopDebug()
	default:
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if res.On {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"status":     "success",
			"debugging":  "ON",
			"initiator":  res.Initiator,
			"start_time": res.StartTime.UnixNano() / 1e6, //1484923724160,
			"service":    form.Service,
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status":    "success",
		"debugging": "OFF",
		"initiator": nil,
		"service":   form.Service,
	})
}

func getAMCVersion(c echo.Context) error {
	return c.JSONBlob(http.StatusOK, []byte(fmt.Sprintf(`{"amc_version": "%s", "amc_type": "%s"}`, common.AMCVersion, common.AMCEdition)))
}

func ShutdownServer() {
	_server.Shutdown(_server.ShutdownTimeout)
}

func Server(config *common.Config) {
	_observer = models.New(config)

	_defaultClientPolicy.Timeout = time.Duration(config.AMC.Timeout) * time.Second
	if _defaultClientPolicy.Timeout <= 0 {
		_defaultClientPolicy.Timeout = 30 * time.Second
	}
	_defaultClientPolicy.LimitConnectionsToQueueSize = true
	_defaultClientPolicy.ConnectionQueueSize = 1

	e := echo.New()
	// Avoid stale connections
	e.ReadTimeout = 30 * time.Second
	e.WriteTimeout = 30 * time.Second

	store := sessions.NewCookieStore([]byte("amc-secret-key"))
	e.Use(sessions.Sessions("amc_session", store))

	if config.AMC.StaticPath == "" {
		logrus.Fatalln("No static dir has been set in the config file. Quiting...")
	}
	logrus.Infoln("Static files path is being set to:" + config.AMC.StaticPath)
	e.Static("/", config.AMC.StaticPath)
	e.Static("/static", config.AMC.StaticPath)

	// Middleware
	if !common.AMCIsProd() {
		// e.Logger.SetOutput(log.StandardLogger().Writer())
		// e.Use(middleware.Logger())
	} else {
		e.Use(middleware.Recover())
	}

	// Basic Authentication Middleware Setup
	basicAuthUser := os.Getenv("AMC_AUTH_USER")
	if basicAuthUser == "" {
		basicAuthUser = config.BasicAuth.User
	}

	basicAuthPassword := os.Getenv("AMC_AUTH_PASSWORD")
	if basicAuthPassword == "" {
		basicAuthPassword = config.BasicAuth.Password
	}

	if basicAuthUser != "" {
		e.Use(middleware.BasicAuth(func(username, password string, c echo.Context) bool {
			if username == basicAuthUser && password == basicAuthPassword {
				return true
			}
			return false
		}))
	}

	e.Use(middleware.GzipWithConfig(middleware.DefaultGzipConfig))
	// e.Use(middleware.CSRFWithConfig(middleware.DefaultCSRFConfig))
	e.Use(middleware.SecureWithConfig(middleware.DefaultSecureConfig))

	// Routes
	e.POST("/session-terminate", postSessionTerminate)

	e.GET("/aerospike/service/debug", getDebug)
	e.POST("/aerospike/service/clusters/:clusterUuid/debug", postDebug) // cluster does not matter here

	e.GET("/get_amc_version", getAMCVersion)
	e.GET("/get_current_monitoring_clusters", sessionValidator(getCurrentMonitoringClusters))

	e.POST("/set-update-interval/:clusterUuid", sessionValidator(setClusterUpdateInterval))
	e.GET("/aerospike/service/clusters/:clusterUuid", sessionValidator(getCluster))
	e.POST("/aerospike/service/clusters/:clusterUuid/logout", postRemoveClusterFromSession)

	e.GET("/aerospike/service/clusters/:clusterUuid/udfs", sessionValidator(getClusterUDFs))          //DONE
	e.POST("/aerospike/service/clusters/:clusterUuid/drop_udf", sessionValidator(postClusterDropUDF)) //DONE
	e.POST("/aerospike/service/clusters/:clusterUuid/add_udf", sessionValidator(postClusterAddUDF))   //DONE

	e.GET("/aerospike/service/clusters/:clusterUuid/throughput", sessionValidator(getClusterThroughput))                //DONE
	e.GET("/aerospike/service/clusters/:clusterUuid/throughput_history", sessionValidator(getClusterThroughputHistory)) //DONE
	e.GET("/aerospike/service/clusters/:clusterUuid/basic", sessionValidator(getClusterBasic))
	e.POST("/aerospike/service/clusters/:clusterUuid/add_node", sessionValidator(postAddClusterNodes)) //DONE
	// e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes", sessionValidator(getClusterNodes))
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allconfig", sessionValidator(getClusterNodeAllConfig)) //DONE
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:nodes/setconfig", sessionValidator(setClusterNodesConfig)) //DONE
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:node/switch_off", sessionValidator(postSwitchNodeOff))
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespaces", sessionValidator(getClusterNamespaces))                              //DONE
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:nodes", sessionValidator(getClusterNamespaceNodes))              //DONE
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/allconfig", sessionValidator(getClusterNamespaceAllConfig)) //DONE
	e.POST("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/setconfig", sessionValidator(setClusterNamespaceConfig))   //DONE

	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:node/allstats", sessionValidator(getClusterNodeAllStats))                                //DONE
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/nodes/:node/allstats", sessionValidator(getClusterNamespaceNodeAllStats)) //DONE
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:port/nodes/:node/allstats", sessionValidator(getClusterXdrNodeAllStats))                   //DONE

	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes/:sindex/nodes/:node/allstats", sessionValidator(getClusterNamespaceSindexNodeAllStats)) //DONE
	e.POST("/aerospike/service/clusters/:clusterUuid/namespace/:namespace/add_index", sessionValidator(postClusterAddIndex))                                               //DONE
	e.POST("/aerospike/service/clusters/:clusterUuid/namespace/:namespace/drop_index", sessionValidator(postClusterDropIndex))                                             //DONE

	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sindexes", sessionValidator(getClusterNamespaceSindexes)) //DONE
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/sets", sessionValidator(getClusterNamespaceSets))         //DONE
	e.GET("/aerospike/service/clusters/:clusterUuid/namespaces/:namespace/storage", sessionValidator(getClusterNamespaceStorage))
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes/jobs", getClusterNodesJobs)
	e.GET("/aerospike/service/clusters/:clusterUuid/jobs/nodes/:node", getClusterJobsNode)

	e.POST("/aerospike/service/clusters/get-cluster-id", postGetClusterId)

	if registerEnterpriseAPI != nil {
		registerEnterpriseAPI(e)
	}

	logrus.Infof("Starting AMC server, version: %s %s", common.AMCVersion, common.AMCEdition)
	_server = e
	// Start server
	if config.AMC.CertFile != "" {
		logrus.Infof("In HTTPS (secure) Mode")
		// redirect all http requests to https
		e.Pre(middleware.HTTPSRedirect())
		e.StartTLS(config.AMC.Bind, config.AMC.CertFile, config.AMC.KeyFile)
	} else {
		logrus.Infof("In HTTP (insecure) Mode.")
		e.Start(config.AMC.Bind)
	}
}

func GoaServer(config *common.Config) {
	_observer = models.New(config)

	_defaultClientPolicy.Timeout = time.Duration(config.AMC.Timeout) * time.Second
	if _defaultClientPolicy.Timeout <= 0 {
		_defaultClientPolicy.Timeout = 30 * time.Second
	}
	_defaultClientPolicy.LimitConnectionsToQueueSize = true
	_defaultClientPolicy.ConnectionQueueSize = 1

	rand.Seed(time.Now().UnixNano())

	// Create service and set the logger
	f, err := os.OpenFile(config.AMC.ErrorLog, os.O_RDWR|os.O_CREATE, 0755)
	if err != nil {
		log.Fatal(err)
	}
	logger := goa.NewLogger(log.New(f, "", log.LstdFlags))
	service := goa.New("amc")

	// Mount middleware
	service.Use(gmiddleware.RequestID())

	service.Use(gmiddleware.ErrorHandler(service, true))
	service.Use(gzm.Middleware(gzip.BestCompression))
	service.Use(gmiddleware.LogRequest(true))

	// Mount caching middleware
	service.Use(mw.CacheMiddleware)

	// Mount security middlewares
	jwtMiddleware, err := mw.NewJWTMiddleware(logger)
	if err != nil {
		log.Fatalln(err)
	}
	app.UseJWTMiddleware(service, jwtMiddleware)

	authCtl := NewAuthController(service)
	app.MountAuthController(service, authCtl)

	// Mount "amc" controller
	app.MountAmcController(service, NewAmcController(service))
	app.MountSwaggerController(service, NewSwaggerController(service))
	app.MountPublicController(service, NewPublicController(service))

	app.MountUserController(service, NewUserController(service))
	app.MountConnectionController(service, NewConnectionController(service))
	app.MountNodeController(service, NewNodeController(service))
	app.MountNamespaceController(service, NewNamespaceController(service))
	app.MountLogicalNamespaceController(service, NewLogicalNamespaceController(service))
	app.MountSetController(service, NewSetController(service))
	app.MountModuleController(service, NewModuleController(service))
	app.MountIndexController(service, NewIndexController(service))
	app.MountBackupController(service, NewBackupController(service))
	app.MountRestoreController(service, NewRestoreController(service))
	app.MountNotificationController(service, NewNotificationController(service))
	app.MountDbRoleController(service, NewDbRoleController(service))
	app.MountDbUserController(service, NewDbUserController(service))

	if config.AMC.StaticPath == "" {
		log.Fatalln("No static dir has been set in the config file. Quiting...")
	}
	logrus.Infoln("Static files path is being set to:" + config.AMC.StaticPath)

	// Middleware
	if !common.AMCIsProd() {
		service.Use(gmiddleware.LogRequest(true))
	} else {
		service.Use(gmiddleware.Recover())
	}

	// Basic Authentication Middleware Setup
	basicAuthUser := os.Getenv("AMC_AUTH_USER")
	if basicAuthUser == "" {
		basicAuthUser = config.BasicAuth.User
	}

	basicAuthPassword := os.Getenv("AMC_AUTH_PASSWORD")
	if basicAuthPassword == "" {
		basicAuthPassword = config.BasicAuth.Password
	}

	if basicAuthUser != "" {
		service.Use(NewBasicAuthMiddleware(basicAuthUser, basicAuthPassword))
	}

	if registerEnterpriseAPI != nil {
		goaRegisterEnterprise(service)
	}

	logrus.Infof("Starting AMC server, version: %s %s", common.AMCVersion, common.AMCEdition)

	// Setup graceful server
	server := &graceful.Server{
		Timeout: time.Duration(15) * time.Second,
		Server: &http.Server{
			Addr:    config.AMC.Bind,
			Handler: service.Mux,
		},
	}

	// Start server
	if config.AMC.CertFile != "" {
		logrus.Infof("In HTTPS (secure) Mode")

		// TODO: redirect all http requests to https
		// e.Pre(gmiddleware.HTTPSRedirect())
		if err := server.ListenAndServeTLS(config.AMC.CertFile, config.AMC.KeyFile); err != nil {
			service.LogError("startup", "err", err)
		}
	} else {
		logrus.Infof("In HTTP (insecure) Mode.")
		if err := server.ListenAndServe(); err != nil {
			service.LogError("startup", "err", err)
		}
	}
}

// NewBasicAuthMiddleware creates a middleware that checks for the presence of a basic auth header
// and validates its content.
func NewBasicAuthMiddleware(amcUser, amcPass string) goa.Middleware {
	return func(h goa.Handler) goa.Handler {
		return func(ctx context.Context, rw http.ResponseWriter, req *http.Request) error {
			// Retrieve and log basic auth info
			user, pass, ok := req.BasicAuth()
			// A real app would do something more interesting here
			if !ok || user != amcUser || pass != amcPass {
				goa.LogInfo(ctx, "failed basic auth")
				return errors.New("missing auth header.")
			}

			return h(ctx, rw, req)
		}
	}
}
