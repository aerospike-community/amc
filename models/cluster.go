package models

import (
	"fmt"
	// "strconv"
	"errors"
	"html/template"
	"runtime/debug"
	"strings"
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go/v5"
	"github.com/kennygrant/sanitize"
	version "github.com/mcuadros/go-version"
	log "github.com/sirupsen/logrus"

	// "github.com/sasha-s/go-deadlock"
	uuid "github.com/satori/go.uuid"

	"github.com/aerospike-community/amc/common"
	"github.com/aerospike-community/amc/mailer"
)

// Cluster type struct
type Cluster struct {
	observer *ObserverT
	client   common.SyncValue //*as.Client
	nodes    common.SyncValue //map[as.Host]*Node

	// last time updated
	lastUpdate common.SyncValue //time.Time

	//pinged by user
	lastPing common.SyncValue //time.Time

	// _datacenterInfo                      common.SyncStats
	aggNodeStats, aggNodeCalcStats       common.SyncStats
	aggNsStats, aggNsCalcStats           common.SyncValue //map[string]common.Stats
	aggTotalNsStats, aggTotalNsCalcStats common.SyncStats
	aggNsSetStats                        common.SyncValue //map[string]map[string]common.Stats // [namespace][set]aggregated stats
	jobs                                 common.SyncValue //[]common.Stats

	// either a uuid.V4, or a sorted comma delimited string of host:port
	uuid            string
	securityEnabled bool
	updateInterval  common.SyncValue //int // seconds

	seeds    common.SyncValue //[]*as.Host
	alias    common.SyncValue //string
	user     common.SyncValue //string
	password common.SyncValue //string // TODO: Keep hashed values only

	// Permanent clusters are loaded from the config file
	// They will not removed automatically after a period of inactivity
	permanent common.SyncValue //bool

	// if set to True, the cluster will show up in the UI
	// used only for the permanent clusters
	showInUI common.SyncValue //bool

	alerts *common.AlertBucket

	users                 common.SyncValue //[]*as.UserRoles
	roles                 common.SyncValue //[]*as.Role
	currentUserPrivileges common.SyncValue //[]string

	activeBackup  common.SyncValue //*Backup
	activeRestore common.SyncValue //*Restore

	redAlertCount common.SyncValue

	// mutex deadlock.RWMutex
}

// newCluster - create new Cluster struct
func newCluster(observer *ObserverT, client *as.Client, alias, user, password string, seeds []*as.Host) *Cluster {
	newCluster := Cluster{
		observer:       observer,
		client:         common.NewSyncValue(client),
		nodes:          common.NewSyncValue(map[as.Host]*Node{}),
		updateInterval: common.NewSyncValue(observer.config.AMC.UpdateInterval), //seconds
		lastUpdate:     common.NewSyncValue(time.Time{}),                        //seconds
		lastPing:       common.NewSyncValue(time.Time{}),                        //seconds
		permanent:      common.NewSyncValue(false),                              //seconds
		showInUI:       common.NewSyncValue(false),
		uuid:           uuid.NewV4().String(),
		seeds:          common.NewSyncValue(seeds),
		// _datacenterInfo: *common.NewSyncStats(nil),
		alerts:        common.NewAlertBucket(50),
		redAlertCount: common.NewSyncValue(0),
	}

	newCluster.SetAlias(alias)

	if user != "" {
		newCluster.user = common.NewSyncValue(user)
		newCluster.password = common.NewSyncValue(password)
	}

	newNodes := map[as.Host]*Node{}
	if client != nil {
		nodes := client.GetNodes()
		for _, node := range nodes {
			newNodes[*node.GetHost()] = newNode(&newCluster, node)
		}
	}
	newCluster.nodes.Set(newNodes)

	return &newCluster
}

func (c *Cluster) setPermanent(v bool) {
	c.permanent.Set(v)
}

// ShowInUI - get show in UI flag
func (c *Cluster) ShowInUI() bool {
	return c.showInUI.Get().(bool)
}

func (c *Cluster) origClient() *as.Client {
	return c.client.Get().(*as.Client)
}

func (c *Cluster) updateLastestPing() {
	c.lastPing.Set(time.Now())
}

func (c *Cluster) shouldAutoRemove() bool {
	lastPing := c.lastPing.Get().(time.Time)

	if lastPing.IsZero() || c.permanent.Get().(bool) {
		return false
	}

	// InactiveDurBeforeRemoval <= 0 means never remove
	return c.observer.config.AMC.InactiveDurBeforeRemoval > 0 && time.Since(lastPing) > time.Duration(c.observer.config.AMC.InactiveDurBeforeRemoval)*time.Second
}

// AddNode - Add node to cluster struct
func (c *Cluster) AddNode(address string, port int) error {
	nodes := c.nodesCopy()

	hostAddrList, err := resolveHost(address)
	if err != nil || len(hostAddrList) == 0 {
		return err
	}

	for _, address := range hostAddrList {
		host := as.NewHost(address, port)
		if _, exists := nodes[*host]; exists {
			return errors.New("Node already exists")
		}
	}

	host := as.NewHost(hostAddrList[0], port)

	// This is to make sure the client will have the seed for this node
	// In case ALL nodes are removed
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	client.Cluster().AddSeeds([]*as.Host{host})

	// Node will be automatically assigned when available on cluster
	newNode := newNode(c, nil)
	newNode.origHost = host

	nodes[*host] = newNode
	c.nodes.Set(nodes)

	return nil
}

