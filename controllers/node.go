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

	nodeList := strings.Split(ctx.Node, ",")
	res := map[string]*app.AerospikeAmcThroughputWrapperResponse{}

	for _, nodeName := range nodeList {
		node := cluster.FindNodeByAddress(strings.Trim(nodeName, " "))
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

		nodeRes := app.AerospikeAmcThroughputWrapperResponse{
			Status:     string(cluster.Status()),
			Throughput: throughputData,
		}

		res[nodeName] = &nodeRes
	}

	// NodeController_Throughput: end_implement
	return ctx.OK(res)
}
