package observer

import (
	"net"
	"strconv"
	"strings"
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go"

	"github.com/citrusleaf/amc/common"
)

type observerT struct {
	sessions map[string]*cluster

	clusters []*cluster
	mutex    sync.RWMutex

	notifyCloseChan chan struct{}
}

func New() *observerT {
	o := &observerT{}
	go o.observe()

	return o
}

func (o *observerT) stop() {
	close(o.notifyCloseChan)
}

func (o *observerT) updateClusters() {
	o.mutex.Lock()
	defer o.mutex.Unlock()

	wg := new(sync.WaitGroup)
	wg.Add(len(o.clusters))
	for _, c := range o.clusters {
		// No need to manage panics here, since update codes are
		// running in an isolated go routine
		if c.IsSet() {
			go c.update(wg)
		}
	}
	wg.Wait()
}

func (o *observerT) observe() {
	// update as soon as initiated once
	o.updateClusters()

	for {
		select {

		case <-time.After(time.Second * 5):
			o.updateClusters()

		case <-o.notifyCloseChan:
			o.mutex.Lock()
			for _, c := range o.clusters {
				go c.close()
			}
			o.clusters = nil
			o.mutex.Unlock()

			return
		}
	}
}

func (o *observerT) appendCluster(cluster *cluster) {
	o.mutex.Lock()
	defer o.mutex.Unlock()

	o.clusters = append(o.clusters, cluster)
}

func (o *observerT) Session(sessionId string) *cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()
	return o.sessions[sessionId]
}

func (o *observerT) Register(policy *as.ClientPolicy, host string, port uint16) (*cluster, error) {
	client, err := as.NewClientWithPolicy(policy, host, int(port))
	if err != nil {
		return nil, err
	}

	// log.Info(client.Cluster().GetSeeds())
	// log.Info(client.Cluster().GetAliases())

	cluster := newCluster(o, client, policy.User, host, port)
	o.appendCluster(cluster)
	o.updateClusters()

	return cluster, nil
}

func (o *observerT) MonitoringClusters() []map[string]interface{} {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	result := make([]map[string]interface{}, len(o.clusters))
	for i, cluster := range o.clusters {
		result[i] = map[string]interface{}{
			"username":     cluster.user,
			"cluster_name": cluster.alias,
			"cluster_id":   cluster.Id(),
			"roles":        cluster.roles,
			"seed_node":    cluster.SeedAddress(),
		}
	}

	return result
}

func (o *observerT) FindClusterById(id string) *cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	for _, cluster := range o.clusters {
		if cluster.Id() == id {
			return cluster
		}
	}
	return nil
}

func (o *observerT) NodeHasBeenDiscovered(alias string) *cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	for _, cluster := range o.clusters {
		for host, _ := range cluster.client.Cluster().GetAliases() {
			if strings.ToLower(host.Name+":"+strconv.Itoa(host.Port)) == strings.ToLower(alias) {
				return cluster
			}
		}
	}
	return nil
}

func (o *observerT) FindClusterBySeed(host string, port int, user string) *cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	aliases := findAliases(host, port)
	for _, cluster := range o.clusters {
		for _, node := range cluster.nodes {
			for _, alias := range aliases {
				if node.Address() == alias {
					if cluster.user == nil || *cluster.user == user {
						return cluster
					}
				}
			}
		}
	}
	return nil
}

func (o *observerT) DatacenterInfo() common.Stats {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	res := map[string]common.Stats{}
	for _, cluster := range o.clusters {
		res[cluster.Id()] = cluster.DatacenterInfo()
	}

	for _, v := range res {
		remotesIfc := v["_remotes"]
		if remotesIfc == nil {
			continue
		}
		remotes := remotesIfc.(map[string]common.Stats)
		for addr, stats := range remotes {
			if stats != nil {
				res[addr] = stats
			}
		}
		delete(v, "_remotes")
	}

	return common.Stats{
		"status": "success",
		"data":   res,
	}
}

func splitAddr(addr string) (string, int) {
	index := strings.LastIndex(addr, ":")
	if index < 0 {
		return addr, 0
	}

	port := 0
	portStr := addr[index:]
	if len(portStr) > 1 {
		var err error
		port, err = strconv.Atoi(portStr)
		if err != nil {
			return addr, 0
		}
	}
	return addr[:index], port
}

func findAliases(address string, port int) []string {
	portStr := strconv.Itoa(port)

	// IP addresses do not need a lookup
	ip := net.ParseIP(address)
	if ip != nil {
		return []string{address + ":" + portStr}
	}

	addresses, err := net.LookupHost(address)
	if err != nil {
		return nil
	}
	aliases := make([]string, 0, len(addresses))
	for _, addr := range addresses {
		aliases = append(aliases, addr+":"+portStr)
	}
	return aliases
}
