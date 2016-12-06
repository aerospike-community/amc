package observer

import (
	"fmt"
	"strings"
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	"github.com/mcuadros/go-version"
	"github.com/satori/go.uuid"

	"github.com/aerospike/aerospike-console/common"
)

type cluster struct {
	client *as.Client
	nodes  map[as.Host]*node

	aggNodeStats, aggNodeCalcStats       common.Stats
	aggNsStats, aggNsCalcStats           map[string]common.Stats
	aggTotalNsStats, aggTotalNsCalcStats common.Stats
	aggNsSetStats                        map[string]map[string]common.Stats // [namespace][set]aggregated stats

	// either a uuid.V4, or a sorted comma delimited string of host:port
	uuid            string
	securityEnabled bool
	updateInterval  int // seconds

	alias *string
	user  *string
	roles *string

	mutex sync.RWMutex
}

func newCluster(client *as.Client, user string) *cluster {
	newCluster := cluster{
		client:         client,
		nodes:          map[as.Host]*node{},
		updateInterval: 5, //seconds
		uuid:           uuid.NewV4().String(),
	}

	if user != "" {
		newCluster.user = &user
	}

	if client != nil {
		nodes := client.GetNodes()
		for _, node := range nodes {
			newCluster.nodes[*node.GetHost()] = newNode(&newCluster, node)
		}
	}

	return &newCluster
}

func (c *cluster) UpdateInterval() int {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	return c.updateInterval
}

func (c *cluster) OffNodes() []string {
	return []string{}
}

func (c *cluster) Status() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	if c.client.IsConnected() {
		return "on"
	}
	return "off"
}

func (c *cluster) Disk() common.Stats {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	result := common.Stats{
		"used": c.aggNodeCalcStats["used-bytes-disk"],
		"free": c.aggNodeCalcStats["free-bytes-disk"],
	}

	details := common.Stats{}
	for _, n := range c.nodes {
		details[n.Address()] = n.Disk()
	}

	result["details"] = details
	return result
}

func (c *cluster) Memory() common.Stats {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	result := common.Stats{
		"used": c.aggNodeCalcStats["used-bytes-memory"],
		"free": c.aggNodeCalcStats["free-bytes-memory"],
	}

	details := common.Stats{}
	for _, n := range c.nodes {
		details[n.Address()] = n.Memory()
	}

	result["details"] = details
	return result
}

func (c *cluster) Users() map[string]interface{} {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	users, err := c.client.QueryUsers(nil)
	if err != nil {
		return map[string]interface{}{
			"status": "failure",
			"error":  err.Error(),
		}
	}

	resUsers := []string{}
	resRoles := []string{}

	for i := range users {
		resUsers = append(resUsers, users[i].User)
		resRoles = append(resRoles, users[i].Roles...)
	}

	return map[string]interface{}{
		"status": "success",
		"users":  common.StrUniq(resUsers),
		"roles":  common.StrUniq(resRoles),
	}
}

func (c *cluster) Nodes() (nodes []*node) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	for _, node := range c.nodes {
		nodes = append(nodes, node)
	}

	return nodes
}

func (c *cluster) NodeBuilds() (builds []string) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	for _, node := range c.nodes {
		builds = append(builds, node.Build())
	}

	return common.StrUniq(builds)
}

func (c *cluster) NamespaceList() (result []string) {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	for _, node := range c.nodes {
		for _, ns := range node.NamespaceList() {
			result = append(result, ns)
		}
	}

	return common.StrUniq(result)
}

func (c *cluster) NamespaceIndexes() map[string][]string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	result := map[string][]string{}
	for _, node := range c.nodes {
		for ns, list := range node.NamespaceIndexes() {
			result[ns] = append(result[ns], list...)
		}
	}

	for k, v := range result {
		result[k] = common.StrUniq(v)
	}

	return result
}

func (c *cluster) NodeList() []string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	nodes := make([]string, 0, len(c.nodes))
	for _, node := range c.nodes {
		nodes = append(nodes, node.Address())
	}

	return nodes
}

func (c *cluster) NodeCompatibility() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	versionList := map[string][]string{}
	for _, node := range c.nodes {
		build := node.Build()

		if version.Compare(build, "3.9.0", "<") {
			return "incompatible"
		}

		versionList[build] = append(versionList[build], node.Address())
	}

	if len(versionList) <= 1 {
		return "homogeneous"
	}

	return "compatible"
}

func (c *cluster) SeedAddress() string {
	return ""
}

func (c *cluster) Id() string {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	return c.uuid
}

func (c *cluster) close() {
	c.client.Close()
}

func (c *cluster) IsSet() bool {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	return c.client != nil
}

