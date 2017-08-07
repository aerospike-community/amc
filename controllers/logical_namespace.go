package controllers

import (
	"github.com/citrusleaf/amc/app"
	"github.com/goadesign/goa"
)

// LogicalNamespaceController implements the namespace resource at the cluster
// wide level.
type LogicalNamespaceController struct {
	*goa.Controller
}

// NewLogicalNamespaceController creates a namespace controller.
func NewLogicalNamespaceController(service *goa.Service) *LogicalNamespaceController {
	return &LogicalNamespaceController{Controller: service.NewController("LogicalNamespaceController")}
}

// Show runs the show action.
func (c *LogicalNamespaceController) Show(ctx *app.ShowLogicalNamespaceContext) error {
	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	ns := cluster.GetNamespace(ctx.Namespace)
	if ns == nil {
		return ctx.BadRequest("Namespace not found.")
	}

	res := &app.AerospikeAmcLogicalNamespaceResponse{
		Name:  ns.Name(),
		Objsz: ns.ObjectSize(),
		TTL:   ns.TimeToLive(),
	}

	return ctx.OK(res)
}
