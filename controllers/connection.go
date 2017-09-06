package controllers

import (
	"sync"

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

// AddNode runs the add-node action.
func (c *ConnectionController) AddNode(ctx *app.AddNodeConnectionContext) error {
	// ConnectionController_AddNode: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	if err := cluster.AddNode(ctx.Payload.Node.Host, ctx.Payload.Node.TLSName, ctx.Payload.Node.Port); err != nil {
		return ctx.BadRequest(err.Error())
	}

	// ConnectionController_AddNode: end_implement
	return ctx.NoContent()
}

// Config runs the config action.
func (c *ConnectionController) Config(ctx *app.ConfigConnectionContext) error {
	// ConnectionController_Config: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	nodes := cluster.Nodes()
	res := make(map[string]*app.AerospikeAmcNodeConfigResponse, len(nodes))
	for _, node := range nodes {
		res[node.Address()] = &app.AerospikeAmcNodeConfigResponse{
			Address: node.Address(),
			Status:  string(node.Status()),
			Config:  node.ConfigAttrs(),
		}
	}

	// ConnectionController_Config: end_implement
	return ctx.OK(res)
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

// Overview runs the overview action.
func (c *ConnectionController) Overview(ctx *app.OverviewConnectionContext) error {
	// ConnectionController_Overview: start_implement

	sessionId := ctx.Value("sessionId").(string)

	// ConnectionController_Overview: end_implement
	return ctx.OK(_observer.DatacenterInfo(sessionId))
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

// Entities runs the entities action.
func (c *ConnectionController) Entities(ctx *app.EntitiesConnectionContext) error {
	// ConnectionController_Entities: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	et, err := cluster.EntityTree(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	// ConnectionController_Entities: end_implement
	return ctx.OK(et)
}

// Latency runs the latency action.
func (c *ConnectionController) Latency(ctx *app.LatencyConnectionContext) error {
	// ConnectionController_Latency: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	nodes := cluster.Nodes()
	res := make(map[string]*app.AerospikeAmcLatencyResponse, len(nodes))
	for _, node := range nodes {
		res[node.Address()] = &app.AerospikeAmcLatencyResponse{
			Status:  string(node.Status()),
			Latency: latency(node, ctx.From, ctx.Until),
		}
	}

	// ConnectionController_Latency: end_implement
	return ctx.OK(res)
}

// Namespaces runs the namespaces action.
func (c *ConnectionController) Namespaces(ctx *app.NamespacesConnectionContext) error {
	// ConnectionController_Namespaces: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	res := cluster.NamespaceInfo(cluster.NamespaceList())

	// ConnectionController_Namespaces: end_implement
	return ctx.OK(res)
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
		IsSecurityEnabled:   cluster.SecurityEnabled(),
	}

	// ConnectionController_Show: end_implement
	return ctx.OK(res)
}

// get the user logged into the cluster
func (c *ConnectionController) User(ctx *app.UserConnectionContext) error {
	// UserController_Get: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	res := &app.AerospikeAmcClusterRoleResponse{}

	if cluster.SecurityEnabled() {
		var user string
		if p := cluster.User(); p != nil {
			user = *p
		}

		roles := []*app.Privilege{}
		for _, r := range cluster.CurrentUserRoles() {
			p := &app.Privilege{
				Privilege: r.Privilege,
				Namespace: &r.Namespace,
				Set:       &r.Set,
			}
			roles = append(roles, p)
		}

		res = &app.AerospikeAmcClusterRoleResponse{
			Name:  user,
			Roles: roles,
		}
	}

	return ctx.OK(res)
}

// SetConfig runs the set config action.
func (c *ConnectionController) SetConfig(ctx *app.SetConfigConnectionContext) error {
	// ConnectionController_SetConfig: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	config := make(map[string]string, len(ctx.Payload.NewConfig))
	for k, v := range ctx.Payload.NewConfig {
		config[k] = ""
		if len(v) > 0 {
			config[k] = v
		}
	}

	nodes := cluster.Nodes()
	wg := new(sync.WaitGroup)
	wg.Add(len(nodes))
	resChan := make(chan *NodeResult, len(nodes))

	for _, node := range nodes {
		go func(node *models.Node) {
			defer wg.Done()

			err := node.SetServerConfig("service", config)
			resChan <- &NodeResult{Name: node.Address(), Err: err}
		}(node)
	}

	wg.Wait()
	close(resChan)

	res := make(map[string]*app.AerospikeAmcNodeConfigResponse)
	for nr := range resChan {
		if nr.Err != nil {
			s := nr.Err.Error()
			res[nr.Name] = &app.AerospikeAmcNodeConfigResponse{
				Error: &s,
			}
		} else {
			node := cluster.FindNodeByAddress(nr.Name)
			if node == nil {
				continue
			}
			res[nr.Name] = &app.AerospikeAmcNodeConfigResponse{
				Address: node.Address(),
				Status:  string(node.Status()),
				Config:  node.ConfigAttrs(),
			}
		}
	}

	// ConnectionController_SetConfig: end_implement
	return ctx.OK(res)
}

// Throughput runs the throughput action.
func (c *ConnectionController) Throughput(ctx *app.ThroughputConnectionContext) error {
	// ConnectionController_Throughput: start_implement

	cluster, err := getConnectionClusterById(ctx.ConnID)
	if err != nil {
		return ctx.BadRequest(err.Error())
	}

	res := app.AerospikeAmcThroughputWrapperResponse{
		Status:     string(cluster.Status()),
		Throughput: throughput(cluster, ctx.From, ctx.Until),
	}

	// ConnectionController_Throughput: end_implement
	return ctx.OK(&res)
}
