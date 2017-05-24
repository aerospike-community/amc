package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// IndexController implements the index resource.
type IndexController struct {
	*goa.Controller
}

// NewIndexController creates a index controller.
func NewIndexController(service *goa.Service) *IndexController {
	return &IndexController{Controller: service.NewController("IndexController")}
}

// Drop runs the drop action.
func (c *IndexController) Drop(ctx *app.DropIndexContext) error {
	// IndexController_Drop: start_implement

	// Put your logic here

	// IndexController_Drop: end_implement
	return nil
}

// Query runs the query action.
func (c *IndexController) Query(ctx *app.QueryIndexContext) error {
	// IndexController_Query: start_implement

	// Put your logic here

	// IndexController_Query: end_implement
	return nil
}

// Save runs the save action.
func (c *IndexController) Save(ctx *app.SaveIndexContext) error {
	// IndexController_Save: start_implement

	// Put your logic here

	// IndexController_Save: end_implement
	res := &app.AerospikeAmcIndexResponse{}
	return ctx.OK(res)
}

// Show runs the show action.
func (c *IndexController) Show(ctx *app.ShowIndexContext) error {
	// IndexController_Show: start_implement

	// Put your logic here

	// IndexController_Show: end_implement
	res := &app.AerospikeAmcIndexResponse{}
	return ctx.OK(res)
}
