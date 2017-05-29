package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
)

// NamespaceController implements the namespace resource.
type NamespaceController struct {
	*goa.Controller
}

// NewNamespaceController creates a namespace controller.
func NewNamespaceController(service *goa.Service) *NamespaceController {
	return &NamespaceController{Controller: service.NewController("NamespaceController")}
}

// Show runs the show action.
func (c *NamespaceController) Show(ctx *app.ShowNamespaceContext) error {
	// NamespaceController_Show: start_implement

	// Put your logic here

	// NamespaceController_Show: end_implement
	return nil
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
	if node == nil {
		return ctx.BadRequest("Namespace not found.")
	}

	throughput := map[string]map[string]*common.SinglePointValue{
		ctx.Namespace: namespace.LatestThroughput(),
	}

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

	// NamespaceController_Throughput: end_implement
	return ctx.OK(&res)
}
