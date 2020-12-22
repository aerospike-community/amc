package models

import (
	"crypto/tls"
	"fmt"
	"net"
	"runtime/debug"
	"strconv"
	"strings"
	"sync"
	"time"

	as "github.com/aerospike/aerospike-client-go"
	asl "github.com/aerospike/aerospike-client-go/logger"
	log "github.com/sirupsen/logrus"

	// "github.com/sasha-s/go-deadlock"

	"github.com/aerospike-community/amc/common"
)

type DebugStatus struct {
	On        bool
	StartTime time.Time
	Duration  time.Duration
	Initiator string
}

type ObserverT struct {
	sessions common.SyncStats // map[string][]*Cluster
	config   *common.Config

	debug common.SyncValue //DebugStatus

	clusters common.SyncValue //[]*Cluster
	mutex    sync.RWMutex

	notifyCloseChan chan struct{}

	xdrSeeds chan string
}

func New(config *common.Config) *ObserverT {
	var err error
	o := &ObserverT{
		sessions: *common.NewSyncStats(common.Stats{}),
		clusters: common.NewSyncValue([]*Cluster{}),
		config:   config,
		debug:    common.NewSyncValue(DebugStatus{}),
		xdrSeeds: make(chan string, 128),
	}
	go o.observe(config)

	// Add Monitoring servers to the cluster
	// These clusters do not belong to any sessions, but will
	for _, server := range config.AMC.Clusters {
		cp := as.NewClientPolicy()
		cp.UseServicesAlternate = server.UseServicesAlternate

		host := as.NewHost(server.Host, int(server.Port))
		if common.AMCIsEnterprise() {
			cp.User = server.User
			cp.Password = server.Password

			tlsName := strings.TrimSpace(server.TLSName)
			if len(tlsName) > 0 {
				host.TLSName = tlsName

				tc := &tls.Config{
					Certificates:             config.ClientPool(),
					RootCAs:                  config.ServerPool(),
					PreferServerCipherSuites: true,
				}
				tc.BuildNameToCertificate()
				cp.TlsConfig = tc
			}
		}

		cluster := o.FindClusterBySeed("automatic", host, server.User, server.Password)
		if cluster == nil {
			log.Warn("Adding host ", server.Host, ":", server.Port, " user: ", server.User)
			cluster, err = o.Register("automatic", cp, server.Alias, host)
			if err != nil {
				log.Error("Error while trying to add database from config file for monitoring: ", err.Error())
				continue
			}
		}
		// mark it so it won't be removed automatically
		cluster.setPermanent(true)
		cluster.showInUI.Set(server.ShowInUI)
	}

	return o
}

func (o *ObserverT) stop() {
	o.StopDebug()
	close(o.notifyCloseChan)
}

func (o *ObserverT) updateClusters() {
	clusters := o.Clusters()

	wg := new(sync.WaitGroup)
	wg.Add(len(clusters))
	for _, c := range clusters {
		go c.update(wg)
	}
	wg.Wait()
}

func (o *ObserverT) removeIdleClusters() {
	clusters := o.Clusters()

	for _, c := range clusters {
		if c.shouldAutoRemove() {
			c.close()
			o.removeClusterFromAllSessions(c)
		}
	}
}

func (o *ObserverT) Clusters() []*Cluster {
	c := o.clusters.Get().([]*Cluster)

	clusters := make([]*Cluster, len(c))
	copy(clusters, c)
	return clusters
}

func (o *ObserverT) clustersRef() []*Cluster {
	return o.clusters.Get().([]*Cluster)
}

func (o *ObserverT) observe(config *common.Config) {
	// make sure panics do not bring the observer down
	defer func() {
		if err := recover(); err != nil {
			log.Error(string(debug.Stack()))
			go o.observe(config)
		}
	}()

	// update as soon as initiated once
	o.updateClusters()

	for {
		select {

		case <-time.After(time.Second):
			if o.debugExpired() {
				o.StopDebug()
			}

			o.removeIdleClusters()
			o.updateClusters()

		case <-o.notifyCloseChan:
			clusters := o.Clusters()
			o.clusters.Set([]*Cluster{})
			for _, c := range clusters {
				c.close()
			}

			return
		}
	}
}