// RemoveNodeByAddress - remove node by address from cluster struct
func (c *Cluster) RemoveNodeByAddress(address string) error {
	node := c.FindNodeByAddress(address)
	if node == nil {
		return fmt.Errorf("Node %s not found", address)
	}

	if node.Status() == nodeStatus.On {
		return fmt.Errorf("Node %s is active. Only inactive nodes can be removed", address)
	}

	oldNodes := c.nodesCopy()
	newNodes := make(map[as.Host]*Node, len(oldNodes))
	for host, oldNode := range oldNodes {
		if node != oldNode {
			newNodes[host] = oldNode
		}
	}

	c.nodes.Set(newNodes)
	return nil
}

// UpdateInterval - get update interval for cluster
func (c *Cluster) UpdateInterval() int {
	return c.updateInterval.Get().(int)
}

// SetUpdateInterval - set update interval
func (c *Cluster) SetUpdateInterval(val int) {
	c.updateInterval.Set(val)

	for _, node := range c.Nodes() {
		node.setUpdateInterval(val)
	}
}

// OffNodes - turn off node for cluster
func (c *Cluster) OffNodes() []string {
	res := []string{}
	for _, node := range c.Nodes() {
		if node.Status() == nodeStatus.Off {
			res = append(res, node.Address())
		}
	}

	return res
}

// RandomActiveNode check if there is a node active
func (c *Cluster) RandomActiveNode() *Node {
	for _, node := range c.Nodes() {
		if node.Status() == nodeStatus.On {
			return node
		}
	}

	return nil
}

// Status - check cluster status and connectivity
func (c *Cluster) Status() string {
	if client := c.origClient(); client != nil && client.IsConnected() {
		return "on"
	}
	return "off"
}

// Disk - get total disk stats for cluster
func (c *Cluster) Disk() common.Stats {
	result := common.Stats{
		"used": c.aggNodeCalcStats.TryInt("used-bytes-disk", 0),
		"free": c.aggNodeCalcStats.TryInt("free-bytes-disk", 0),
	}

	details := common.Stats{}
	for _, n := range c.Nodes() {
		details[n.Address()] = n.Disk()
	}

	result["details"] = details
	return result
}

// Memory - get total memory stats for cluster
func (c *Cluster) Memory() common.Stats {
	result := common.Stats{
		"used": c.aggNodeCalcStats.TryInt("used-bytes-memory", 0),
		"free": c.aggNodeCalcStats.TryInt("free-bytes-memory", 0),
	}

	details := common.Stats{}
	for _, n := range c.Nodes() {
		details[n.Address()] = n.Memory()
	}

	result["details"] = details
	return result
}

// Users - get user list
func (c *Cluster) Users() []*as.UserRoles {
	oldUsers := c.users.Get().([]*as.UserRoles)
	res := make([]*as.UserRoles, len(oldUsers))
	copy(res, oldUsers)
	return res
}

// UpdatePassword - update password
func (c *Cluster) UpdatePassword(user, currentPass, newPass string) error {
	if currentPass == newPass {
		return errors.New("New password cannot be same as current password")
	}

	if pass := c.Password(); pass != nil && currentPass != *pass {
		return errors.New("Invalid current password")
	}

	if u := c.User(); u != nil && user != *u {
		return errors.New("Invalid current user")
	}

	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}

	err := client.ChangePassword(nil, user, newPass)
	// update password
	if err == nil {
		c.password.Set(&newPass)
	}

	return err
}

// ChangeUserPassword - change user password
func (c *Cluster) ChangeUserPassword(user, pass string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}

	return client.ChangePassword(nil, user, pass)
}

// CreateUser - create user
func (c *Cluster) CreateUser(user, password string, roles []string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.CreateUser(nil, user, password, roles)
}

// DropUser - drop user
func (c *Cluster) DropUser(user string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.DropUser(nil, user)
}

// GrantRoles - grant role to user
func (c *Cluster) GrantRoles(user string, roles []string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.GrantRoles(nil, user, roles)
}

// RevokeRoles - revoke role to user
func (c *Cluster) RevokeRoles(user string, roles []string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.RevokeRoles(nil, user, roles)
}

// CreateRole - create role
func (c *Cluster) CreateRole(role string, privileges []as.Privilege) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.CreateRole(nil, role, privileges, nil, 0, 0)
}

// DropRole - drop role
func (c *Cluster) DropRole(role string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.DropRole(nil, role)
}

// AddPrivileges - grant privs to role
func (c *Cluster) AddPrivileges(role string, privileges []as.Privilege) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.GrantPrivileges(nil, role, privileges)
}

// RemovePrivileges - revoke privs from role
func (c *Cluster) RemovePrivileges(role string, privileges []as.Privilege) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.RevokePrivileges(nil, role, privileges)
}

// CreateUDF - register UDF module
func (c *Cluster) CreateUDF(name, body string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	_, err := client.RegisterUDF(nil, []byte(body), name, as.LUA)
	return err
}

// DropUDF - remove UDF module
func (c *Cluster) DropUDF(udf string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	_, err := client.RemoveUDF(nil, udf)
	return err
}

