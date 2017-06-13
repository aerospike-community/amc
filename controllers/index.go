package controllers

import (
	"time"

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

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	if err := cluster.DropIndex(ctx.Payload.Namespace, ctx.Payload.SetName, ctx.Name); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	// IndexController_Drop: end_implement
	return ctx.NoContent()
}

// Query runs the query action.
func (c *IndexController) Query(ctx *app.QueryIndexContext) error {
	// IndexController_Query: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	res := app.AerospikeAmcIndexWrapperResponse{
		Status:  string(cluster.Status()),
		Indexes: indexInfo(cluster, nil, ctx.IncludeStats),
	}

	// IndexController_Query: end_implement
	return ctx.OK(&res)
}

// Save runs the save action.
func (c *IndexController) Save(ctx *app.SaveIndexContext) error {
	// IndexController_Save: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	if err := cluster.CreateIndex(ctx.Payload.Namespace, ctx.Payload.SetName, ctx.Payload.IndexName, ctx.Payload.BinName, ctx.Payload.Type); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	// IndexController_Save: end_implement
	return ctx.NoContent()
}

// Show runs the show action.
func (c *IndexController) Show(ctx *app.ShowIndexContext) error {
	// IndexController_Show: start_implement

	// IndexController_Query: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	res := app.AerospikeAmcIndexWrapperResponse{
		Status:  string(cluster.Status()),
		Indexes: indexInfo(cluster, &ctx.Name, true),
	}

	// IndexController_Show: end_implement
	return ctx.OK(&res)
}
