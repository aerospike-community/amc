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
	sessions map[string][]*Cluster

	clusters []*Cluster
	mutex    sync.RWMutex

	notifyCloseChan chan struct{}
}

func New() *observerT {
	o := &observerT{
		sessions: map[string][]*Cluster{},
		clusters: []*Cluster{},
	}
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

func (o *observerT) AppendCluster(sessionId string, cluster *Cluster) {
	o.mutex.Lock()
	defer o.mutex.Unlock()

	cExists := false
	for _, c := range o.clusters {
		if c == cluster {
			cExists = true
			break
		}
	}

	if !cExists {
		o.clusters = append(o.clusters, cluster)
	}

	// make sure the cluster is not already included in the session
	for _, c := range o.sessions[sessionId] {
		if c == cluster {
			return
		}
	}

	o.sessions[sessionId] = append(o.sessions[sessionId], cluster)
}

func (o *observerT) Register(sessionId string, policy *as.ClientPolicy, host string, port uint16) (*Cluster, error) {
	client, err := as.NewClientWithPolicy(policy, host, int(port))
	if err != nil {
		return nil, err
	}

	cluster := newCluster(o, client, policy.User, policy.Password, host, port)
	o.AppendCluster(sessionId, cluster)
	o.updateClusters()

	return cluster, nil
}

func (o *observerT) SessionExists(sessionId string) bool {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	_, exists := o.sessions[sessionId]
	return exists
}

func (o *observerT) MonitoringClusters(sessionId string) ([]*Cluster, error) {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	var clusters []*Cluster
	// var exist bool

	// if !common.AMCIsEnterprise() {
	clusters = o.clusters
	// } else {
	// 	clusters, exist = o.sessions[sessionId]
	// 	if !exist {
	// 		return nil, errors.New("Invalid session")
	// 	}
	// }

	return clusters, nil
}

func (o *observerT) FindClusterById(id string) *Cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	for _, cluster := range o.clusters {
		if cluster.Id() == id {
			return cluster
		}
	}
	return nil
}

func (o *observerT) NodeHasBeenDiscovered(alias string) *Cluster {
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

func (o *observerT) FindClusterBySeed(sessionId string, host string, port int, user, password string) *Cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	aliases := findAliases(host, port)
	for _, cluster := range o.clusters {
		for _, node := range cluster.nodes {
			for _, alias := range aliases {
				if node.Address() == alias {
					if cluster.user == nil || (*cluster.user == user && *cluster.password == password) {
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
