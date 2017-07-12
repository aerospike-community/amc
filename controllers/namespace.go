package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// NamespaceController implements the namespace resource.
type NamespaceController struct {
	*goa.Controller
}

// NewNamespaceController creates a namespace controller.
func NewNamespaceController(service *goa.Service) *NamespaceController {
	return &NamespaceController{Controller: service.NewController("NamespaceController")}
}

// Drop runs the drop action.
func (c *NamespaceController) Drop(ctx *app.DropNamespaceContext) error {
	// NamespaceController_Drop: start_implement

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

	if err := namespace.Drop(); err != nil {
		ctx.BadRequest(err.Error())
	}

	// NamespaceController_Drop: end_implement
	return ctx.NoContent()
}

// Latency runs the latency action.
func (c *NamespaceController) Latency(ctx *app.LatencyNamespaceContext) error {
	// NamespaceController_Latency: start_implement

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

	res := map[string]*app.AerospikeAmcLatencyResponse{
		namespace.Name(): &app.AerospikeAmcLatencyResponse{
			Status:  string(node.Status()),
			Latency: latency(namespace, ctx.From, ctx.Until),
		},
	}

	// NamespaceController_Latency: end_implement
	return ctx.OK(res)
}

// Query runs the query action.
func (c *NamespaceController) Query(ctx *app.QueryNamespaceContext) error {
	// NamespaceController_Query: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	namespaces := node.NamespaceList()
	res := node.NamespaceInfo(namespaces)

	// NamespaceController_Query: end_implement
	return ctx.OK(res)
}

// Show runs the show action.
func (c *NamespaceController) Show(ctx *app.ShowNamespaceContext) error {
	// NamespaceController_Show: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	res := node.NamespaceInfo([]string{ctx.Namespace})

	// NamespaceController_Show: end_implement
	return ctx.OK(res[ctx.Namespace])
}

// Throughput runs the throughput action.
func (c *NamespaceController) Throughput(ctx *app.ThroughputNamespaceContext) error {
	// NamespaceController_Throughput: start_implement

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

	res := app.AerospikeAmcThroughputWrapperResponse{
		Status:     string(cluster.Status()),
		Throughput: throughput(namespace, ctx.From, ctx.Until),
	}

	// NamespaceController_Throughput: end_implement
	return ctx.OK(&res)
}