// CreateIndex - create sindex
func (c *Cluster) CreateIndex(namespace, setName, indexName, binName, indexType string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	_, err := client.CreateIndex(nil, namespace, setName, indexName, binName, as.IndexType(indexType))
	return err
}

// DropIndex - drop sindex
func (c *Cluster) DropIndex(namespace, setName, indexName string) error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}
	return client.DropIndex(nil, namespace, setName, indexName)
}

// Nodes - add nodes to cluster
func (c *Cluster) Nodes() (nodes []*Node) {
	cNodes := c.nodes.Get().(map[as.Host]*Node)
	for _, node := range cNodes {
		nodes = append(nodes, node)
	}

	return nodes
}

// nodesCopy - copy nodes
func (c *Cluster) nodesCopy() map[as.Host]*Node {
	cNodes := c.nodes.Get().(map[as.Host]*Node)
	nodes := make(map[as.Host]*Node, len(cNodes))
	for host, node := range cNodes {
		nodes[host] = node
	}

	return nodes
}

// NodeBuilds - get builds of nodes
func (c *Cluster) NodeBuilds() (builds []string) {
	for _, node := range c.Nodes() {
		builds = append(builds, node.Build())
	}

	return common.SortStrings(common.StrUniq(builds))
}

// NamespaceList - get namespace list
func (c *Cluster) NamespaceList() (result []string) {
	for _, node := range c.Nodes() {
		for _, ns := range node.NamespaceList() {
			result = append(result, ns)
		}
	}

	return common.SortStrings(common.StrUniq(result))
}

// NamespaceIndexes - get namespace sindexes
func (c *Cluster) NamespaceIndexes() map[string][]string {
	result := map[string][]string{}
	for _, node := range c.Nodes() {
		for ns, list := range node.NamespaceIndexes() {
			result[ns] = append(result[ns], list...)
		}
	}

	for k, v := range result {
		result[k] = common.StrUniq(v)
	}

	return result
}

// NodeList - get node list
func (c *Cluster) NodeList() []string {
	clusterNodes := c.Nodes()
	nodes := make([]string, 0, len(clusterNodes))
	for _, node := range clusterNodes {
		nodes = append(nodes, node.Address())
	}

	return common.SortStrings(nodes)
}

// NodeCompatibility - get node compatibility
func (c *Cluster) NodeCompatibility() string {
	versionList := map[string][]string{}
	for _, node := range c.Nodes() {
		build := node.Build()
		versionList[build] = append(versionList[build], node.Address())
	}

	if len(versionList) <= 1 {
		return "homogeneous"
	}

	return "compatible"
}

// SeedAddress - get see addresses
func (c *Cluster) SeedAddress() string {
	return c.seeds.Get().([]*as.Host)[0].String()
}

// ID - get cluster uuid
func (c *Cluster) ID() string {
	return c.uuid
}

// User - get user name
func (c *Cluster) User() *string {
	user := c.user.Get()
	if user == nil || user.(string) == "" {
		return nil
	}
	u := user.(string)
	return &u
}

// Password - get user password
func (c *Cluster) Password() *string {
	pass := c.password.Get()
	if pass == nil || pass.(string) == "" {
		return nil
	}
	p := pass.(string)
	return &p
}

// Name - get cluster name
func (c *Cluster) Name() *string {
	for _, node := range c.Nodes() {
		if cName := node.ClusterName(); cName != "" && cName != "null" {
			return &cName
		}
	}

	return nil
}

// Alias - get cluster alias
func (c *Cluster) Alias() *string {
	alias := c.alias.Get()
	if alias != nil && len(alias.(string)) > 0 {
		alias := alias.(string)
		return &alias
	}

	if cName := c.Name(); cName != nil {
		return cName
	}

	return nil
}

// SetAlias - set cluster alias
func (c *Cluster) SetAlias(alias string) {
	alias = strings.Trim(alias, " \t")
	if len(alias) == 0 {
		c.alias.Set(nil)
		return
	}

	c.alias.Set(alias)
}

// Roles - get roles
func (c *Cluster) Roles() []*as.Role {
	oldRoles := c.roles.Get().([]*as.Role)

	if len(oldRoles) == 0 {
		return nil
	}

	res := make([]*as.Role, len(oldRoles))
	copy(res, oldRoles)
	return res
}

// RoleNames - get role names
func (c *Cluster) RoleNames() []string {
	oldRoles := c.roles.Get().([]*as.Role)

	if len(oldRoles) == 0 {
		return []string{}
	}

	res := make([]string, 0, len(oldRoles))
	for _, r := range oldRoles {
		res = append(res, r.Name)
	}

	return common.SortStrings(res)
}

func (c *Cluster) close() {
	if cl := c.origClient(); cl != nil {
		cl.Close()
		c.client.Set(nil)
	}
}

// IsSet - check if client is set
func (c *Cluster) IsSet() bool {
	return c.client.Get() != nil
}

// SecurityEnabled - check if security enabled
func (c *Cluster) SecurityEnabled() bool {
	user := c.User()
	return user != nil && len(*user) > 0
}

func (c *Cluster) shouldUpdate() bool {
	lastUpdateIfc := c.lastUpdate.Get()
	if lastUpdateIfc == nil {
		return true
	}
	lastUpdate := lastUpdateIfc.(time.Time)
	updateInterval := c.updateInterval.Get().(int)
	return lastUpdate.IsZero() || time.Since(lastUpdate) >= time.Second*time.Duration(updateInterval)
}

