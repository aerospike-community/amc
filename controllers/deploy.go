package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// DeployController implements the node resource.
type DeployController struct {
	*goa.Controller
}

// NewDeployController creates a node controller.
func NewDeployController(service *goa.Service) *DeployController {
	return &DeployController{Controller: service.NewController("DeployController")}
}

// Show runs the show action.
func (c *DeployController) Show(ctx *app.ShowDeployContext) error {
	// NodeController_Show: start_implement
	res := map[string]*app.AerospikeAmcNodeSshstatResponse{}

	out, err := runSSHCmd(ctx.Node, "22", "vagrant", "vagrant", "hostname -I")
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	res[ctx.Node] = &app.AerospikeAmcNodeSshstatResponse{
		Hostname: out,
	}

	// DeployController_Show: end_implement
	return ctx.OK(res)
}