func (o *ObserverT) sessionClusters(sessionId string) []*Cluster {
	clustersIfc := o.sessions.Get(sessionId)

	if clustersIfc == nil {
		return nil
	}

	clusters := clustersIfc.([]*Cluster)
	res := make([]*Cluster, len(clusters))
	copy(res, clusters)
	return res
}

func (o *ObserverT) AppendCluster(sessionId string, cluster *Cluster) {
	o.mutex.Lock()
	defer o.mutex.Unlock()

	clusters := o.Clusters()

	cExists := false
	for _, c := range clusters {
		if c == cluster {
			cExists = true
			break
		}
	}

	if !cExists {
		log.Info("Appending cluster " + cluster.Id() + " to the models...")
		clusters = append(clusters, cluster)
		o.clusters.Set(clusters)
	}

	sessionClusters := o.sessionClusters(sessionId)

	// make sure the cluster is not already included in the session
	for _, c := range sessionClusters {
		if c == cluster {
			return
		}
	}

	log.Info("Appending cluster " + cluster.Id() + " to session " + sessionId)

	sessionClusters = append(sessionClusters, cluster)
	o.sessions.Set(sessionId, sessionClusters)
}

func (o *ObserverT) removeClusterFromAllSessions(cluster *Cluster) {
	o.mutex.Lock()
	defer o.mutex.Unlock()

	// Remove cluster from the session
	sessions := o.sessions.Clone()
	for sessionId, s := range sessions {
		newClusters := make([]*Cluster, 0, len(sessions[sessionId].([]*Cluster)))
		for _, c := range s.([]*Cluster) {
			if c != cluster {
				newClusters = append(newClusters, c)
			}
		}
		sessions[sessionId] = newClusters
	}
	o.sessions.SetStats(sessions)

	clusters := o.Clusters()
	newClusters := make([]*Cluster, 0, len(clusters))
	for _, c := range clusters {
		if c != cluster {
			newClusters = append(newClusters, c)
		}
	}
	o.clusters.Set(newClusters)

	log.Info("Automatically removed idle cluster " + cluster.Id() + " from session all sessions")
}

func (o *ObserverT) RemoveCluster(sessionId string, cluster *Cluster) int {
	o.mutex.Lock()
	defer o.mutex.Unlock()

	// Remove cluster from the session
	sessionClusters := o.sessionClusters(sessionId)
	newClusters := make([]*Cluster, 0, len(sessionClusters))
	for _, c := range sessionClusters {
		if c != cluster {
			newClusters = append(newClusters, c)
		}
	}
	o.sessions.Set(sessionId, newClusters)

	// check if cluster exists in any session
	if !cluster.permanent.Get().(bool) {
		exists := false
		for _, session := range o.sessions.Clone() {
			for _, c := range session.([]*Cluster) {
				if c == cluster {
					exists = true
					break
				}
			}
		}

		// if the cluster does not exist in any other session, remove it
		if !exists {
			clusters := o.Clusters()
			newClusters = make([]*Cluster, 0, len(clusters))
			for _, c := range clusters {
				if c != cluster {
					newClusters = append(newClusters, c)
				} else {
					c.close()
				}
			}
			o.clusters.Set(newClusters)
		}
	}

	log.Info("Removing cluster " + cluster.Id() + " from session " + sessionId)
	remainingClusters := o.sessionClusters(sessionId)
	if len(remainingClusters) == 0 {
		// remove session
		o.sessions.Del(sessionId)
	}
	return len(remainingClusters)
}

