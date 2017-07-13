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

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	namespace := node.Namespaces()[ctx.Namespace]
	if namespace == nil {
		return ctx.BadRequest("Namespace not found.")
	}

	if err := namespace.DropSet(ctx.SetName); err != nil {
		ctx.BadRequest(err.Error())
	}

	// SetController_Drop: end_implement
	return ctx.NoContent()
}

// Query runs the query action.
func (c *SetController) Query(ctx *app.QuerySetContext) error {
	// SetController_Query: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	namespace := node.NamespaceByName(ctx.Namespace)
	if namespace == nil {
		return ctx.BadRequest("Namespace not found.")
	}

	sets := namespace.SetsInfo()

	res := make([]*app.AerospikeAmcSetResponse, 0, len(sets))
	for _, attrs := range sets {
		res = append(res, &app.AerospikeAmcSetResponse{
			Status: string(node.Status()),
			Set:    attrs,
		})
	}

	// SetController_Query: end_implement
	return ctx.OK(res)
}

// Show runs the show action.
func (c *SetController) Show(ctx *app.ShowSetContext) error {
	// SetController_Show: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	namespace := node.NamespaceByName(ctx.Namespace)
	if namespace == nil {
		return ctx.BadRequest("Namespace not found.")
	}

	sets := namespace.SetsInfo()

	res := &app.AerospikeAmcSetResponse{
		Status: string(node.Status()),
		Set:    sets[ctx.SetName],
	}

	// SetController_Show: end_implement
	return ctx.OK(res)
}
