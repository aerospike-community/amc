package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// SetController implements the set resource.
type SetController struct {
	*goa.Controller
}

// NewSetController creates a set controller.
func NewSetController(service *goa.Service) *SetController {
	return &SetController{Controller: service.NewController("SetController")}
}

// Drop runs the drop action.
func (c *SetController) Drop(ctx *app.DropSetContext) error {
	// SetController_Drop: start_implement

	// Put your logic here

	// SetController_Drop: end_implement
	return nil
}

// Query runs the query action.
func (c *SetController) Query(ctx *app.QuerySetContext) error {
	// SetController_Query: start_implement

	// Put your logic here

	// SetController_Query: end_implement
	return nil
}

// Show runs the show action.
func (c *SetController) Show(ctx *app.ShowSetContext) error {
	// SetController_Show: start_implement

	// Put your logic here

	// SetController_Show: end_implement
	return nil
}
