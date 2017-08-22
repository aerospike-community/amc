package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// XdrController implements the xdr resource.
type XdrController struct {
	*goa.Controller
}

// NewXdrController creates a xdr controller.
func NewXdrController(service *goa.Service) *XdrController {
	return &XdrController{Controller: service.NewController("XdrController")}
}

// Query runs the query action.
func (c *XdrController) Query(ctx *app.QueryXdrContext) error {
	// XdrController_Query: start_implement

	// Put your logic here

	// XdrController_Query: end_implement
	return nil
}

// Show runs the show action.
func (c *XdrController) Show(ctx *app.ShowXdrContext) error {
	// XdrController_Show: start_implement

	// Put your logic here

	// XdrController_Show: end_implement
	return nil
}