func (c *cluster) setSecurityEnabled() {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.securityEnabled = true
}

func (c *cluster) SecurityEnabled() bool {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	return c.securityEnabled
}

func (c *cluster) update(wg *sync.WaitGroup) error {
	defer wg.Done()

	t := time.Now()
	c.checkHealth()
	c.updateStats()
	log.Debugf("Updating stats for cluster took: %s", time.Since(t))

	return nil
}

func (c *cluster) checkHealth() error {
	return nil
}

func (c *cluster) updateStats() error {
	aggNodeStats := common.Stats{}
	aggNodeCalcStats := common.Stats{}
	aggNsStats := map[string]common.Stats{}
	aggNsCalcStats := map[string]common.Stats{}
	aggNsSetStats := map[string]map[string]common.Stats{}

	for _, node := range c.nodes {
		node.update()
		node.applyStatsToAggregate(aggNodeStats, aggNodeCalcStats)
		node.applyNsStatsToAggregate(aggNsStats, aggNsCalcStats)
		aggNsSetStats = node.applyNsSetStatsToAggregate(aggNsSetStats)
	}

	aggTotalNsStats := common.Stats{}
	for _, v := range aggNsStats {
		aggTotalNsStats.AggregateStats(v)
	}

	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.aggNodeStats = aggNodeStats
	c.aggNodeCalcStats = aggNodeCalcStats
	c.aggNsStats = aggNsStats
	c.aggNsCalcStats = aggNsCalcStats
	c.aggTotalNsStats = aggTotalNsStats
	c.aggNsSetStats = aggNsSetStats

	log.Debugf("..., objects in test: %d, total objects in namespaces: %d, total node objects: %d", aggNsStats["test"]["objects"], aggTotalNsStats["objects"], aggNodeStats["objects"])

	return nil
}

func (c *cluster) BuildDetails() map[string]interface{} {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	result := map[string]interface{}{}

	versionList := map[string][]string{}
	latestBuild := ""
	for _, node := range c.nodes {
		build := node.Build()
		versionList[build] = append(versionList[build], node.Address())
		if version.Compare(build, latestBuild, ">") {
			latestBuild = build
		}
	}

	result["version_list"] = versionList
	result["latest_build_no"] = latestBuild

	return result
}

func (c *cluster) LatestThroughput() map[string]map[string]*common.SinglePointValue {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	res := map[string]map[string]*common.SinglePointValue{}
	for _, node := range c.nodes {
		for statName, valueMap := range node.LatestThroughput() {
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

func (c *cluster) ThroughputSince(tm time.Time) map[string]map[string][]*common.SinglePointValue {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	res := map[string]map[string][]*common.SinglePointValue{}
	for _, node := range c.nodes {
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

func (c *cluster) FindNodeByAddress(address string) *node {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	for _, node := range c.nodes {
		if node.Address() == address {
			return node
		}
	}

	return nil
}

func (c *cluster) NamespaceInfoPerNode(ns string, nodeAddrs []string) map[string]interface{} {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

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

		nodeInfo := common.Stats{
			"memory":                    ns.Memory(),
			"memory-pct":                ns.MemoryPercent(),
			"disk":                      ns.Disk(),
			"disk-pct":                  ns.DiskPercent(),
			"node_status":               node.Status(),
			"master-objects-tombstones": fmt.Sprintf("%v, %v", ns.StatsAttr("master-objects"), ns.StatsAttr("master_tombstones")),
			"prole-objects-tombstones":  fmt.Sprintf("%v, %v", ns.StatsAttr("prole-objects"), ns.StatsAttr("prole_tombstones")),
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

func (c *cluster) CurrentUserRoles() []string {
	list, err := c.client.QueryUsers(nil)

	fmt.Println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>", list, err)

	for _, u := range list {
		if strings.ToLower(u.User) == *c.user {
			return u.Roles
		}
	}
	return []string{}
}

func (c *cluster) NamespaceIndexInfo(namespace string) map[string]common.Info {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	for _, node := range c.nodes {
		if node.Status() == "on" {
			return node.Indexes(namespace)
		}
	}

	return map[string]common.Info{}
}

func (c *cluster) NamespaceSetsInfo(namespace string) []common.Stats {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	attrs := []string{
		"delete", "deleting", "disable-eviction", "enable-xdr",
		"evict-hwm-count", "memory_data_bytes", "n_objects", "node_status",
		"ns", "ns_name", "objects", "set",
		"set_name", "stop-write-count", "stop-writes-count", "tombstones",
	}

	res := []common.Stats{}
	if setInfo := c.aggNsSetStats[namespace]; setInfo != nil {
		for _, v := range setInfo {
			res = append(res, v.GetMulti(attrs...))
		}
	}

	return res
}