func (c *Cluster) setUpdatedAt(tm time.Time) {
	c.lastUpdate.Set(tm)
}

func (c *Cluster) lastUpdated() (res time.Time) {
	lastUpdateIfc := c.lastUpdate.Get()
	if lastUpdateIfc == nil {
		return res
	}

	return lastUpdateIfc.(time.Time)
}

func (c *Cluster) update(wg *sync.WaitGroup) error {
	// make sure panics do not bring the observer down
	defer func() {
		if err := recover(); err != nil {
			log.Error(string(debug.Stack()))
		}
	}()

	if wg != nil {
		defer wg.Done()
	}
	defer func() { go c.SendEmailNotifications() }()

	if !c.IsSet() {
		return nil
	}

	// update only on update intervals
	if !c.shouldUpdate() {
		return nil
	}

	t := time.Now()
	c.updateCluster()
	c.updateStats()
	c.updateJobs()
	c.updateUsers()
	c.checkHealth()
	c.updateRedAlertCount()
	log.Debugf("Updating stats for cluster %s took: %s", c.ID(), time.Since(t))

	c.setUpdatedAt(time.Now())

	return nil
}

// SendEmailNotifications - send email notification for alert
func (c *Cluster) SendEmailNotifications() {
	newAlerts := c.alerts.DrainNewAlerts()

	// only try to send notifications if the mailer settings are set
	if len(c.observer.Config().Mailer.Host) == 0 {
		return
	}

	clusterName := c.ID()
	if alias := c.Alias(); alias != nil {
		clusterName = *alias
	}

	for _, alert := range newAlerts {
		// make the data structure, and send the mail
		msg := map[string]template.HTML{
			"Title":   template.HTML(fmt.Sprintf("Alert")),
			"Cluster": template.HTML(fmt.Sprintf("%s", clusterName)),
			"Node":    template.HTML(fmt.Sprintf("%s", alert.NodeAddress)),
			"Status":  template.HTML(fmt.Sprintf("<font color='%s'><strong>%s</strong></font>", alert.Status, strings.ToUpper(string(alert.Status)))),
			"Message": template.HTML(fmt.Sprintf("%s", alert.Desc)),
		}

		go func(context map[string]template.HTML) {
			for i := 0; i < 5; i++ {
				err := mailer.SendMail(c.observer.config, "alerts/generic.html", "AMC Alert: "+sanitize.HTML(string(context["Message"])), context)
				if err == nil {
					break
				}

				log.Errorf("Failed to send the notification email: %s", err.Error())
				time.Sleep(5 * time.Second)
			}
		}(msg)
	}
}

func (c *Cluster) checkHealth() error {
	return nil
}

func (c *Cluster) updateUsers() error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}

	user := c.User()
	// update current user's privileges
	if user != nil && len(*user) > 0 {
		currentUserPrivileges := []string{}

		// this means the user do not have the privileges other than viewing its own roles
		if u, err := client.QueryUser(nil, *user); err == nil {
			for _, r := range u.Roles {
				role, err := client.QueryRole(nil, r)
				if err != nil {
					continue
				}

				for _, priv := range role.Privileges {
					currentUserPrivileges = append(currentUserPrivileges, string(priv.Code))
				}
			}

			c.currentUserPrivileges.Set(currentUserPrivileges)
		} else {
			return err
		}

	}

	users, _ := client.QueryUsers(nil)
	roles, _ := client.QueryRoles(nil)

	c.users.Set(users)
	c.roles.Set(roles)

	return nil
}

// RequestInfoAll - get all info attributes
func (c *Cluster) RequestInfoAll(cmd string) (map[*Node]string, error) {
	type nodeCommand struct {
		Node *Node
		Res  map[string]string
		Err  error
	}

	nodes := c.Nodes()
	ch := make(chan nodeCommand, len(nodes))

	wg := new(sync.WaitGroup)
	for _, node := range nodes {
		if node != nil {
			wg.Add(1)
			go func(node *Node) {
				defer wg.Done()

				result, err := node.RequestInfo(1, cmd)
				ch <- nodeCommand{Node: node, Res: result, Err: err}
			}(node)
		} else {
			ch <- nodeCommand{Node: node, Res: nil, Err: nil}
		}
	}

	wg.Wait()
	close(ch)

	res := make(map[*Node]string, len(nodes))
	errsStr := []string{}
	for r := range ch {
		res[r.Node] = ""
		if r.Err != nil {
			errsStr = append(errsStr, r.Err.Error())
			res[r.Node] = r.Err.Error()
		} else if len(r.Res) > 0 && len(r.Res[cmd]) > 0 {
			res[r.Node] = r.Res[cmd]
		}
	}

	var err error
	if len(errsStr) > 0 {
		err = errors.New(strings.Join(errsStr, ", "))
	}

	return res, err
}

func (c *Cluster) registerNode(h *as.Host, n *Node) {
	nodes := c.nodesCopy()
	nodes[*h] = n
	c.nodes.Set(nodes)
}

