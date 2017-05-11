package controllers

import (
	"crypto/tls"
	"errors"
	"sync"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/models"
)

var ErrClusterNotFound = errors.New("Cluster Not Found.")

type connectionMap struct {
	conns map[string]*models.Cluster
	m     sync.Mutex
}

var connections = connectionMap{conns: map[string]*models.Cluster{}}

func GetConnectionCluster(sessionId, connId string, dbUsername, dbPassword string) (*models.Cluster, error) {
	connections.m.Lock()
	defer connections.m.Unlock()

	if c := connections.conns[connId]; c != nil {
		if c.IsSet() {
			return c, nil
		}
		// the cluster existed, but is not active anymore
		delete(connections.conns, connId)
	}

	// not found, or not active; try to connect
	conn, err := models.GetConnectionByID(connId)
	if err != nil {
		return nil, err
	}

	// try to find seeds in the observer
	hasTLS := false
	for _, seedHost := range conn.SeedHosts() {
		cluster := _observer.FindClusterBySeed(sessionId, seedHost, dbUsername, dbPassword)
		if cluster != nil {
			connections.conns[connId] = cluster
			return cluster, nil
		}
		for _, seedHost := range conn.SeedHosts() {
			hasTLS = hasTLS || (len(seedHost.TLSName) > 0)
		}
	}

	clientPolicy := *_defaultClientPolicy
	if common.AMCIsEnterprise() {
		clientPolicy.User = dbUsername
		clientPolicy.Password = dbPassword

		if hasTLS {
			// Setup TLS Config
			tlsConfig := &tls.Config{
				Certificates:             _observer.Config().ClientPool(),
				RootCAs:                  _observer.Config().ServerPool(),
				PreferServerCipherSuites: true,
			}
			tlsConfig.BuildNameToCertificate()

			clientPolicy.TlsConfig = tlsConfig
		}
	}

	cluster, err := _observer.Register(sessionId, &clientPolicy, conn.Label, conn.SeedHosts()...)
	if err != nil {
		return nil, err
	}
	connections.conns[connId] = cluster
	return cluster, nil
}

func GetConnectionClusterById(connId string) (*models.Cluster, error) {
	connections.m.Lock()
	defer connections.m.Unlock()

	if c := connections.conns[connId]; c != nil {
		if c.IsSet() {
			return c, nil
		}
		// the cluster existed, but is not active anymore
		delete(connections.conns, connId)
	}

	return nil, ErrClusterNotFound
}
