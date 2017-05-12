package controllers

import (
	"github.com/goadesign/goa"

	ast "github.com/aerospike/aerospike-client-go/types"

	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/models"
)

// ConnectionController implements the connection resource.
type ConnectionController struct {
	*goa.Controller
}

// NewConnectionController creates a connection controller.
func NewConnectionController(service *goa.Service) *ConnectionController {
	return &ConnectionController{Controller: service.NewController("ConnectionController")}
}

// Connect runs the connect action.
func (c *ConnectionController) Connect(ctx *app.ConnectConnectionContext) error {
	// ConnectionController_Connect: start_implement

	sessionId := ctx.Value("sessionId").(string)
	cluster, err := getConnectionCluster(sessionId, ctx.ConnID, ctx.Payload.Username, ctx.Payload.Password)
	if err != nil {
		if common.AMCIsEnterprise() {
			if aerr, ok := err.(ast.AerospikeError); ok && aerr.ResultCode() == ast.NOT_AUTHENTICATED {
				return ctx.Forbidden()
			}
		}

		return ctx.BadRequest(err.Error())
	}

	et, err := cluster.EntityTree(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// ConnectionController_Connect: end_implement
	return ctx.OK(et)
}

// Delete runs the delete action.
func (c *ConnectionController) Delete(ctx *app.DeleteConnectionContext) error {
	// ConnectionController_Delete: start_implement

	conn := models.Connection{Id: ctx.ConnID}
	if err := conn.Delete(); err != nil {
		return ctx.InternalServerError()
	}

	// ConnectionController_Delete: end_implement
	return ctx.NoContent()
}

// Query runs the query action.
func (c *ConnectionController) Query(ctx *app.QueryConnectionContext) error {
	// ConnectionController_Query: start_implement

	user := ctx.Value("username").(string)
	conns, err := models.QueryUserConnections(user)
	if err != nil {
		return ctx.InternalServerError()
	}

	res, err := toConnectionMedias(conns)
	if err != nil {
		return ctx.InternalServerError()
	}

	// ConnectionController_Query: end_implement
	return ctx.OK(res)
}

// Save runs the save action.
func (c *ConnectionController) Save(ctx *app.SaveConnectionContext) error {
	// ConnectionController_Save: start_implement

	user := ctx.Value("username").(string)
	conn := toConnection(ctx)
	conn.Username = user
	if err := conn.Save(); err != nil {
		return ctx.BadRequest()
	}

	// ConnectionController_Save: end_implement
	return ctx.NoContent()
}

// Show runs the show action.
func (c *ConnectionController) Show(ctx *app.ShowConnectionContext) error {
	// ConnectionController_Show: start_implement

	conn, err := models.GetConnectionByID(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	userRoles := cluster.Users()
	users := make([]string, 0, len(userRoles))
	for _, u := range userRoles {
		users = append(users, u.User)
	}

	seeds, err := toSeedsMedia(conn)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	res := &app.AerospikeAmcConnectionResponse{
		ActiveRedAlertCount: cluster.RedAlertCount(),
		ClusterBuilds:       cluster.BuildDetails(),
		ConnectOnLogin:      conn.ConnectOnLogin,
		Connected:           connectionIsConnected(ctx.ConnID),
		Disk:                cluster.Disk(),
		ID:                  &ctx.ConnID,
		Memory:              cluster.Memory(),
		Name:                conn.Label,
		Namespaces:          cluster.NamespaceList(),
		Nodes:               cluster.NodeList(),
		NodesCompatibility:  cluster.NodeCompatibility(),
		OffNodes:            cluster.OffNodes(),
		Seeds:               seeds,
		Status:              string(cluster.Status()),
		UpdateInterval:      cluster.UpdateInterval(),
		Users:               users,
	}

	// ConnectionController_Show: end_implement
	return ctx.OK(res)
}
