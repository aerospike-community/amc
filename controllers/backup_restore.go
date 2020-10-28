package controllers

import (
	"net/http"
	// "sort"
	// "strconv"
	"strings"
	// "time"
	"fmt"

	// . "github.com/ahmetalpbalkan/go-linq"
	// log "github.com/sirupsen/logrus"
	// ast "github.com/aerospike/aerospike-client-go/types"
	"github.com/aerospike-community/amc/common"
	"github.com/labstack/echo"
)

func postInitiateBackup(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	form := struct {
		Namespace              string `form:"namespace"`
		DestinationNodeAddress string `form:"destination_node_address"`
		DestinationLocation    string `form:"destination_location"`
		Username               string `form:"username"`
		Password               string `form:"password"`
		Sets                   string `form:"sets"`
		OnlyMetadata           bool   `form:"only_metadata"`
		TerminateOnChange      bool   `form:"terminate_on_change"`
		ScanPriority           int    `form:"scan_priority"`
		ModifiedBefore         string `form:"modified_before"`
		ModifiedAfter          string `form:"modified_after"`
	}{}

	c.Bind(&form)
	if len(form.Namespace) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid Namespace"))
	}

	if len(form.DestinationNodeAddress) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid DestinationNodeAddress"))
	}

	if len(form.DestinationLocation) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid DestinationLocation"))
	}

	if len(form.ModifiedBefore) > 0 {
		if _, err := common.ParseTimeStrict("2006-01-02_15:04:05", form.ModifiedBefore); err != nil {
			return c.JSON(http.StatusOK, errorMap("Invalid Modified Before Date: "+err.Error()))
		}
	}

	if len(form.ModifiedAfter) > 0 {
		if _, err := common.ParseTimeStrict("2006-01-02_15:04:05", form.ModifiedAfter); err != nil {
			return c.JSON(http.StatusOK, errorMap("Invalid Modified After Date: "+err.Error()))
		}
	}

	backup, err := cluster.Backup(
		form.Namespace,
		form.DestinationNodeAddress,
		form.DestinationLocation,
		form.Username,
		form.Password,
		form.Sets,
		form.OnlyMetadata,
		form.TerminateOnChange,
		form.ModifiedBefore,
		form.ModifiedAfter,
		form.ScanPriority)
	if err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"backup_id": backup.Id,
		"status":    strings.ToLower(string(backup.Status)),
	})
}

func getBackupProgress(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	backup := cluster.CurrentBackup()
	if backup == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		backup.Id: map[string]interface{}{
			"destination_location":     backup.DestinationPath,
			"destination_node_address": backup.DestinationAddress,
			"namespace":                backup.Namespace,
			"progress": map[string]interface{}{
				"percentage": fmt.Sprintf("%d%%", backup.Progress),
				"status":     strings.ToLower(string(backup.Status)),
			},
		},
	})
}

func getSuccessfulBackups(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	backupList, err := common.SuccessfulBackups()
	if err != nil {
		return c.JSON(http.StatusOK, errorMap("Error reading backup list from the database: "+err.Error()))
	}

	res := make([]interface{}, 0, len(backupList))
	for _, backup := range backupList {
		res = append(res, map[string]interface{}{
			"destination_location":     backup.DestinationPath + fmt.Sprintf("/backup_%s_%s", backup.Namespace, backup.Created.Format("2006-01-02_15:04:05")),
			"destination_node_address": backup.DestinationAddress,
			"namespace":                backup.Namespace,
			"only_metadata":            backup.MetadataOnly,
			"sets":                     backup.Sets,
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"successful_backups": res,
	})
}

func getAvailableBackups(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	form := struct {
		DestinationNodeAddress string `form:"source_node_address"`
		DestinationLocation    string `form:"source_location"`
	}{}

	c.Bind(&form)

	backupList, err := common.SuccessfulBackups()
	if err != nil {
		return c.JSON(http.StatusOK, errorMap("Error reading backup list from the database: "+err.Error()))
	}

	res := make([]interface{}, 0, len(backupList))
	for _, backup := range backupList {
		name := backup.DestinationPath + fmt.Sprintf("/backup_%s_%s", backup.Namespace, backup.Created.Format("2006-01-02_15:04:05"))
		if backup.DestinationAddress == form.DestinationNodeAddress && strings.HasPrefix(name, form.DestinationLocation) {
			res = append(res, fmt.Sprintf("backup_%s_%s", backup.Namespace, backup.Created.Format("2006-01-02_15:04:05")))
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"available_backups": res,
		"status":            "Success",
	})
}

func postInitiateRestore(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	form := struct {
		Namespace              string `form:"namespace"`
		DestinationNodeAddress string `form:"source_node_address"`
		DestinationLocation    string `form:"source_location"`
		Username               string `form:"username"`
		Password               string `form:"password"`
		Threads                int    `form:"threads"`
		MissingRecordOnly      bool   `form:"missing_records_only"`
		IgnoreGenerationNumber bool   `form:"ignore_generation_num"`
	}{}

	c.Bind(&form)
	if len(form.DestinationNodeAddress) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid DestinationNodeAddress"))
	}

	if len(form.DestinationLocation) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid DestinationLocation"))
	}

	restore, err := cluster.Restore(
		form.Namespace,
		form.DestinationNodeAddress,
		form.DestinationLocation,
		form.Username,
		form.Password,
		form.Threads,
		form.MissingRecordOnly,
		form.IgnoreGenerationNumber)

	if err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": strings.ToLower(string(restore.Status)),
	})
}

func getRestoreProgress(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	restore := cluster.CurrentRestore()
	if restore == nil {
		return c.JSON(http.StatusOK, errorMap("No Restore in progress"))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": strings.ToLower(string(restore.Status)),
	})
}
