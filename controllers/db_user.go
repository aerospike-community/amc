package controllers

import (
	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
)

// DbUserController implements the db-user resource.
type DbUserController struct {
	*goa.Controller
}

// NewDbUserController creates a db-user controller.
func NewDbUserController(service *goa.Service) *DbUserController {
	return &DbUserController{Controller: service.NewController("DbUserController")}
}

// Delete runs the delete action.
func (c *DbUserController) Delete(ctx *app.DeleteDbUserContext) error {
	// DbUserController_Delete: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	if err := cluster.DropUser(ctx.Username); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// DbUserController_Delete: end_implement
	return ctx.NoContent()
}

// Query runs the query action.
func (c *DbUserController) Query(ctx *app.QueryDbUserContext) error {
	// DbUserController_Query: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	users := cluster.Users()
	res := make([]*app.AerospikeAmcClusterUserResponse, 0, len(users))
	for _, u := range users {
		res = append(res, &app.AerospikeAmcClusterUserResponse{
			Username: u.User,
			Roles:    u.Roles,
		})
	}

	// DbUserController_Query: end_implement
	return ctx.OK(res)
}

// Create runs the create action.
func (c *DbUserController) Create(ctx *app.CreateDbUserContext) error {
	// DbUserController_Save: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// create user
	if err := cluster.CreateUser(ctx.Payload.Username, ctx.Payload.Password, ctx.Payload.Roles); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// DbUserController_Save: end_implement
	res := &app.AerospikeAmcClusterUserResponse{}
	return ctx.OK(res)
}

// Update runs the update action.
func (c *DbUserController) Update(ctx *app.UpdateDbUserContext) error {
	// DbUserController_Save: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	if ctx.Payload.Password != nil && len(*ctx.Payload.Password) > 0 {
		if err := cluster.ChangeUserPassword(ctx.Payload.Username, *ctx.Payload.Password); err != nil {
			return ctx.BadRequest(err.Error())
		}
	}

	if len(ctx.Payload.GrantRoles) > 0 {
		if err := cluster.GrantRoles(ctx.Payload.Username, ctx.Payload.GrantRoles); err != nil {
			return ctx.BadRequest(err.Error())
		}
	}

	if len(ctx.Payload.RevokeRoles) > 0 {
		if err := cluster.RevokeRoles(ctx.Payload.Username, ctx.Payload.RevokeRoles); err != nil {
			return ctx.BadRequest(err.Error())
		}
	}

	// DbUserController_Save: end_implement
	res := &app.AerospikeAmcClusterUserResponse{}
	return ctx.OK(res)
}

// Show runs the show action.
func (c *DbUserController) Show(ctx *app.ShowDbUserContext) error {
	// DbUserController_Show: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	users := cluster.Users()
	var res *app.AerospikeAmcClusterUserResponse
	for _, u := range users {
		if u.User == ctx.Username {
			res = &app.AerospikeAmcClusterUserResponse{
				Username: u.User,
				Roles:    u.Roles,
			}
			break
		}
	}

	if res == nil {
		return ctx.NotFound()
	}

	// DbUserController_Show: end_implement
	return ctx.OK(res)
}