func (o *ObserverT) Register(sessionId string, policy *as.ClientPolicy, alias string, hosts ...*as.Host) (*Cluster, error) {
	client, err := as.NewClientWithPolicyAndHost(policy, hosts...)
	if err != nil {
		return nil, err
	}

	cluster := newCluster(o, client, alias, policy.User, policy.Password, hosts)
	if cluster.IsSet() {
		cluster.update(nil)

		if err := cluster.versionSupported("3.9"); err != nil {
			cluster.close()
			return nil, err
		}
	}

	o.AppendCluster(sessionId, cluster)

	return cluster, nil
}

func (o *ObserverT) SessionExists(sessionId string) bool {
	_, exists := o.sessions.ExistsGet(sessionId)
	return exists
}

func (o *ObserverT) MonitoringClusters(sessionId string) ([]*Cluster, bool) {
	clusters, sessionExists := o.sessions.ExistsGet(sessionId)
	if clusters == nil {
		return nil, sessionExists
	}
	return clusters.([]*Cluster), sessionExists
}

func (o *ObserverT) AutoClusters() []*Cluster {
	clusters := []*Cluster{}

	// Add automatic clusters which have been required to show up in the UI
	autoClusters := o.sessions.Get("automatic")
	if autoClusters != nil {
		for _, c := range autoClusters.([]*Cluster) {
			if c.ShowInUI() {
				clusters = append(clusters, c)
			}
		}
	}

	return clusters
}

func (o *ObserverT) FindClusterById(id string) *Cluster {
	for _, cluster := range o.clustersRef() {
		if cluster.Id() == id {
			return cluster
		}
	}
	return nil
}

func (o *ObserverT) NodeHasBeenDiscovered(sessionId string, alias string) *Cluster {
	for _, cluster := range o.sessionClusters(sessionId) {
		client := cluster.origClient()
		if client == nil || client.Cluster() == nil {
			continue
		}
		for _, node := range client.Cluster().GetNodes() {
			for _, host := range node.GetAliases() {
				if strings.ToLower(host.Name+":"+strconv.Itoa(host.Port)) == strings.ToLower(alias) {
					return cluster
				}
			}
		}
	}
	return nil
}

// FindClusterBySeed Checks for the cluster; If the cluster exists in the session, it won't check the user/pass since it has already been checked
// Otherwise, will search for the cluster in all the list and check user/pass in case the cluster exists
func (o *ObserverT) FindClusterBySeed(sid string, host *as.Host, user, password string) *Cluster {
	hostAddrs := strings.Split(host.Name, ",")
	for _, hostAddr := range hostAddrs {
		aliases := findAliases(hostAddr, host.TLSName, host.Port)

		// try to find the cluster in current session by seed
		clusters, sessionExists := o.MonitoringClusters(sid)
		if sessionExists && len(clusters) > 0 {
			if cluster := o.findClusterBySeed(clusters, aliases, user, password, false); cluster != nil {
				return cluster
			}
		}

		// try to find the cluster in all monitored clusters
		// CHECK for user/pass
		if len(o.clustersRef()) > 0 {
			if cluster := o.findClusterBySeed(o.clustersRef(), aliases, user, password, true); cluster != nil {
				return cluster
			}
		}
	}
	return nil
}

func (o *ObserverT) findClusterBySeed(clusters []*Cluster, aliases []as.Host, user, password string, checkUserPass bool) *Cluster {
	for _, cluster := range clusters {
		for _, alias := range aliases {
			clusterNodes := cluster.nodesCopy()
			if node := clusterNodes[alias]; node != nil {
				if !checkUserPass || cluster.ValidCurrentUser(user, password) {
					return cluster
				}
			}
		}
	}
	return nil
}

func (o *ObserverT) findClusterBySeedOnly(seed as.Host) *Cluster {
	for _, cluster := range o.Clusters() {
		clusterNodes := cluster.nodesCopy()
		if node := clusterNodes[seed]; node != nil {
			return cluster
		}
	}
	return nil
}

