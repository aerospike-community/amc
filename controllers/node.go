package controllers

import (
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

	throughput := node.LatestThroughput()

	zeroVal := float64(0)
	res := map[string]map[string]*app.AerospikeAmcThroughputResponse{}
	for outStatName, aliases := range statsNameAliases {
		primaryVals := throughput[aliases[1]]
		secondaryVals := throughput[aliases[0]]

		statRes := make(map[string]*app.AerospikeAmcThroughputResponse, len(primaryVals))
		for node, yValues := range primaryVals {
			statRes[node] = &app.AerospikeAmcThroughputResponse{Timestamp: yValues.TimestampJsonInt(nil), X1: yValues.Value(&zeroVal), X2: secondaryVals[node].Value(&zeroVal)}
		}

		res[outStatName] = statRes
	}

	// NodeController_Throughput: end_implement
	return nil
}
