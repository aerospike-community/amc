// build enterprise

package controllers

import "github.com/labstack/echo/v4"

func registerEnterprise(e *echo.Echo) {
	e.GET("/aerospike/service/clusters/:clusterUUID/get-current-user", sessionValidator(getClusterCurrentUser))
	e.GET("/aerospike/service/clusters/:clusterUUID/get_user_roles", sessionValidator(getClusterUserRoles))

	e.POST("/aerospike/service/clusters/:clusterUUID/initiate_backup", sessionValidator(postInitiateBackup))
	e.GET("/aerospike/service/clusters/:clusterUUID/get_backup_progress", sessionValidator(getBackupProgress))
	e.GET("/aerospike/service/clusters/:clusterUUID/get_successful_backups", sessionValidator(getSuccessfulBackups))
	e.POST("/aerospike/service/clusters/:clusterUUID/get_available_backups", sessionValidator(getAvailableBackups))

	e.POST("/aerospike/service/clusters/:clusterUUID/initiate_restore", sessionValidator(postInitiateRestore))
	e.GET("/aerospike/service/clusters/:clusterUUID/get_restore_progress", sessionValidator(getRestoreProgress))

	e.GET("/alert-emails", sessionValidator(getAlertEmails))
	e.POST("/alert-emails", sessionValidator(postAlertEmails))
	e.POST("/delete-alert-emails", sessionValidator(deleteAlertEmails))

	e.GET("/aerospike/get_multicluster_view/:port", getMultiClusterView)

	e.POST("/aerospike/service/clusters/:clusterUUID/fire_cmd", sessionValidator(postClusterFireCmd))
	e.GET("/aerospike/service/clusters/:clusterUUID/get_all_users", sessionValidator(getClusterAllUsers))
	e.GET("/aerospike/service/clusters/:clusterUUID/get_all_roles", sessionValidator(getClusterAllRoles))
	e.POST("/aerospike/service/clusters/:clusterUUID/add_user", sessionValidator(postClusterAddUser))
	e.POST("/aerospike/service/clusters/:clusterUUID/user/:user/remove", sessionValidator(postClusterDropUser))
	e.POST("/aerospike/service/clusters/:clusterUUID/user/:user/update", sessionValidator(postClusterUpdateUser))
	e.POST("/aerospike/service/clusters/:clusterUUID/roles/:role/add_role", sessionValidator(postClusterAddRole))
	e.POST("/aerospike/service/clusters/:clusterUUID/roles/:role/update", sessionValidator(postClusterUpdateRole))
	e.POST("/aerospike/service/clusters/:clusterUUID/roles/:role/drop_role", sessionValidator(postClusterDropRole))

	e.GET("/aerospike/service/clusters/:clusterUUID/latency/:nodes", sessionValidator(getNodeLatency))
	e.GET("/aerospike/service/clusters/:clusterUUID/latency_history/:nodes", sessionValidator(getNodeLatencyHistory))
	e.GET("/aerospike/service/clusters/:clusterUUID/nodes/:nodes/latency_history", sessionValidator(getNodesLatencyHistory))
	e.POST("/aerospike/service/clusters/:clusterUUID/change_password", sessionValidator(postClusterChangePassword))
	e.GET("/aerospike/service/clusters/:clusterUUID/alerts", sessionValidator(getClusterAlerts))
	e.POST("/aerospike/service/clusters/:clusterUUID/nodes/:node/switch_xdr_off", sessionValidator(postSwitchXDROff))
	e.POST("/aerospike/service/clusters/:clusterUUID/nodes/:node/switch_xdr_on", sessionValidator(postSwitchXDROn))
	e.GET("/aerospike/service/clusters/:clusterUUID/xdr/:xdrPort/nodes/:nodes", sessionValidator(getClusterXdrNodes))
	e.GET("/aerospike/service/clusters/:clusterUUID/xdr/:xdrPort/nodes/:nodes/allconfig", sessionValidator(getClusterXdrNodesAllConfig))
	e.POST("/aerospike/service/clusters/:clusterUUID/xdr/:xdrPort/nodes/:nodes/setconfig", sessionValidator(setClusterXdrNodesConfig))
}

func init() {
	registerEnterpriseAPI = registerEnterprise
}
