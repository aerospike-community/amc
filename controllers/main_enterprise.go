// +build enterprise

package controllers

import "github.com/labstack/echo"

func registerEnterprise(e *echo.Echo) {
	e.GET("/aerospike/service/clusters/:clusterUuid/get-current-user", sessionValidator(getClusterCurrentUser))
	e.GET("/aerospike/service/clusters/:clusterUuid/get_user_roles", sessionValidator(getClusterUserRoles))

	e.POST("/aerospike/service/clusters/:clusterUuid/initiate_backup", sessionValidator(postInitiateBackup))
	e.GET("/aerospike/service/clusters/:clusterUuid/get_backup_progress", sessionValidator(getBackupProgress))
	e.GET("/aerospike/service/clusters/:clusterUuid/get_successful_backups", sessionValidator(getSuccessfulBackups))
	e.POST("/aerospike/service/clusters/:clusterUuid/get_available_backups", sessionValidator(getAvailableBackups))

	e.POST("/aerospike/service/clusters/:clusterUuid/initiate_restore", sessionValidator(postInitiateRestore))
	e.GET("/aerospike/service/clusters/:clusterUuid/get_restore_progress", sessionValidator(getRestoreProgress))

	e.GET("/alert-emails", sessionValidator(getAlertEmails))
	e.POST("/alert-emails", sessionValidator(postAlertEmails))
	e.POST("/delete-alert-emails", sessionValidator(deleteAlertEmails))

	e.GET("/aerospike/get_multicluster_view/:port", getMultiClusterView)

	e.POST("/aerospike/service/clusters/:clusterUuid/fire_cmd", sessionValidator(postClusterFireCmd))
	e.GET("/aerospike/service/clusters/:clusterUuid/get_all_users", sessionValidator(getClusterAllUsers))
	e.GET("/aerospike/service/clusters/:clusterUuid/get_all_roles", sessionValidator(getClusterAllRoles))
	e.POST("/aerospike/service/clusters/:clusterUuid/add_user", sessionValidator(postClusterAddUser))
	e.POST("/aerospike/service/clusters/:clusterUuid/user/:user/remove", sessionValidator(postClusterDropUser))
	e.POST("/aerospike/service/clusters/:clusterUuid/user/:user/update", sessionValidator(postClusterUpdateUser))
	e.POST("/aerospike/service/clusters/:clusterUuid/roles/:role/add_role", sessionValidator(postClusterAddRole))
	e.POST("/aerospike/service/clusters/:clusterUuid/roles/:role/update", sessionValidator(postClusterUpdateRole))
	e.POST("/aerospike/service/clusters/:clusterUuid/roles/:role/drop_role", sessionValidator(postClusterDropRole))

	e.GET("/aerospike/service/clusters/:clusterUuid/latency/:nodes", sessionValidator(getNodeLatency))
	e.GET("/aerospike/service/clusters/:clusterUuid/latency_history/:nodes", sessionValidator(getNodeLatencyHistory))
	e.GET("/aerospike/service/clusters/:clusterUuid/nodes/:nodes/latency_history", sessionValidator(getNodesLatencyHistory))
	e.POST("/aerospike/service/clusters/:clusterUuid/change_password", sessionValidator(postClusterChangePassword))
	e.GET("/aerospike/service/clusters/:clusterUuid/alerts", sessionValidator(getClusterAlerts))
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:node/switch_xdr_off", sessionValidator(postSwitchXDROff))
	e.POST("/aerospike/service/clusters/:clusterUuid/nodes/:node/switch_xdr_on", sessionValidator(postSwitchXDROn))
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:xdrPort/nodes/:nodes", sessionValidator(getClusterXdrNodes))
	e.GET("/aerospike/service/clusters/:clusterUuid/xdr/:xdrPort/nodes/:nodes/allconfig", sessionValidator(getClusterXdrNodesAllConfig))
	e.POST("/aerospike/service/clusters/:clusterUuid/xdr/:xdrPort/nodes/:nodes/setconfig", sessionValidator(setClusterXdrNodesConfig))
}

func init() {
	registerEnterpriseAPI = registerEnterprise
}