func (o *ObserverT) DatacenterInfo(sessionId string) common.Stats {
	res := map[string]common.Stats{}
	sClusters := o.sessionClusters(sessionId)
	for _, cluster := range sClusters {
		res[cluster.Id()] = cluster.DatacenterInfo(sessionId)
	}

	// Add auto clusters to the mix
	// DO NOT add auto-clusters which are already included in the
	// cluster.
L:
	for _, cluster := range o.AutoClusters() {
		for _, scluster := range sClusters {
			if scluster.SameAs(cluster) {
				continue L
			}
		}
		res[cluster.Id()] = cluster.DatacenterInfo(sessionId)
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

		// convert the ones whose seed node is a different node
		for addr, stats := range res {
			if seednodeAddr := stats.TryString("seednode", ""); seednodeAddr != "" && seednodeAddr != addr {
				// try to find the seednode in the results
				if seedNode, exists := res[seednodeAddr]; exists {
					nodeList := seedNode["nodes"].(common.Stats)
					host, port, err := common.SplitHostPort(addr)
					if err != nil {
						continue
					}
					nodeList[addr] = common.Stats{
						"status":         "off",
						"access_ip":      host,
						"access_port":    port,
						"ip":             host,
						"port":           port,
						"cur_throughput": 0,
						"lag":            nil,
					}
					delete(res, addr)
				}
			}
		}
	}

	// remove clusters with the same nodes as cluster Id
	for addr, cluster := range res {
		if nodesIfc, exists := cluster["nodes"]; exists {
			for _, nodeStatsIfc := range nodesIfc.(common.Stats) {
				nodeStats := nodeStatsIfc.(common.Stats)
				nodeAddr1 := fmt.Sprintf("%s:%v", nodeStats.TryString("ip", ""), nodeStats.Get("port"))
				if nodeAddr1 != addr {
					delete(res, nodeAddr1)
				}
				nodeAddr2 := fmt.Sprintf("%s:%v", nodeStats.TryString("access_ip", ""), nodeStats.Get("access_port"))
				if nodeAddr2 != addr {
					delete(res, nodeAddr2)
				}
			}
		}
	}

	// append reported unknown nodes to the discovered clusters if they have other nodes in common
	for addr, cluster := range res {
		// make sure the cluster is not a discovered one
		if cluster.TryString("discovery", "") == "complete" {
			continue
		}

		host, port, err := common.SplitHostPort(addr)
		if err != nil {
			continue
		}

		if nodesIfc, exists := cluster["nodes"]; exists {
			for _, nodeStatsIfc := range nodesIfc.(common.Stats) {
				nodeStats := nodeStatsIfc.(common.Stats)
				nodeAddr1 := fmt.Sprintf("%s:%v", nodeStats.TryString("ip", ""), nodeStats.Get("port"))
				nodeAddr2 := fmt.Sprintf("%s:%v", nodeStats.TryString("access_ip", ""), nodeStats.Get("access_port"))

				// see if there are other clusters with similar nodes
				for id, otherCluster := range res {
					// make sure the cluster is a discovered one
					if otherCluster.TryString("discovery", "") != "complete" || addr == id {
						continue
					}

					if nodesIfc2, exists := otherCluster["nodes"]; exists {
						nodes2 := nodesIfc2.(common.Stats)
						for _, nodeStatsIfc2 := range nodes2 {
							nodeStats2 := nodeStatsIfc2.(common.Stats)
							if nodeAddr1 == fmt.Sprintf("%s:%v", nodeStats2.TryString("ip", ""), nodeStats2.Get("port")) || nodeAddr2 == fmt.Sprintf("%s:%v", nodeStats2.TryString("access_ip", ""), nodeStats2.Get("access_port")) {
								nodes2[addr] = common.Stats{
									"status":         "off",
									"access_ip":      host,
									"access_port":    port,
									"ip":             host,
									"port":           port,
									"cur_throughput": 0,
									"lag":            nil,
								}

								// remove this unknown cluster from res
								delete(res, addr)
								break
							}
						}
					}
				}
			}
		}
	}

	go func() {
		// try adding the newly discovered clusters to the mix in the observer
		for seed := range res {
			o.xdrSeeds <- seed
		}
		o.xdrSeeds <- ""
	}()

	go func() {
		for {
			select {
			case seed := <-o.xdrSeeds:
				if seed == "" {
					// one round complete
					o.updateClusters()
					return
				}

				host, port, err := common.SplitHostPort(seed)
				if err != nil {
					continue
				}

				c := o.findClusterBySeedOnly(*as.NewHost(host, port))
				if c != nil {
					continue
				}

				seedHost := as.NewHost(host, port)
				clientPolicy := as.NewClientPolicy()
				clientPolicy.Timeout = time.Duration(10) * time.Second
				clientPolicy.LimitConnectionsToQueueSize = true
				clientPolicy.ConnectionQueueSize = 1

				_, err = o.Register(sessionId, clientPolicy, "", seedHost)
				if err == nil {
					// c.update(nil)
					continue
				}

				clientPolicy.UseServicesAlternate = true
				_, err = o.Register(sessionId, clientPolicy, "", seedHost)
				if err == nil {
					// c.update(nil)
					continue
				}

				log.Warn("Automatic host discovery via XDR failed for ", host, ":", port)
			}
		}
	}()

	return common.Stats{
		"status": "success",
		"data":   res,
	}
}

