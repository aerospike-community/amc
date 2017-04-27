package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
)

// AmcController implements the amc resource.
type AmcController struct {
	*goa.Controller
}

// NewAmcController creates a amc controller.
func NewAmcController(service *goa.Service) *AmcController {
	return &AmcController{Controller: service.NewController("AmcController")}
}

// System runs the system action.
func (c *AmcController) System(ctx *app.SystemAmcContext) error {
	// AmcController_System: start_implement

	// Put your logic here

	// AmcController_System: end_implement
	res := &app.AerospikeAmcSystemResponse{
		Version: &common.AMCVersion,
	}
	return ctx.OK(res)
}
