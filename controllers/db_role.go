package controllers

import (
	as "github.com/aerospike/aerospike-client-go"
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// DbRoleController implements the db-role resource.
type DbRoleController struct {
	*goa.Controller
}

// NewDbRoleController creates a db-role controller.
func NewDbRoleController(service *goa.Service) *DbRoleController {
	return &DbRoleController{Controller: service.NewController("DbRoleController")}
}

// Delete runs the delete action.
func (c *DbRoleController) Delete(ctx *app.DeleteDbRoleContext) error {
	// DbRoleController_Delete: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	err = cluster.DropRole(ctx.Role)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// DbRoleController_Delete: end_implement
	return ctx.NoContent()
}

// Query runs the query action.
func (c *DbRoleController) Query(ctx *app.QueryDbRoleContext) error {
	// DbRoleController_Query: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	roles := cluster.Roles()

	rList := make([]*app.AerospikeAmcClusterRoleResponse, 0, len(roles))
	for _, r := range roles {
		resp := &app.AerospikeAmcClusterRoleResponse{
			Name: r.Name,
		}

		privList := make([]*app.Privilege, 0, len(r.Privileges))
		for _, p := range r.Privileges {
			priv := &app.Privilege{
				Privilege: string(p.Code),
			}

			if len(p.Namespace) > 0 {
				priv.Namespace = &p.Namespace
			}

			if len(p.SetName) > 0 {
				priv.Set = &p.SetName
			}

			privList = append(privList, priv)
		}

		resp.Roles = privList
		rList = append(rList, resp)
	}

	// DbRoleController_Query: end_implement
	return ctx.OK(rList)
}

// Save runs the save action.
func (c *DbRoleController) Save(ctx *app.SaveDbRoleContext) error {
	// DbRoleController_Save: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	pList := make([]as.Privilege, 0, len(ctx.Payload.Privileges))
	for _, p := range ctx.Payload.Privileges {
		pv := privilegeFromString(p.Privilege)

		if p.Namespace != nil && len(*p.Namespace) > 0 {
			pv.Namespace = *p.Namespace
		}
		if p.Set != nil && len(*p.Set) > 0 {
			pv.SetName = *p.Set
		}

		pList = append(pList, *pv)
	}

	err = cluster.CreateRole(ctx.Payload.Name, pList)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// DbRoleController_Save: end_implement
	res := &app.AerospikeAmcClusterRoleResponse{}
	return ctx.OK(res)
}

// // Show runs the show action.
// func (c *DbRoleController) Show(ctx *app.ShowDbRoleContext) error {
// 	// DbRoleController_Show: start_implement

// 	// Put your logic here

// 	// DbRoleController_Show: end_implement
// 	res := &app.AerospikeAmcClusterRoleResponse{}
// 	return ctx.OK(res)
// }
