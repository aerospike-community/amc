package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// RestoreController implements the restore resource.
type RestoreController struct {
	*goa.Controller
}

// NewRestoreController creates a restore controller.
func NewRestoreController(service *goa.Service) *RestoreController {
	return &RestoreController{Controller: service.NewController("RestoreController")}
}

// Create runs the create action.
func (c *RestoreController) Create(ctx *app.CreateRestoreContext) error {
	// RestoreController_Create: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	restore, err := cluster.Restore(
		ctx.Payload.Namespace,
		ctx.Payload.SourceAddress,
		ctx.Payload.SourcePath,
		ctx.Payload.SSHUser,
		ctx.Payload.SSHPassword,
		ctx.Payload.Threads,
		ctx.Payload.MissingRecordsOnly,
		ctx.Payload.IgnoreGenerationNumber)

	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// RestoreController_Create: end_implement
	return ctx.OK(restore.ToMedia())
}

// Progress runs the progress action.
func (c *RestoreController) Progress(ctx *app.ProgressRestoreContext) error {
	// RestoreController_Progress: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	restore := cluster.CurrentRestore()
	if restore == nil {
		return ctx.NotFound()
	}

	// RestoreController_Progress: end_implement
	return ctx.OK(restore.ToMedia())
}
