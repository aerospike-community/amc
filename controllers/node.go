package controllers

import (
	"strings"

	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// NodeController implements the node resource.
type NodeController struct {
	*goa.Controller
}

// NewNodeController creates a node controller.
func NewNodeController(service *goa.Service) *NodeController {
	return &NodeController{Controller: service.NewController("NodeController")}
}

// Latency runs the latency action.
func (c *NodeController) Latency(ctx *app.LatencyNodeContext) error {
	// NodeController_Latency: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	res := map[string]*app.AerospikeAmcLatencyResponse{
		node.Address(): &app.AerospikeAmcLatencyResponse{
			Status:  string(node.Status()),
			Latency: latency(node, ctx.From, ctx.Until),
		},
	}

	// NodeController_Latency: end_implement
	return ctx.OK(res)
}

// Show runs the show action.
func (c *NodeController) Show(ctx *app.ShowNodeContext) error {
	// NodeController_Show: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	nodeList := strings.Split(ctx.Node, ",")
	res := map[string]*app.AerospikeAmcNodeResponse{}
	for _, node := range cluster.Nodes() {
		for _, nodeName := range nodeList {
			nodeName = strings.Trim(nodeName, " ")
			if node.Address() == nodeName {
				nodeResult := app.AerospikeAmcNodeResponse{
					Stats:             node.AnyAttrs(statKeys...),
					ClusterVisibility: string(node.VisibilityStatus()),
					SameCluster:       true, // TODO: remove this?
					Memory:            node.Memory(),
					Disk:              node.Disk(),
					Status:            string(node.Status()),
				}

				res[nodeName] = &nodeResult
			}
		}
	}

	// NodeController_Show: end_implement
	return ctx.OK(res)
}

// Throughput runs the throughput action.
func (c *NodeController) Throughput(ctx *app.ThroughputNodeContext) error {
	// NodeController_Throughput: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	res := app.AerospikeAmcThroughputWrapperResponse{
		Status:     string(node.Status()),
		Throughput: throughput(node, ctx.From, ctx.Until),
	}

	// NodeController_Throughput: end_implement
	return ctx.OK(&res)
}