func (c *Cluster) updateCluster() error {
	client := c.origClient()
	if client == nil {
		return fmt.Errorf("Cluster %s has been decommissioned", c.ID())
	}

	for _, n := range client.GetNodes() {
		node := c.FindNodeByAddress(n.GetHost().String())
		if node == nil {
			node = c.FindNodeByID(n.GetName())
		}

		if node != nil {
			if origNode := node.origNode(); origNode != n {
				if origNode != nil {
					origNode.Close()
				}
				node.setOrigNode(n)
			}
		} else {
			c.registerNode(n.GetHost(), newNode(c, n))
		}
	}

	return nil
}

func (c *Cluster) updateStats() error {
	nodes := c.nodesCopy()

	// do the info calls in parallel
	wg := sync.WaitGroup{}
	wg.Add(len(nodes))
	for _, node := range nodes {
		go func(node *Node) {
			defer wg.Done()
			node.update()
		}(node)
	}
	wg.Wait()

	aggNodeStats := common.Stats{}
	aggNodeCalcStats := common.Stats{}
	aggNsStats := map[string]common.Stats{}
	aggNsCalcStats := map[string]common.Stats{}
	aggNsSetStats := map[string]map[string]common.Stats{}

	// then do the calculations synchronously, since they are fast and need synchronization anyway
	for _, node := range nodes {
		node.applyStatsToAggregate(aggNodeStats, aggNodeCalcStats)
		node.applyNsStatsToAggregate(aggNsStats, aggNsCalcStats)
		aggNsSetStats = node.applyNsSetStatsToAggregate(aggNsSetStats)
	}

	aggTotalNsStats := common.Stats{}
	for _, v := range aggNsStats {
		aggTotalNsStats.AggregateStats(v)
	}

	c.aggNodeStats.SetStats(aggNodeStats)
	c.aggNodeCalcStats.SetStats(aggNodeCalcStats)
	c.aggTotalNsStats.SetStats(aggTotalNsStats)

	c.aggNsStats.Set(aggNsStats)
	c.aggNsCalcStats.Set(aggNsCalcStats)
	c.aggNsSetStats.Set(aggNsSetStats)

	return nil
}

func (c *Cluster) versionSupported(oldest string) error {
	buildDetails := c.BuildDetails()
	verList := buildDetails["version_list"].(map[string][]string)

	for ver, nodeList := range verList {
		if version.Compare(ver, oldest, "<") {
			return fmt.Errorf("Database cluster is not supported. Latest supported version is: `v%s`. Nodes [%s] are at `v%s`", oldest, strings.Join(nodeList, ", "), ver)
		}
	}

	return nil
}

// BuildDetails - get build details for all nodes
func (c *Cluster) BuildDetails() map[string]interface{} {
	result := map[string]interface{}{}

	versionList := map[string][]string{}
	latestBuild := ""
	for _, node := range c.Nodes() {
		build := node.Build()
		versionList[build] = append(versionList[build], node.Address())
		if version.Compare(build, latestBuild, ">") {
			latestBuild = build
		}
	}

	result["version_list"] = versionList
	result["latest_build_no"] = latestBuild

	c.updateLastestPing()
	return result
}

// LatestThroughput - get latest throughput for graph
func (c *Cluster) LatestThroughput() map[string]map[string]*common.SinglePointValue {
	res := map[string]map[string]*common.SinglePointValue{}
	for _, node := range c.Nodes() {
		for statName, valueMap := range node.LatestThroughput() {
			if res[statName] == nil {
				res[statName] = valueMap
			} else {
				for nodeAddr, v := range valueMap {
					res[statName][nodeAddr] = v
				}
			}
		}
	}

	return res
}

// ServerTime - get server time
func (c *Cluster) ServerTime() time.Time {
	var tm time.Time
	for _, node := range c.Nodes() {
		if tm.Before(node.ServerTime()) {
			tm = node.ServerTime()
		}
	}

	return tm
}

// ThroughputSince - get throughput info since time
func (c *Cluster) ThroughputSince(tm time.Time) map[string]map[string][]*common.SinglePointValue {
	// if no tm specified, return for the last 30 mins
	if tm.IsZero() {
		tm = c.ServerTime().Add(-time.Minute * 30)
	}

	res := map[string]map[string][]*common.SinglePointValue{}

	// if there are no data points, return immediately
	if lu := c.lastUpdated(); lu.IsZero() || tm.After(c.lastUpdated()) {
		return res
	}

	for _, node := range c.Nodes() {
		for statName, valueMap := range node.ThroughputSince(tm) {
			if res[statName] == nil {
				res[statName] = valueMap
			} else {
				for k, v := range valueMap {
					res[statName][k] = v
				}
			}
		}
	}

	return res
}

// FindNodeByID - get node by id
func (c *Cluster) FindNodeByID(ID string) *Node {
	for _, node := range c.Nodes() {
		if node.ID() == ID {
			return node
		}
	}

	return nil
}

// FindNodeByAddress - get node by ip address
func (c *Cluster) FindNodeByAddress(address string) *Node {
	for _, node := range c.Nodes() {
		if node.Address() == address {
			return node
		}
	}

	return nil
}

// FindNodesByAddress - get node(s) by ip address
func (c *Cluster) FindNodesByAddress(addresses ...string) []*Node {
	res := make([]*Node, 0, len(addresses))
	for _, addr := range addresses {
		if node := c.FindNodeByAddress(addr); node != nil {
			res = append(res, node)
		}
	}

	return res
}

