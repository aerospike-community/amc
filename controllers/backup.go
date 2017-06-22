package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/models"
)

// BackupController implements the backup resource.
type BackupController struct {
	*goa.Controller
}

// NewBackupController creates a backup controller.
func NewBackupController(service *goa.Service) *BackupController {
	return &BackupController{Controller: service.NewController("BackupController")}
}

// Create runs the create action.
func (c *BackupController) Create(ctx *app.CreateBackupContext) error {
	// BackupController_Create: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	backup, err := cluster.Backup(
		ctx.Payload.Namespace,
		ctx.Payload.DestinationAddress,
		ctx.Payload.DestinationPath,
		ctx.Payload.SSHUser,
		ctx.Payload.SSHPassword,
		ctx.Payload.Sets,
		ctx.Payload.MetadataOnly,
		ctx.Payload.TerminateOnClusterChange,
		ctx.Payload.ScanPriority)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// BackupController_Create: end_implement
	return ctx.OK(backup.ToMedia())
}

// Progress runs the in progress action.
func (c *BackupController) Progress(ctx *app.ProgressBackupContext) error {
	// BackupController_InProgress: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	backup := cluster.CurrentBackup()
	if backup == nil {
		return ctx.NotFound()
	}

	// BackupController_InProgress: end_implement
	return ctx.OK(backup.ToMedia())
}

// Query runs the query action.
func (c *BackupController) Query(ctx *app.QueryBackupContext) error {
	// BackupController_Query: start_implement

	backupList, err := models.SuccessfulBackups(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	res := make([]*app.AerospikeAmcBackupResponse, 0, len(backupList))
	for _, backup := range backupList {
		res = append(res, backup.ToMedia())
	}

	// BackupController_Query: end_implement
	return ctx.OK(res)
}

// Show runs the show action.
func (c *BackupController) Show(ctx *app.ShowBackupContext) error {
	// BackupController_Show: start_implement

	backup, err := models.GetBackup(ctx.BackupID, ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// BackupController_Show: end_implement
	return ctx.OK(backup.ToMedia())
}
