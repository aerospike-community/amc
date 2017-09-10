package controllers

import (
	"strings"

	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
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

// Jobs runs the jobs action.
func (c *NodeController) Jobs(ctx *app.JobsNodeContext) error {
	// NodeController_Jobs: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	sortField := "time-since-done"
	if ctx.SortBy != nil {
		sortField = *ctx.SortBy
	}

	limit := 50
	if ctx.Limit != nil {
		limit = *ctx.Limit
	}

	offset := 0
	if ctx.Offset != nil {
		offset = *ctx.Offset
	}

	jobStatus := ""
	if ctx.Status != nil {
		switch *ctx.Status {
		case "in-progress":
			jobStatus = "active"
		case "completed":
			jobStatus = "done"
		default:
			jobStatus = ""
		}
	}

	sortFunc, exists := _jobsSortFields[sortField]
	if !exists {
		return ctx.BadRequest("Field specified by sort_by not supported.")
	}

	res := &app.AerospikeAmcJobResponse{
		Offset: offset,
		Limit:  limit,
	}

	jobs := []common.Stats{}
	jobStats := node.Jobs()
	for _, v := range jobStats {
		if !strings.HasPrefix(v.TryString("status", ""), jobStatus) {
			continue
		}

		v["address"] = node.Address()
		v["node"] = map[string]interface{}{
			"status": node.Status(),
			"build":  node.Build(),
			"memory": node.Memory(),
		}
		jobs = append(jobs, v)
	}

	jobCount := len(jobs)

	sortOrder := "desc"
	if ctx.SortOrder != nil {
		sortOrder = *ctx.SortOrder
	}

	if sortOrder == "desc" {
		common.StatsBy(sortFunc).SortReverse(sortField, jobs)
	} else {
		common.StatsBy(sortFunc).Sort(sortField, jobs)
	}

	if offset+limit <= len(jobs) {
		jobs = jobs[offset : offset+limit]
	} else if offset < len(jobs) {
		jobs = jobs[offset:]
	} else {
		jobs = []common.Stats{}
	}

	for i := range jobs {
		res.Jobs = append(res.Jobs, map[string]interface{}(jobs[i]))
	}
	res.JobCount = jobCount

	// NodeController_Jobs: end_implement
	return ctx.OK(res)
}

// KillJob runs the kill-job action.
func (c *NodeController) KillJob(ctx *app.KillJobNodeContext) error {
	// NodeController_KillJob: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	if err := node.KillJob(ctx.Module, ctx.Trid); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// NodeController_KillJob: end_implement
	return ctx.NoContent()
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
					RawStats:          node.StatsAttrs(),
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

// SetJobPriority runs the set-job-priority action.
func (c *NodeController) SetJobPriority(ctx *app.SetJobPriorityNodeContext) error {
	// NodeController_KillJob: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	if err := node.SetJobPriority(ctx.Module, ctx.Trid, ctx.Priority); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// NodeController_KillJob: end_implement
	return ctx.NoContent()
}

// SwitchXDR runs the switch XDR action.
func (c *NodeController) SwitchXDR(ctx *app.SwitchXDRNodeContext) error {
	// NodeController_SwitchXDR: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	node := cluster.FindNodeByAddress(ctx.Node)
	if node == nil {
		return ctx.BadRequest("Node not found.")
	}

	on := strings.ToLower(ctx.Payload.State) == "on"

	switch string(node.XdrStatus()) {
	case "on":
		if on {
			return ctx.BadRequest("XDR Already On")
		}
	case "off":
		if !on {
			return ctx.BadRequest("XDR Already Off")
		}
	}

	if err := node.SwitchXDR(on); err != nil {
		return ctx.BadRequest("XDR Already Off")
	}

	// NodeController_SwitchXDR: end_implement
	return ctx.NoContent()
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
