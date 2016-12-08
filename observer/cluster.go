package observer

import (
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	"github.com/mcuadros/go-version"
	"github.com/satori/go.uuid"

	"github.com/citrusleaf/amc/common"
)

type cluster struct {
	observer *observerT
	client   *as.Client
	nodes    map[as.Host]*node

	aggNodeStats, aggNodeCalcStats       common.Stats
	aggNsStats, aggNsCalcStats           map[string]common.Stats
	aggTotalNsStats, aggTotalNsCalcStats common.Stats
	aggNsSetStats                        map[string]map[string]common.Stats // [namespace][set]aggregated stats

	// either a uuid.V4, or a sorted comma delimited string of host:port
	uuid            string
	securityEnabled bool
	updateInterval  int // seconds

	seed  string
	alias *string
	user  *string
	roles *string

	mutex sync.RWMutex
}

func newCluster(observer *observerT, client *as.Client, user, host string, port uint16) *cluster {
	newCluster := cluster{
		observer:       observer,
		client:         client,
		nodes:          map[as.Host]*node{},
		updateInterval: 5, //seconds
		uuid:           uuid.NewV4().String(),
		seed:           host + ":" + strconv.Itoa(int(port)),
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
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	res := []string{}
	for _, node := range c.nodes {
		if node.status == nodeStatus.Off {
			res = append(res, node.Address())
		}
	}

	return res
}

func (c *cluster) RandomActiveNode() *node {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	for _, node := range c.nodes {
		if node.Status() == nodeStatus.On {
			return node
		}
	}

	return nil
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
	return c.seed
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

func (c *cluster) FindNodesByAddress(addresses ...string) []*node {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	res := make([]*node, 0, len(addresses))
	for _, addr := range addresses {
		if node := c.FindNodeByAddress(addr); node != nil {
			res = append(res, node)
		}
	}

	return res
}

func (c *cluster) NamespaceInfo(namespaces []string) map[string]common.Stats {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	res := make(map[string]common.Stats, len(namespaces))
	for _, node := range c.nodes {
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

			nsStats["least_available_pct"] = leastDiskPct
			nsStats["cluster_status"] = c.Status()
			res[nsName] = nsStats
		}
	}

	return res
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
	// TODO: do this on cluster update
	var list []*as.UserRoles
	for i := 0; i < 3; i++ {
		var err error
		list, err = c.client.QueryUsers(nil)
		if err != nil {
			log.Errorf("Error encountered querying the users: %s", err)
		}
		break
	}

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

func (c *cluster) DatacenterInfo() common.Stats {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	xdrInfo := map[string]common.Stats{}
	datacenterList := []string{}
	nodeStats := common.Stats{}
	remoteNodeStats := map[string]common.Stats{}
	for _, node := range c.Nodes() {
		dcs := node.DataCenters()
		for dcName, dcStats := range dcs {
			datacenterList = append(datacenterList, dcName)

			for _, nodeAddr := range dcStats["Nodes"].([]string) {
				remoteNodeStats[nodeAddr] = c.DiscoverDatacenter(dcStats)
				oldCluster := c.observer.NodeHasBeenDiscovered(nodeAddr)
				if oldCluster == nil {
					xdrInfo[nodeAddr] = common.Stats{"shipping_namespaces": dcStats["namespaces"].([]string)}
				} else {
					snIfc := xdrInfo[oldCluster.Id()]["shipping_namespaces"]
					if snIfc == nil {
						snIfc = []string{}
					}
					if xdrInfo[oldCluster.Id()] == nil {
						xdrInfo[oldCluster.Id()] = common.Stats{}
					}
					xdrInfo[oldCluster.Id()]["shipping_namespaces"] = common.StrUniq(append(snIfc.([]string), dcStats["namespaces"].([]string)...))
				}
			}
		}

		nodeStats[node.Id()] = common.Stats{
			"status":         node.Status(),
			"access_ip":      node.Host(),
			"access_port":    node.Port(),
			"ip":             node.Host(),
			"port":           node.Port(),
			"cur_throughput": 0,
			"xdr_uptime":     node.StatsAttr("xdr_uptime"),
			"lag":            node.StatsAttr("xdr_timelag"),
		}
	}

	return common.Stats{
		"seednode": c.seed,
		"dc_name":  common.StrUniq(datacenterList),

		"xdr_info": xdrInfo,

		"cluster_name": c.alias,
		"namespaces":   c.NamespaceList(),
		"discovery":    "complete",
		"nodes":        nodeStats,
		"read_tps": common.Stats{
			"total":   "0",
			"success": "0",
		},
		"write_tps": common.Stats{
			"total":   "0",
			"success": "0",
		},

		"_remotes": remoteNodeStats,
	}
}

func (c *cluster) DiscoverDatacenter(dc common.Stats) common.Stats {
	for _, nodeAddr := range dc["Nodes"].([]string) {
		host, port, err := common.SplitHostPort(nodeAddr)
		if err != nil {
			return nil
		}
		if c.observer.NodeHasBeenDiscovered(nodeAddr) == nil {
			return common.Stats{
				"dc_name":      []string{dc["DC_Name"].(string)},
				"discovery":    "secured", // TODO: think about this
				"seednode":     nodeAddr,
				"xdr_info":     common.Stats{},
				"cluster_name": nil,
				"namespaces":   []struct{}{},
				"nodes": common.Stats{
					nodeAddr: common.Stats{
						"status":         "off",
						"access_ip":      host,
						"cur_throughput": nil,
						"ip":             host,
						"access_port":    port,
						"xdr_uptime":     nil,
						"port":           port,
						"lag":            nil,
					},
				}, "read_tps": common.Stats{
					"total":   "0",
					"success": "0",
				},
				"write_tps": common.Stats{
					"total":   "0",
					"success": "0",
				},
			}
		}
	}
	return nil
}
