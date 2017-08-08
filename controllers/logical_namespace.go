package controllers

import (
	"time"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/models"
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

// Stub to satisfy the throughputEntity interface
type nsthroughput struct {
	ns *models.LogicalNamespace
}

func (tp *nsthroughput) LatestThroughput() map[string]map[string]*common.SinglePointValue { return nil }
func (tp *nsthroughput) Throughput(from, to time.Time) map[string]map[string][]*common.SinglePointValue {
	return tp.ns.Throughput(from, to)
}

// Throughput runs the throughput action.
func (c *LogicalNamespaceController) Throughput(ctx *app.ThroughputLogicalNamespaceContext) error {
	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	ns := cluster.GetNamespace(ctx.Namespace)
	if ns == nil {
		return ctx.BadRequest("Namespace not found.")
	}

	nstp := &nsthroughput{
		ns: ns,
	}
	res := app.AerospikeAmcThroughputWrapperResponse{
		Throughput: throughput(nstp, &ctx.From, ctx.Until),
	}

	return ctx.OK(&res)
}

// Stub to satisfy the latencyEntity interface
type nslatency struct {
	ns *models.LogicalNamespace
}

func (lat *nslatency) LatestLatency() map[string]common.Stats { return nil }
func (lat *nslatency) Latency(from, to time.Time) []map[string]common.Stats {
	return lat.ns.Latency(from, to)
}

// Latency runs the latency action.
func (c *LogicalNamespaceController) Latency(ctx *app.LatencyLogicalNamespaceContext) error {
	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	ns := cluster.GetNamespace(ctx.Namespace)
	if ns == nil {
		return ctx.BadRequest("Namespace not found.")
	}

	nslat := &nslatency{
		ns: ns,
	}
	res := latency(nslat, &ctx.From, ctx.Until)

	return ctx.OK(res)
}
