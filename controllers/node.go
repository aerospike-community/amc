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

// Config runs the config action.
func (c *NodeController) Config(ctx *app.ConfigNodeContext) error {
	// NodeController_Config: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	res := &app.AerospikeAmcNodeConfigResponse{
		Address: node.Address(),
		Status:  string(node.Status()),
		Config:  node.ConfigAttrs(),
	}

	// NodeController_Config: end_implement
	return ctx.OK(res)
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

// SetConfig runs the set config action.
func (c *NodeController) SetConfig(ctx *app.SetConfigNodeContext) error {
	// NodeController_SetConfig: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	config := make(map[string]string, len(ctx.Payload.NewConfig))
	for k, v := range ctx.Payload.NewConfig {
		config[k] = ""
		if len(v) > 0 {
			config[k] = v
		}
	}

	err = node.SetServerConfig("service", config)
	if err != nil {
		return ctx.NotAcceptable(err.Error())
	}

	// NodeController_SetConfig: end_implement
	res := &app.AerospikeAmcNodeConfigResponse{
		Address: node.Address(),
		Status:  string(node.Status()),
		Config:  node.ConfigAttrs(),
	}

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