func (o *ObserverT) Config() *common.Config {
	return o.config
}

func (o *ObserverT) StartDebug(initiator string, duration time.Duration) DebugStatus {
	log.SetLevel(log.DebugLevel)
	asl.Logger.SetLevel(asl.DEBUG)

	debug := o.debug.Get().(DebugStatus)
	debug.On = true
	debug.StartTime = time.Now()
	debug.Duration = duration
	debug.Initiator = initiator
	o.debug.Set(debug)

	return debug
}

func (o *ObserverT) StopDebug() DebugStatus {
	log.SetLevel(o.config.LogLevel())
	asl.Logger.SetLevel(o.config.AeroLogLevel())

	debug := o.debug.Get().(DebugStatus)
	debug.On = false
	o.debug.Set(debug)

	return debug
}

func (o *ObserverT) DebugStatus() DebugStatus {
	return o.debug.Get().(DebugStatus)
}

func (o *ObserverT) debugExpired() bool {
	debug := o.debug.Get().(DebugStatus)
	return debug.On && time.Now().After(debug.StartTime.Add(debug.Duration))
}

func findAliases(address, tlsName string, port int) []as.Host {
	// IP addresses do not need a lookup
	ip := net.ParseIP(address)
	if ip != nil {
		return []as.Host{as.Host{Name: ip.String(), Port: port, TLSName: tlsName}}
	}

	addresses, err := net.LookupHost(address)
	if err != nil {
		return nil
	}
	aliases := make([]as.Host, 0, len(addresses))
	for _, addr := range addresses {
		aliases = append(aliases, as.Host{Name: addr, Port: port, TLSName: tlsName})
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

// func externalIPs() []string {
// 	res := []string{}
// 	ifaces, err := net.Interfaces()
// 	if err != nil {
// 		return nil
// 	}
// 	for _, iface := range ifaces {
// 		if iface.Flags&net.FlagUp == 0 {
// 			continue // interface down
// 		}
// 		if iface.Flags&net.FlagLoopback != 0 {
// 			continue // loopback interface
// 		}
// 		addrs, err := iface.Addrs()
// 		if err != nil {
// 			return nil
// 		}
// 		for _, addr := range addrs {
// 			var ip net.IP
// 			switch v := addr.(type) {
// 			case *net.IPNet:
// 				ip = v.IP
// 			case *net.IPAddr:
// 				ip = v.IP
// 			}
// 			if ip == nil || ip.IsLoopback() {
// 				continue
// 			}
// 			res = append(res, ip.String())
// 		}
// 	}
// 	return res
// }
