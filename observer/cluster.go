package observer

import (
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"

	"github.com/aerospike/aerospike-console/common"
)

type cluster struct {
	client *as.Client
	nodes  map[as.Host]*node

	aggNodeStats               common.Stats
	aggNsStats, aggNsCalcStats map[string]common.Stats
	aggTotalNsStats            common.Stats

	mutex sync.RWMutex
}

func newCluster(client *as.Client) *cluster {
	newCluster := cluster{
		client: client,
		nodes:  map[as.Host]*node{},
	}

	nodes := client.GetNodes()
	for _, node := range nodes {
		newCluster.nodes[*node.GetHost()] = newNode(node)
	}

	return &newCluster
}

func (c *cluster) close() {
	c.client.Close()
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
	aggNsStats := map[string]common.Stats{}
	aggNsCalcStats := map[string]common.Stats{}

	for _, node := range c.nodes {
		node.update()
		node.applyStatsToAggregate(aggNodeStats)
		node.applyNsStatsToAggregate(aggNsStats, aggNsCalcStats)
		// log.Debugf("%v", aggNsStats)
	}

	aggTotalNsStats := common.Stats{}
	for _, v := range aggNsStats {
		aggTotalNsStats.AggregateStats(v)
	}

	c.mutex.Lock()
	defer c.mutex.Unlock()
	c.aggNodeStats = aggNodeStats
	c.aggNsStats = aggNsStats
	c.aggNsCalcStats = aggNsCalcStats
	c.aggTotalNsStats = aggTotalNsStats

	// log.Debug(aggNodeStats)
	log.Debugf("..., objects in test: %d, total objects in namespaces: %d, total node objects: %d", aggNsStats["test"]["objects"], aggTotalNsStats["objects"], aggNodeStats["objects"])

	return nil
}
