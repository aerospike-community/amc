package models

import (
	"database/sql"
	"net"
	"runtime/debug"
	"strconv"
	"strings"
	"sync"
	"time"

	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	"github.com/sasha-s/go-deadlock"

	"github.com/citrusleaf/amc/common"
)

// sqlite3 database
var db *sql.DB

type ObserverT struct {
	sessions map[string][]*Cluster
	config   *common.Config

	clusters []*Cluster
	mutex    deadlock.RWMutex

	notifyCloseChan chan struct{}
}

func New(config *common.Config) *ObserverT {

	// try to connect to the database
	if db != nil {
		db.Close()
	}

	var err error
	if db, err = sql.Open("sqlite3", config.AMC.Database); err != nil {
		log.Errorln("Cannot connect to the database: %s", err.Error())
	}
	db.SetMaxOpenConns(1)

	o := &ObserverT{
		sessions: map[string][]*Cluster{},
		clusters: []*Cluster{},
		config:   config,
	}
	go o.observe(config)

	// Add Monitoring servers to the cluster
	// These clusters do not belong to any sessions, but will
	for _, server := range config.AMC.Clusters {
		cp := as.NewClientPolicy()
		cp.User = server.User
		cp.Password = server.Password

		cluster := o.FindClusterBySeed("automatic", server.Host, int(server.Port), server.User, server.Password)
		if cluster == nil {
			log.Warn("Adding host", server.Host, ":", server.Port, " user: ", server.User, " Pass: ", server.Password)
			cluster, err = o.Register("automatic", cp, &server.Alias, server.Host, server.Port)
			if err != nil {
				log.Error("Error while trying to add database from config file for monitoring: ", err.Error())
				continue
			}

		}
		// mark it so it won't be removed automatically
		cluster.permanent = true
	}

	return o
}

func (o *ObserverT) stop() {
	close(o.notifyCloseChan)
}

func (o *ObserverT) updateClusters() {
	clusters := o.Clusters()

	wg := new(sync.WaitGroup)
	wg.Add(len(clusters))
	for _, c := range clusters {
		// No need to manage panics here, since update codes are
		// running in an isolated go routine
		if c.IsSet() {
			go c.update(wg)
		}
	}
	wg.Wait()
}

func (o *ObserverT) Clusters() []*Cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	clusters := make([]*Cluster, len(o.clusters))
	copy(clusters, o.clusters)
	return clusters
}

func (o *ObserverT) observe(config *common.Config) {
	// make sure panics do not bring the observer down
	defer func() {
		if err := recover(); err != nil {
			log.Error(debug.Stack())
			go o.observe(config)
		}
	}()

	// update as soon as initiated once
	o.updateClusters()

	for {
		select {

		case <-time.After(time.Second):
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

func (o *ObserverT) AppendCluster(sessionId string, cluster *Cluster) {
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
		log.Info("Appending cluster " + cluster.Id() + " to the models...")
		o.clusters = append(o.clusters, cluster)
	}

	// make sure the cluster is not already included in the session
	for _, c := range o.sessions[sessionId] {
		if c == cluster {
			return
		}
	}

	log.Info("Appending cluster " + cluster.Id() + " to session " + sessionId)
	o.sessions[sessionId] = append(o.sessions[sessionId], cluster)
}

func (o *ObserverT) Register(sessionId string, policy *as.ClientPolicy, alias *string, host string, port uint16) (*Cluster, error) {
	hostAddrs := strings.Split(host, ",")
	hosts := make([]*as.Host, 0, len(hostAddrs))

	for _, addr := range hostAddrs {
		resolved, err := resolveHost(addr)
		if err != nil {
			return nil, err
		}

		for _, ip := range resolved {
			hosts = append(hosts, as.NewHost(ip, int(port)))
		}
	}

	client, err := as.NewClientWithPolicyAndHost(policy, hosts...)
	if err != nil {
		return nil, err
	}

	cluster := newCluster(o, client, alias, policy.User, policy.Password, hosts)
	o.AppendCluster(sessionId, cluster)
	o.updateClusters()

	return cluster, nil
}

func (o *ObserverT) SessionExists(sessionId string) bool {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	_, exists := o.sessions[sessionId]
	return exists
}

func (o *ObserverT) MonitoringClusters(sessionId string) ([]*Cluster, bool) {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	log.Info("====================== SessionId", sessionId)
	clusters, sessionExists := o.sessions[sessionId]
	log.Info("====================== Clusters", clusters)

	return clusters, sessionExists
}

func (o *ObserverT) FindClusterById(id string) *Cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	for _, cluster := range o.clusters {
		if cluster.Id() == id {
			return cluster
		}
	}
	return nil
}

func (o *ObserverT) NodeHasBeenDiscovered(alias string) *Cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	for _, cluster := range o.clusters {
		for _, node := range cluster.client.Cluster().GetNodes() {
			for _, host := range node.GetAliases() {
				if strings.ToLower(host.Name+":"+strconv.Itoa(host.Port)) == strings.ToLower(alias) {
					return cluster
				}
			}
		}
	}
	return nil
}

// Checks for the cluster; If the cluster exists in the session, it won't check the user/pass since it has already been checked
// Otherwise, will search for the cluster in all the list and check user/pass in case the cluster exists
func (o *ObserverT) FindClusterBySeed(sid string, host string, port int, user, password string) *Cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	hostAddrs := strings.Split(host, ",")
	for _, host := range hostAddrs {
		aliases := findAliases(host, port)

		// try to find the cluster in current session by seed
		clusters, sessionExists := o.MonitoringClusters(sid)
		if sessionExists && len(clusters) > 0 {
			if cluster := o.findClusterBySeed(clusters, aliases, host, port, user, password, false); cluster != nil {
				return cluster
			}
		}

		// try to find the cluster in all monitored clusters
		// CHECK for user/pass
		if len(o.clusters) > 0 {
			if cluster := o.findClusterBySeed(o.clusters, aliases, host, port, user, password, true); cluster != nil {
				return cluster
			}
		}
	}
	return nil
}

func (o *ObserverT) findClusterBySeed(clusters []*Cluster, aliases []string, host string, port int, user, password string, checkUserPass bool) *Cluster {
	o.mutex.RLock()
	defer o.mutex.RUnlock()

	for _, cluster := range clusters {
		for _, node := range cluster.nodes {
			for _, alias := range aliases {
				if node.Address() == alias {
					if !checkUserPass || (cluster.User() == nil || (*cluster.user == user && *cluster.password == password)) {
						return cluster
					}
				}
			}
		}
	}
	return nil
}

func (o *ObserverT) DatacenterInfo() common.Stats {
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

func (o *ObserverT) Config() *common.Config {
	return o.config
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

func resolveHost(address string) ([]string, error) {
	// IP addresses do not need a lookup
	ip := net.ParseIP(address)
	if ip != nil {
		return []string{address}, nil
	}

	return net.LookupHost(address)
}