// NamespaceInfo - get namespace info
func (c *Cluster) NamespaceInfo(namespaces []string) map[string]common.Stats {
	res := make(map[string]common.Stats, len(namespaces))
	nodes := c.Nodes()
	for _, node := range nodes {
		for _, nsName := range namespaces {
			ns := node.NamespaceByName(nsName)
			if ns == nil {
				continue
			}

			nsStats := res[nsName]
			stats := ns.Stats()
			if nsStats == nil {
				nsStats = stats
			} else {
				nsStats.AggregateStats(stats)
			}

			leastDiskPct := map[string]interface{}{"node": nil, "value": nil}
			if availPct := stats.TryFloat("available_pct", -1); availPct >= 0 {
				if lpct := nsStats["least_available_pct"]; lpct != nil {
					leastDiskPct = lpct.(map[string]interface{})
				}
				if leastDiskPct["value"] == nil || availPct < leastDiskPct["value"].(float64) {
					leastDiskPct = map[string]interface{}{
						"node":  node.Address(),
						"value": availPct,
					}
				}
			}

			nsStats["master-objects-tombstones"] = fmt.Sprintf("%v / %v", common.Comma(nsStats.TryInt("master-objects", 0), ","), common.Comma(nsStats.TryInt("master_tombstones", 0), ","))
			nsStats["prole-objects-tombstones"] = fmt.Sprintf("%v / %v", common.Comma(nsStats.TryInt("prole-objects", 0), ","), common.Comma(nsStats.TryInt("prole_tombstones", 0), ","))

			nsStats["least_available_pct"] = leastDiskPct
			nsStats["cluster_status"] = c.Status()

			res[nsName] = nsStats
		}
	}

	for _, stats := range res {
		stats["repl-factor"] = stats.TryInt("repl-factor", 0) / int64(len(nodes))
	}

	return res
}

// NamespaceInfoPerNode - get namespace info per node
func (c *Cluster) NamespaceInfoPerNode(ns string, nodeAddrs []string) map[string]interface{} {
	res := make(map[string]interface{}, len(nodeAddrs))
	for _, nodeAddress := range nodeAddrs {
		node := c.FindNodeByAddress(nodeAddress)
		if node == nil {
			res[nodeAddress] = map[string]interface{}{
				"node_status": "off",
			}
			continue
		}

		ns := node.NamespaceByName(ns)
		if ns == nil {
			res[nodeAddress] = map[string]interface{}{
				"node_status": "off",
			}
			continue
		}

		nsStats := ns.StatsAttrs("master-objects", "master_tombstones", "prole-objects", "prole_tombstones")
		nodeInfo := common.Stats{
			"memory":                    ns.Memory(),
			"memory-pct":                ns.MemoryPercent(),
			"disk":                      ns.Disk(),
			"disk-pct":                  ns.DiskPercent(),
			"node_status":               node.Status(),
			"master-objects-tombstones": fmt.Sprintf("%v / %v", common.Comma(nsStats.TryInt("master-objects", 0), ","), common.Comma(nsStats.TryInt("master_tombstones", 0), ",")),
			"prole-objects-tombstones":  fmt.Sprintf("%v / %v", common.Comma(nsStats.TryInt("prole-objects", 0), ","), common.Comma(nsStats.TryInt("prole_tombstones", 0), ",")),
			"least_available_pct":       ns.StatsAttr("available_pct"),
		}

		subsetOfStats := []string{"expired-objects", "evicted-objects", "repl-factor",
			"memory-size", "free-pct-memory", "max-void-time", "hwm-breached",
			"default-ttl", "max-ttl", "max-ttl", "enable-xdr", "stop-writes",
			"available_pct", "stop-writes-pct", "hwm-breached", "single-bin",
			"data-in-memory", "type", "master-objects", "prole-objects",
			"master_tombstones", "prole_tombstones",
		}

		for k, v := range ns.StatsAttrs(subsetOfStats...) {
			nodeInfo[k] = v
		}

		res[nodeAddress] = nodeInfo
	}

	return res

}

// CurrentUserPrivileges - get current user privs
func (c *Cluster) CurrentUserPrivileges() []string {
	return c.currentUserPrivileges.Get().([]string)
}

// NamespaceIndexInfo - get namespace sindex info
func (c *Cluster) NamespaceIndexInfo(namespace string) map[string]common.Info {
	for _, node := range c.Nodes() {
		if node.Status() == "on" {
			return node.Indexes(namespace)
		}
	}

	return map[string]common.Info{}
}

// NamespaceSetsInfo - get namespace sets info
func (c *Cluster) NamespaceSetsInfo(namespace string) []common.Stats {
	attrs := []string{
		"delete", "deleting", "disable-eviction", "enable-xdr",
		"evict-hwm-count", "memory_data_bytes", "n_objects", "node_status",
		"ns", "ns_name", "objects", "set",
		"set_name", "stop-write-count", "stop-writes-count", "tombstones",
	}

	res := []common.Stats{}
	if setInfo := c.aggNsSetStats.Get().(map[string]map[string]common.Stats)[namespace]; setInfo != nil {
		for _, v := range setInfo {
			res = append(res, v.GetMulti(attrs...))
		}
	}

	return res
}

