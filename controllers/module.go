package controllers

import (
	"strings"
	"time"

	"github.com/goadesign/goa"

	as "github.com/aerospike/aerospike-client-go"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
)

// ModuleController implements the module resource.
type ModuleController struct {
	*goa.Controller
}

// NewModuleController creates a module controller.
func NewModuleController(service *goa.Service) *ModuleController {
	return &ModuleController{Controller: service.NewController("ModuleController")}
}

// Drop runs the drop action.
func (c *ModuleController) Drop(ctx *app.DropModuleContext) error {
	// ModuleController_Drop: start_implement

	cluster, err := GetConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}
	if err := cluster.DropUDF(ctx.Name); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	// ModuleController_Drop: end_implement
	return ctx.NoContent()
}

// Query runs the query action.
func (c *ModuleController) Query(ctx *app.QueryModuleContext) error {
	// ModuleController_Query: start_implement

	cluster, err := GetConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	nodes := cluster.Nodes()
	res := map[string]common.Stats{}
	for _, node := range nodes {
		nodeUDFs := node.UDFs()
		for _, udf := range nodeUDFs {
			if u := res[udf.TryString("hash", "")]; u == nil {
				udf["nodes_present"] = []string{node.Address()}
				udf["nodes_absent"] = []string{}
				udf["cache_size"] = common.NOT_AVAILABLE
				res[udf.TryString("hash", "")] = udf
			} else {
				u["nodes_present"] = append(u["nodes_present"].([]string), node.Address())
			}

			for _, udf := range res {
				if name := udf["filename"]; name != nil && nodeUDFs[name.(string)] == nil {
					udf["nodes_absent"] = append(udf["nodes_absent"].([]string), node.Address())
				}
			}
		}
	}

	for _, udf := range res {
		udf["synced"] = true
		if len(udf["nodes_absent"].([]string)) > 0 {
			udf["synced"] = false
		}
	}

	var udfList []*app.AerospikeAmcConnectionModulesResponse
	for _, udf := range res {
		synced := udf["synced"].(bool)
		udfList = append(udfList, &app.AerospikeAmcConnectionModulesResponse{
			Name:         udf.TryStringP("filename", ""),
			Hash:         udf.TryStringP("hash", ""),
			Type:         udf.TryStringP("type", ""),
			NodesPresent: udf["nodes_present"].([]string),
			NodesAbsent:  udf["nodes_absent"].([]string),
			Synced:       &synced,
		})
	}

	// ModuleController_Query: end_implement
	return ctx.OK(udfList)
}

// Save runs the save action.
func (c *ModuleController) Save(ctx *app.SaveModuleContext) error {
	// ModuleController_Save: start_implement

	cluster, err := GetConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// No need to verify the lang; it is checked with a pattern on API
	if err := cluster.CreateUDF(ctx.Payload.Name, ctx.Payload.Content, as.Language(strings.ToUpper(ctx.Payload.Type))); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	// ModuleController_Save: end_implement
	return ctx.NoContent()
}

// Show runs the show action.
func (c *ModuleController) Show(ctx *app.ShowModuleContext) error {
	// ModuleController_Show: start_implement

	cluster, err := GetConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	udf, err := cluster.GetUDF(ctx.Name)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// ModuleController_Show: end_implement
	res := &app.AerospikeAmcConnectionModulesResponseFull{
		Name:   &ctx.Name,
		Source: udf.TryStringP("content", ""),
		Type:   udf.TryStringP("type", ""),
	}
	return ctx.OKFull(res)
}
