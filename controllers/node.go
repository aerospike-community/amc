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

// Show runs the show action.
func (c *NodeController) Show(ctx *app.ShowNodeContext) error {
	// NodeController_Show: start_implement

	// Put your logic here

	// NodeController_Show: end_implement
	res := &app.AerospikeAmcThroughputWrapperResponse{}
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

	throughput := node.LatestThroughputPerNamespace()

	zeroVal := float64(0)
	throughputData := map[string]map[string][]*app.AerospikeAmcThroughputResponse{}
	for outStatName, aliases := range statsNameAliases {
		primaryVals := throughput[aliases[1]]
		secondaryVals := throughput[aliases[0]]

		statRes := make(map[string][]*app.AerospikeAmcThroughputResponse, len(primaryVals))
		for node, yValues := range primaryVals {
			statRes[node] = []*app.AerospikeAmcThroughputResponse{{Timestamp: yValues.TimestampJsonInt(nil), Successful: yValues.Value(&zeroVal), Failed: secondaryVals[node].Value(&zeroVal)}}
		}

		throughputData[outStatName] = statRes
	}

	res := app.AerospikeAmcThroughputWrapperResponse{
		Status:     string(cluster.Status()),
		Throughput: throughputData,
	}

	// NodeController_Throughput: end_implement
	return ctx.OK(&res)
}