func (c *Cluster) updateJobs() {
	res := []common.Stats{}
	for _, node := range c.Nodes() {
		for _, job := range node.Jobs() {
			job["node"] = common.Stats{
				"address":     node.Address(),
				"node_status": node.Status(),
				"build":       node.Build(),
				"memory":      node.Memory(),
			}

			res = append(res, job)
		}
	}

	c.jobs.Set(res)
}

// Jobs - get scan jobs
func (c *Cluster) Jobs() []common.Stats {
	res := c.jobs.Get()
	if res == nil {
		return []common.Stats{}
	}

	return res.([]common.Stats)
}

// NamespaceDeviceInfo - get namespace device info
func (c *Cluster) NamespaceDeviceInfo(namespace string) common.Stats {
	storageTypes := map[string][]string{}
	storageDevices := map[string][]string{}

	for _, node := range c.Nodes() {
		ns := node.NamespaceByName(namespace)
		storageType := ns.StatsAttr("type")
		if storageType != nil {
			storageTypes[storageType.(string)] = append(storageTypes[storageType.(string)], node.Address())
		}
		storageDevice := ns.StatsAttr("storage-engine")
		if storageDevice != nil {
			storageDevices[storageDevice.(string)] = append(storageDevices[storageDevice.(string)], node.Address())
		}
	}

	syncedStatus := len(storageTypes) <= 1
	return common.Stats{
		"cluster_status": "on",
		"synced":         syncedStatus,
		"storage":        storageTypes,
		"devices":        storageDevices,
	}
}

// DatacenterInfo - get XDR DC info
func (c *Cluster) DatacenterInfo(sessionID string) common.Stats {
	xdrInfo := map[string]common.Stats{}
	datacenterList := []string{}
	nodeStats := common.Stats{}
	remoteNodeStats := map[string]common.Stats{}
	for _, node := range c.Nodes() {
		dcs := node.DataCenters()
		for dcName, dcStats := range dcs {
			datacenterList = append(datacenterList, dcName)

			for _, nodeAddr := range dcStats["Nodes"].([]string) {
				remoteNodeStats[nodeAddr] = c.discoverDatacenter(sessionID, dcStats)
				oldCluster := c.observer.NodeHasBeenDiscovered(sessionID, nodeAddr)
				if oldCluster == nil {
					xdrInfo[nodeAddr] = common.Stats{"shipping_namespaces": dcStats["namespaces"].([]string)}
				} else {
					snIfc := xdrInfo[oldCluster.ID()]["shipping_namespaces"]
					if snIfc == nil {
						snIfc = []string{}
					}
					if xdrInfo[oldCluster.ID()] == nil {
						xdrInfo[oldCluster.ID()] = common.Stats{}
					}
					xdrInfo[oldCluster.ID()]["shipping_namespaces"] = common.StrUniq(append(snIfc.([]string), dcStats["namespaces"].([]string)...))
				}
			}
		}

		nodeStats[node.ID()] = common.Stats{
			"status":         node.Status(),
			"access_ip":      node.Host(),
			"access_port":    node.Port(),
			"ip":             node.Host(),
			"port":           node.Port(),
			"cur_throughput": 0,
			"lag":            node.StatsAttr("xdr_timelag"),
		}
	}

	readTotal, readSucc := 0.0, 0.0
	writeTotal, writeSucc := 0.0, 0.0
	zeroValue := float64(0)
	for stat, nodeMap := range c.LatestThroughput() {
		switch stat {
		case "stat_read_reqs":
			for _, v := range nodeMap {
				readTotal += *v.Value(&zeroValue)
			}
		case "stat_read_success":
			for _, v := range nodeMap {
				readSucc += *v.Value(&zeroValue)
			}
		case "stat_write_reqs":
			for _, v := range nodeMap {
				writeTotal += *v.Value(&zeroValue)
			}
		case "stat_write_success":
			for _, v := range nodeMap {
				writeSucc += *v.Value(&zeroValue)
			}
		}
	}

	return common.Stats{
		"seednode": c.SeedAddress(),
		"dc_name":  common.StrUniq(datacenterList),

		"xdr_info": xdrInfo,

		"cluster_name": c.Alias(),
		"namespaces":   c.NamespaceList(),
		"discovery":    "complete",
		"nodes":        nodeStats,
		"read_tps": common.Stats{
			"total":   readTotal,
			"success": readSucc,
		},
		"write_tps": common.Stats{
			"total":   writeTotal,
			"success": writeSucc,
		},

		"_remotes": remoteNodeStats,
	}
}

