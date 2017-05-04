package controllers

import (
	"strings"

	"github.com/goadesign/goa"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/models"
)

// UserController implements the user resource.
type UserController struct {
	*goa.Controller
}

// NewUserController creates a user controller.
func NewUserController(service *goa.Service) *UserController {
	return &UserController{Controller: service.NewController("UserController")}
}

// Delete runs the delete action.
func (c *UserController) Delete(ctx *app.DeleteUserContext) error {
	// UserController_Delete: start_implement

	currentUser, err := models.GetUser(ctx.Value("username").(string))
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// check role
	if !currentUser.HasRole(models.URAdmin) {
		return ctx.Unauthorized()
	}

	// a user cannot delete their own account
	if currentUser.Username == strings.ToLower(strings.Trim(ctx.Username, " \t")) {
		return ctx.Unauthorized()
	}

	User := models.User{Username: ctx.Username}
	if err := User.Delete(); err != nil {
		return ctx.InternalServerError()
	}

	// UserController_Delete: end_implement
	return ctx.NoContent()
}

// Get runs the get action.
func (c *UserController) Get(ctx *app.GetUserContext) error {
	// UserController_Get: start_implement

	user, err := models.GetUser(ctx.Username)
	if err != nil {
		return ctx.InternalServerError()
	}

	// UserController_Get: end_implement
	return ctx.OK(toUserMedia(user))
}

// Query runs the query action.
func (c *UserController) Query(ctx *app.QueryUserContext) error {
	// UserController_Query: start_implement

	users, err := models.QueryUsers()
	if err != nil {
		return ctx.InternalServerError()
	}

	res := toUserMedias(users)

	// UserController_Query: end_implement
	return ctx.OK(res)
}

// Save runs the save action.
func (c *UserController) Save(ctx *app.SaveUserContext) error {
	// UserController_Save: start_implement

	user := toUser(ctx)
	if ctx.Payload.Password != nil {
		if err := user.SetPassword(*ctx.Payload.Password); err != nil {
			return ctx.BadRequest(err.Error())
		}
	}

	if err := user.Save(); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// UserController_Save: end_implement
	return ctx.OK(toUserMedia(user))
}