func (c *Cluster) discoverDatacenter(sessionID string, dc common.Stats) common.Stats {
	for _, nodeAddr := range dc["Nodes"].([]string) {
		host, port, err := common.SplitHostPort(nodeAddr)
		if err != nil {
			continue
		}

		readTotal, readSucc := 0.0, 0.0
		writeTotal, writeSucc := 0.0, 0.0
		zeroValue := float64(0)
		for stat, nodeMap := range c.LatestThroughput() {
			switch stat {
			case "stat_read_reqs":
				for _, v := range nodeMap {
					readTotal += *v.Value(&zeroValue)
				}
			case "stat_read_success":
				for _, v := range nodeMap {
					readSucc += *v.Value(&zeroValue)
				}
			case "stat_write_reqs":
				for _, v := range nodeMap {
					writeTotal += *v.Value(&zeroValue)
				}
			case "stat_write_success":
				for _, v := range nodeMap {
					writeSucc += *v.Value(&zeroValue)
				}
			}
		}

		if c.observer.NodeHasBeenDiscovered(sessionID, nodeAddr) == nil {
			return common.Stats{
				"dc_name":      []string{dc["DC_Name"].(string)},
				"discovery":    "available", // TODO: think about this
				"seednode":     nodeAddr,
				"xdr_info":     common.Stats{},
				"cluster_name": c.Alias(),
				"namespaces":   []struct{}{},
				"nodes": common.Stats{
					nodeAddr: common.Stats{
						"status":         "off",
						"access_ip":      host,
						"cur_throughput": readTotal + writeTotal,
						"ip":             host,
						"access_port":    port,
						"xdr_uptime":     nil,
						"lag":            nil,
					},
				}, "read_tps": common.Stats{
					"total":   readTotal,
					"success": readSucc,
				},
				"write_tps": common.Stats{
					"total":   writeTotal,
					"success": writeSucc,
				},
			}
		}
	}
	return nil
}

// AlertsFrom - get alerts by node id
func (c *Cluster) AlertsFrom(id int64) []*common.Alert {
	alerts := []*common.Alert{}
	for _, node := range c.Nodes() {
		alerts = append(alerts, node.AlertsFrom(id)...)
	}

	cid := c.ID()
	for _, alert := range alerts {
		alert.ClusterID = cid
	}

	return alerts
}

func (c *Cluster) updateRedAlertCount() {
	count := 0
	for _, node := range c.Nodes() {
		count += c.alerts.RedAlertsFrom(node.Address(), 0)
	}

	c.redAlertCount.Set(count)
}

// RedAlertCount - count red alerts
func (c *Cluster) RedAlertCount() int {
	return c.redAlertCount.Get().(int)
}

// Backup - backup cluster
func (c *Cluster) Backup(
	Namespace string,
	DestinationAddress string,
	DestinationPath string,
	Username string,
	Password string,
	Sets string,
	MetadataOnly bool,
	TerminateOnChange bool,
	ModifiedBefore string,
	ModifiedAfter string,
	ScanPriority int) (*Backup, error) {

	if c.CurrentBackup() != nil && c.CurrentBackup().Status == common.BackupStatusInProgress {
		return nil, errors.New("Another backup operation already exists and is in progress")
	}

	newBackup := &Backup{
		BackupRestore: common.NewBackupRestore(
			common.BackupRestoreTypeBackup,
			c.ID(),
			Namespace,
			DestinationAddress,
			Username,
			Password,
			DestinationPath,
			Sets,
			MetadataOnly,
			TerminateOnChange,
			ScanPriority,
			ModifiedBefore,
			ModifiedAfter,
			common.BackupStatusInProgress,
		),

		cluster: c,
	}

	if err := newBackup.Save(); err != nil {
		return nil, err
	}

	c.activeBackup.Set(newBackup)

	// no need to set the activeBackup to nil, since it will be ignored in the condition above
	return newBackup, newBackup.Execute()
}

// CurrentBackup - get current backup settings
func (c *Cluster) CurrentBackup() *Backup {
	if b := c.activeBackup.Get(); b != nil {
		return b.(*Backup)
	}
	return nil
}

// Restore - restore
func (c *Cluster) Restore(
	Namespace string,
	DestinationAddress string,
	DestinationPath string,
	Username string,
	Password string,
	Threads int,
	MissingRecordsOnly bool,
	IgnoreGenerationNum bool) (*Restore, error) {

	if c.CurrentRestore() != nil && c.CurrentRestore().Status == common.BackupStatusInProgress {
		return nil, errors.New("Another backup operation already exists and is in progress")
	}

	newRestore := &Restore{
		BackupRestore: common.NewBackupRestore(
			common.BackupRestoreTypeRestore,
			c.ID(),
			Namespace,
			DestinationAddress,
			Username,
			Password,
			DestinationPath,
			"",
			false,
			false,
			2,
			"",
			"",
			common.BackupStatusInProgress,
		),

		Threads:             Threads,
		MissingRecordsOnly:  MissingRecordsOnly,
		IgnoreGenerationNum: IgnoreGenerationNum,

		cluster: c,
	}

	if err := newRestore.Save(); err != nil {
		return nil, err
	}

	c.activeRestore.Set(newRestore)

	// no need to set the activeRestore to nil, since it will be ignored in the condition above
	return newRestore, newRestore.Execute()
}

// CurrentRestore - get current resotre info
func (c *Cluster) CurrentRestore() *Restore {
	if r := c.activeRestore.Get(); r != nil {
		return r.(*Restore)
	}
	return nil

}

// SameAs compares nodes between two clusters and returns true
// if the two clusters have at least one node in common.
func (c *Cluster) SameAs(other *Cluster) bool {
	for _, node := range c.Nodes() {
		for _, oNode := range other.Nodes() {
			if node.ID() == oNode.ID() || node.Address() == oNode.Address() {
				return true
			}
		}
	}

	return false
}

// ValidCurrentUser - check if current value is valid
func (c *Cluster) ValidCurrentUser(user, password string) bool {
	cUser := ""
	if u := c.User(); u != nil {
		cUser = *u
	}

	cPass := ""
	if p := c.Password(); p != nil {
		cPass = *p
	}

	return cUser == user && cPass == password
}
