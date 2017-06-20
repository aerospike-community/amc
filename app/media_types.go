// Code generated by goagen v1.2.0-dirty, DO NOT EDIT.
//
// API "amc": Application Media Types
//
// Command:
// $ goagen
// --design=github.com/citrusleaf/amc/api_design
// --out=$(GOPATH)/src/github.com/citrusleaf/amc/temp
// --version=v1.2.0-dirty

package app

import (
	"github.com/goadesign/goa"
)

// Cluster Resource Usage (default view)
//
// Identifier: application/vnd.aerospike.amc.cluster.resource.usage.response+json; view=default
type AerospikeAmcClusterResourceUsageResponse struct {
	// Free Bytes
	FreeBytes int `form:"free-bytes" json:"free-bytes" xml:"free-bytes"`
	// Resource usage details.
	NodeDetails map[string]*AerospikeAmcResourceUsageResponse `form:"nodeDetails,omitempty" json:"nodeDetails,omitempty" xml:"nodeDetails,omitempty"`
	// Total Bytes
	TotalBytes int `form:"total-bytes" json:"total-bytes" xml:"total-bytes"`
	// Used Bytes
	UsedBytes int `form:"used-bytes" json:"used-bytes" xml:"used-bytes"`
}

// Validate validates the AerospikeAmcClusterResourceUsageResponse media type instance.
func (mt *AerospikeAmcClusterResourceUsageResponse) Validate() (err error) {

	return
}

// Cluster Modules (default view)
//
// Identifier: application/vnd.aerospike.amc.connection.modules.response+json; view=default
type AerospikeAmcConnectionModulesResponse struct {
	// Module's Hash
	Hash *string `form:"hash,omitempty" json:"hash,omitempty" xml:"hash,omitempty"`
	// Module's Name
	Name *string `form:"name,omitempty" json:"name,omitempty" xml:"name,omitempty"`
	// Nodes from which the module is absent
	NodesAbsent []string `form:"nodesAbsent,omitempty" json:"nodesAbsent,omitempty" xml:"nodesAbsent,omitempty"`
	// Nodes in which the module is present
	NodesPresent []string `form:"nodesPresent,omitempty" json:"nodesPresent,omitempty" xml:"nodesPresent,omitempty"`
	// Is Module present in all nodes?
	Synced *bool `form:"synced,omitempty" json:"synced,omitempty" xml:"synced,omitempty"`
	// Module's Source Type
	Type *string `form:"type,omitempty" json:"type,omitempty" xml:"type,omitempty"`
}

// Cluster Modules (full view)
//
// Identifier: application/vnd.aerospike.amc.connection.modules.response+json; view=full
type AerospikeAmcConnectionModulesResponseFull struct {
	// Module's Name
	Name *string `form:"name,omitempty" json:"name,omitempty" xml:"name,omitempty"`
	// Module's Source Code
	Source *string `form:"source,omitempty" json:"source,omitempty" xml:"source,omitempty"`
	// Module's Source Type
	Type *string `form:"type,omitempty" json:"type,omitempty" xml:"type,omitempty"`
}

// User Connection (default view)
//
// Identifier: application/vnd.aerospike.amc.connection.query.response+json; view=default
type AerospikeAmcConnectionQueryResponse struct {
	// UI should connect to this connection automatically after AMC login
	ConnectOnLogin bool `form:"connectOnLogin" json:"connectOnLogin" xml:"connectOnLogin"`
	// If AMC is already connected to this cluster for the current user.
	Connected bool `form:"connected" json:"connected" xml:"connected"`
	// Connection Id
	ID string `form:"id" json:"id" xml:"id"`
	// Connection Name
	Name string `form:"name" json:"name" xml:"name"`
	// Seeds
	Seeds []*NodeSeed `form:"seeds,omitempty" json:"seeds,omitempty" xml:"seeds,omitempty"`
}

// Validate validates the AerospikeAmcConnectionQueryResponse media type instance.
func (mt *AerospikeAmcConnectionQueryResponse) Validate() (err error) {
	if mt.ID == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "id"))
	}
	if mt.Name == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "name"))
	}

	if ok := goa.ValidatePattern(`[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`, mt.ID); !ok {
		err = goa.MergeErrors(err, goa.InvalidPatternError(`response.id`, mt.ID, `[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`))
	}
	for _, e := range mt.Seeds {
		if e != nil {
			if err2 := e.Validate(); err2 != nil {
				err = goa.MergeErrors(err, err2)
			}
		}
	}
	return
}

// User Connection (default view)
//
// Identifier: application/vnd.aerospike.amc.connection.response+json; view=default
type AerospikeAmcConnectionResponse struct {
	// Ative red alert count.
	ActiveRedAlertCount int `form:"activeRedAlertCount" json:"activeRedAlertCount" xml:"activeRedAlertCount"`
	// Cluster build details.
	ClusterBuilds *AerospikeAmcVersionInfoResponse `form:"clusterBuilds" json:"clusterBuilds" xml:"clusterBuilds"`
	// UI should connect to this connection automatically after AMC login
	ConnectOnLogin bool `form:"connectOnLogin" json:"connectOnLogin" xml:"connectOnLogin"`
	// If AMC is already connected to this cluster for the current user.
	Connected bool `form:"connected" json:"connected" xml:"connected"`
	// Disk usage.
	Disk *AerospikeAmcClusterResourceUsageResponse `form:"disk,omitempty" json:"disk,omitempty" xml:"disk,omitempty"`
	// Connection Id
	ID *string `form:"id,omitempty" json:"id,omitempty" xml:"id,omitempty"`
	// Memory usage.
	Memory *AerospikeAmcClusterResourceUsageResponse `form:"memory" json:"memory" xml:"memory"`
	// Connection Name
	Name string `form:"name" json:"name" xml:"name"`
	// List of namespaces.
	Namespaces []string `form:"namespaces" json:"namespaces" xml:"namespaces"`
	// List of cluster nodes which have been discovered.
	Nodes []string `form:"nodes" json:"nodes" xml:"nodes"`
	// If nodes are all from the same version: Values: homogenious/compatible
	NodesCompatibility string `form:"nodesCompatibility" json:"nodesCompatibility" xml:"nodesCompatibility"`
	// Inactive/Lost/Inaccessible nodes.
	OffNodes []string `form:"offNodes" json:"offNodes" xml:"offNodes"`
	// Seeds
	Seeds []*NodeSeed `form:"seeds,omitempty" json:"seeds,omitempty" xml:"seeds,omitempty"`
	// If cluster is connected: Values: on/off
	Status string `form:"status" json:"status" xml:"status"`
	// Interval with which AMC fetches data from the database.
	UpdateInterval int `form:"updateInterval" json:"updateInterval" xml:"updateInterval"`
	// Cluster users list.
	Users []string `form:"users,omitempty" json:"users,omitempty" xml:"users,omitempty"`
}

// Validate validates the AerospikeAmcConnectionResponse media type instance.
func (mt *AerospikeAmcConnectionResponse) Validate() (err error) {
	if mt.Name == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "name"))
	}

	if mt.ClusterBuilds == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "clusterBuilds"))
	}

	if mt.OffNodes == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "offNodes"))
	}
	if mt.NodesCompatibility == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "nodesCompatibility"))
	}
	if mt.Status == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "status"))
	}
	if mt.Namespaces == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "namespaces"))
	}
	if mt.Nodes == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "nodes"))
	}
	if mt.Memory == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "memory"))
	}

	if mt.ClusterBuilds != nil {
		if err2 := mt.ClusterBuilds.Validate(); err2 != nil {
			err = goa.MergeErrors(err, err2)
		}
	}
	if mt.ID != nil {
		if ok := goa.ValidatePattern(`[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`, *mt.ID); !ok {
			err = goa.MergeErrors(err, goa.InvalidPatternError(`response.id`, *mt.ID, `[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`))
		}
	}
	for _, e := range mt.Seeds {
		if e != nil {
			if err2 := e.Validate(); err2 != nil {
				err = goa.MergeErrors(err, err2)
			}
		}
	}
	return
}

// User Connection Entity Tree (default view)
//
// Identifier: application/vnd.aerospike.amc.connection.tree.response+json; view=default
type AerospikeAmcConnectionTreeResponse struct {
	// Entity Type
	EntityType string `form:"entityType" json:"entityType" xml:"entityType"`
	// Connection Id
	ID string `form:"id" json:"id" xml:"id"`
	// Last Update Of This Entity in Unix Seconds
	LastUpdate int `form:"lastUpdate" json:"lastUpdate" xml:"lastUpdate"`
	// modules
	Modules []*AerospikeAmcEntityModuleResponse `form:"modules,omitempty" json:"modules,omitempty" xml:"modules,omitempty"`
	// Nodes
	Nodes []*AerospikeAmcEntityNodeResponse `form:"nodes,omitempty" json:"nodes,omitempty" xml:"nodes,omitempty"`
	// Cureent connection status.
	Status string `form:"status" json:"status" xml:"status"`
}

// Validate validates the AerospikeAmcConnectionTreeResponse media type instance.
func (mt *AerospikeAmcConnectionTreeResponse) Validate() (err error) {
	if mt.ID == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "id"))
	}
	if mt.EntityType == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "entityType"))
	}

	if mt.Status == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "status"))
	}
	if ok := goa.ValidatePattern(`[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`, mt.ID); !ok {
		err = goa.MergeErrors(err, goa.InvalidPatternError(`response.id`, mt.ID, `[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}`))
	}
	for _, e := range mt.Modules {
		if e != nil {
			if err2 := e.Validate(); err2 != nil {
				err = goa.MergeErrors(err, err2)
			}
		}
	}
	for _, e := range mt.Nodes {
		if e != nil {
			if err2 := e.Validate(); err2 != nil {
				err = goa.MergeErrors(err, err2)
			}
		}
	}
	return
}

// Index Entity (default view)
//
// Identifier: application/vnd.aerospike.amc.entity.index.response+json; view=default
type AerospikeAmcEntityIndexResponse struct {
	// Bin Name
	BinName string `form:"binName" json:"binName" xml:"binName"`
	// Type
	EntityType string `form:"entityType" json:"entityType" xml:"entityType"`
	// Last Update Of This Entity in Unix Seconds
	LastUpdate int `form:"lastUpdate" json:"lastUpdate" xml:"lastUpdate"`
	// Set Name
	Name string `form:"name" json:"name" xml:"name"`
	// Index Type
	Type string `form:"type" json:"type" xml:"type"`
}

// Validate validates the AerospikeAmcEntityIndexResponse media type instance.
func (mt *AerospikeAmcEntityIndexResponse) Validate() (err error) {
	if mt.Name == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "name"))
	}
	if mt.BinName == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "binName"))
	}
	if mt.Type == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "type"))
	}
	if mt.EntityType == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "entityType"))
	}

	return
}

// Module Entity (default view)
//
// Identifier: application/vnd.aerospike.amc.entity.module.response+json; view=default
type AerospikeAmcEntityModuleResponse struct {
	// Type
	EntityType string `form:"entityType" json:"entityType" xml:"entityType"`
	// Module Hash
	Hash string `form:"hash" json:"hash" xml:"hash"`
	// Last Update Of This Entity in Unix Seconds
	LastUpdate int `form:"lastUpdate" json:"lastUpdate" xml:"lastUpdate"`
	// Module Name
	Name string `form:"name" json:"name" xml:"name"`
	// Module Type
	Type string `form:"type" json:"type" xml:"type"`
}

// Validate validates the AerospikeAmcEntityModuleResponse media type instance.
func (mt *AerospikeAmcEntityModuleResponse) Validate() (err error) {
	if mt.Name == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "name"))
	}
	if mt.Hash == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "hash"))
	}
	if mt.Type == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "type"))
	}
	if mt.EntityType == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "entityType"))
	}

	return
}

// Namespace Entity (default view)
//
// Identifier: application/vnd.aerospike.amc.entity.namespace.response+json; view=default
type AerospikeAmcEntityNamespaceResponse struct {
	// Type
	EntityType string `form:"entityType" json:"entityType" xml:"entityType"`
	// Last Update Of This Entity in Unix Seconds
	LastUpdate int `form:"lastUpdate" json:"lastUpdate" xml:"lastUpdate"`
	// Namespace Name
	Name string `form:"name" json:"name" xml:"name"`
	// Namespaces
	Sets []*AerospikeAmcEntitySetResponse `form:"sets,omitempty" json:"sets,omitempty" xml:"sets,omitempty"`
}

// Validate validates the AerospikeAmcEntityNamespaceResponse media type instance.
func (mt *AerospikeAmcEntityNamespaceResponse) Validate() (err error) {
	if mt.Name == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "name"))
	}
	if mt.EntityType == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "entityType"))
	}

	for _, e := range mt.Sets {
		if e != nil {
			if err2 := e.Validate(); err2 != nil {
				err = goa.MergeErrors(err, err2)
			}
		}
	}
	return
}

// Node Entity (default view)
//
// Identifier: application/vnd.aerospike.amc.entity.node.response+json; view=default
type AerospikeAmcEntityNodeResponse struct {
	// Type
	EntityType string `form:"entityType" json:"entityType" xml:"entityType"`
	// Network Host Address
	Host string `form:"host" json:"host" xml:"host"`
	// Node Id
	ID string `form:"id" json:"id" xml:"id"`
	// Last Update Of This Entity in Unix Seconds
	LastUpdate int `form:"lastUpdate" json:"lastUpdate" xml:"lastUpdate"`
	// Namespaces
	Namespaces []*AerospikeAmcEntityNamespaceResponse `form:"namespaces,omitempty" json:"namespaces,omitempty" xml:"namespaces,omitempty"`
}

// Validate validates the AerospikeAmcEntityNodeResponse media type instance.
func (mt *AerospikeAmcEntityNodeResponse) Validate() (err error) {
	if mt.Host == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "host"))
	}
	if mt.ID == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "id"))
	}
	if mt.EntityType == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "entityType"))
	}

	for _, e := range mt.Namespaces {
		if e != nil {
			if err2 := e.Validate(); err2 != nil {
				err = goa.MergeErrors(err, err2)
			}
		}
	}
	return
}

// Set Entity (default view)
//
// Identifier: application/vnd.aerospike.amc.entity.set.response+json; view=default
type AerospikeAmcEntitySetResponse struct {
	// Type
	EntityType string `form:"entityType" json:"entityType" xml:"entityType"`
	// Indexes
	Indexes []*AerospikeAmcEntityIndexResponse `form:"indexes,omitempty" json:"indexes,omitempty" xml:"indexes,omitempty"`
	// Last Update Of This Entity in Unix Seconds
	LastUpdate int `form:"lastUpdate" json:"lastUpdate" xml:"lastUpdate"`
	// Set Name
	Name string `form:"name" json:"name" xml:"name"`
}

// Validate validates the AerospikeAmcEntitySetResponse media type instance.
func (mt *AerospikeAmcEntitySetResponse) Validate() (err error) {
	if mt.Name == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "name"))
	}
	if mt.EntityType == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "entityType"))
	}

	for _, e := range mt.Indexes {
		if e != nil {
			if err2 := e.Validate(); err2 != nil {
				err = goa.MergeErrors(err, err2)
			}
		}
	}
	return
}

// Index Point (default view)
//
// Identifier: application/vnd.aerospike.amc.index.response+json; view=default
type AerospikeAmcIndexResponse struct {
	// IndexStats
	Stats map[string]interface{} `form:"Stats,omitempty" json:"Stats,omitempty" xml:"Stats,omitempty"`
	// Bin name that is being indexed
	Bin string `form:"bin" json:"bin" xml:"bin"`
	// Index Type
	BinType string `form:"binType" json:"binType" xml:"binType"`
	// Index Name
	Name string `form:"name" json:"name" xml:"name"`
	// Namespace
	Namespace string `form:"namespace" json:"namespace" xml:"namespace"`
	// Set name
	Set string `form:"set" json:"set" xml:"set"`
	// Is the index synced on all nodes?
	SyncOnAllNodes string `form:"syncOnAllNodes" json:"syncOnAllNodes" xml:"syncOnAllNodes"`
}

// Validate validates the AerospikeAmcIndexResponse media type instance.
func (mt *AerospikeAmcIndexResponse) Validate() (err error) {
	if mt.Name == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "name"))
	}
	if mt.Namespace == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "namespace"))
	}
	if mt.Set == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "set"))
	}
	if mt.Bin == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "bin"))
	}
	if mt.BinType == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "binType"))
	}
	if mt.SyncOnAllNodes == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "syncOnAllNodes"))
	}
	return
}

// AMC Index Response Wrapper (default view)
//
// Identifier: application/vnd.aerospike.amc.index.wrapper.response+json; view=default
type AerospikeAmcIndexWrapperResponse struct {
	// Index Data
	Indexes map[string][]*AerospikeAmcIndexResponse `form:"indexes" json:"indexes" xml:"indexes"`
	// Cluster/Node Status
	Status string `form:"status" json:"status" xml:"status"`
}

// Validate validates the AerospikeAmcIndexWrapperResponse media type instance.
func (mt *AerospikeAmcIndexWrapperResponse) Validate() (err error) {
	if mt.Status == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "status"))
	}
	if mt.Indexes == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "indexes"))
	}
	return
}

// Latency Data (default view)
//
// Identifier: application/vnd.aerospike.amc.latency.response+json; view=default
type AerospikeAmcLatencyResponse struct {
	// Latency values
	Latency []interface{} `form:"latency" json:"latency" xml:"latency"`
	// Node Status
	Status string `form:"status" json:"status" xml:"status"`
}

// Validate validates the AerospikeAmcLatencyResponse media type instance.
func (mt *AerospikeAmcLatencyResponse) Validate() (err error) {
	if mt.Latency == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "latency"))
	}
	if mt.Status == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "status"))
	}
	return
}

// Namespace End Point (default view)
//
// Identifier: application/vnd.aerospike.amc.namespace.response+json; view=default
type AerospikeAmcNamespaceResponse struct {
	// Disk Usage
	Disk *AerospikeAmcResourceUsageResponse `form:"disk" json:"disk" xml:"disk"`
	// Memory Usage
	Memory *AerospikeAmcResourceUsageResponse `form:"memory" json:"memory" xml:"memory"`
	// Namespace Name
	Name string `form:"name" json:"name" xml:"name"`
	// Namespace statistics
	Stats map[string]interface{} `form:"stats" json:"stats" xml:"stats"`
	// Node status
	Status string `form:"status" json:"status" xml:"status"`
}

// Validate validates the AerospikeAmcNamespaceResponse media type instance.
func (mt *AerospikeAmcNamespaceResponse) Validate() (err error) {
	if mt.Name == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "name"))
	}
	if mt.Memory == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "memory"))
	}
	if mt.Disk == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "disk"))
	}
	if mt.Status == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "status"))
	}
	if mt.Stats == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "stats"))
	}
	return
}

// Node End Point (default view)
//
// Identifier: application/vnd.aerospike.amc.node.response+json; view=default
type AerospikeAmcNodeResponse struct {
	// Cluster Visibility
	ClusterVisibility string `form:"clusterVisibility" json:"clusterVisibility" xml:"clusterVisibility"`
	// Disk Usage
	Disk *AerospikeAmcResourceUsageResponse `form:"disk" json:"disk" xml:"disk"`
	// Memory Usage
	Memory *AerospikeAmcResourceUsageResponse `form:"memory" json:"memory" xml:"memory"`
	// If it belongs to the same cluster as the other nodes
	SameCluster bool `form:"sameCluster" json:"sameCluster" xml:"sameCluster"`
	// Node statistics
	Stats map[string]interface{} `form:"stats" json:"stats" xml:"stats"`
	// Node status
	Status string `form:"status" json:"status" xml:"status"`
}

// Validate validates the AerospikeAmcNodeResponse media type instance.
func (mt *AerospikeAmcNodeResponse) Validate() (err error) {
	if mt.Memory == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "memory"))
	}
	if mt.Disk == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "disk"))
	}
	if mt.ClusterVisibility == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "clusterVisibility"))
	}

	if mt.Status == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "status"))
	}
	if mt.Stats == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "stats"))
	}
	return
}

// Resource Usage (default view)
//
// Identifier: application/vnd.aerospike.amc.resource.usage.response+json; view=default
type AerospikeAmcResourceUsageResponse struct {
	// Free Bytes
	FreeBytes int `form:"free-bytes" json:"free-bytes" xml:"free-bytes"`
	// Total Bytes
	TotalBytes int `form:"total-bytes" json:"total-bytes" xml:"total-bytes"`
	// Used Bytes
	UsedBytes int `form:"used-bytes" json:"used-bytes" xml:"used-bytes"`
}

// Validate validates the AerospikeAmcResourceUsageResponse media type instance.
func (mt *AerospikeAmcResourceUsageResponse) Validate() (err error) {

	return
}

// AMC Server System information (default view)
//
// Identifier: application/vnd.aerospike.amc.system.response+json; view=default
type AerospikeAmcSystemResponse struct {
	// AMC Version
	Version *string `form:"version,omitempty" json:"version,omitempty" xml:"version,omitempty"`
}

// Throughput Point (default view)
//
// Identifier: application/vnd.aerospike.amc.throughput.response+json; view=default
type AerospikeAmcThroughputResponse struct {
	// Secondary Value. `Null` means the value was not available or missed.
	Failed *float64 `form:"failed,omitempty" json:"failed,omitempty" xml:"failed,omitempty"`
	// Main Value. `Null` means the value was not available or missed.
	Successful *float64 `form:"successful,omitempty" json:"successful,omitempty" xml:"successful,omitempty"`
	// Timestamp in unix seconds
	Timestamp *int `form:"timestamp,omitempty" json:"timestamp,omitempty" xml:"timestamp,omitempty"`
}

// AMC Throughput Response Wrapper (default view)
//
// Identifier: application/vnd.aerospike.amc.throughput.wrapper.response+json; view=default
type AerospikeAmcThroughputWrapperResponse struct {
	// Cluster/Node Status
	Status string `form:"status" json:"status" xml:"status"`
	// Throughput Data
	Throughput map[string]map[string][]*AerospikeAmcThroughputResponse `form:"throughput" json:"throughput" xml:"throughput"`
}

// Validate validates the AerospikeAmcThroughputWrapperResponse media type instance.
func (mt *AerospikeAmcThroughputWrapperResponse) Validate() (err error) {
	if mt.Status == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "status"))
	}
	if mt.Throughput == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "throughput"))
	}
	return
}

// User (default view)
//
// Identifier: application/vnd.aerospike.amc.user.query.response+json; view=default
type AerospikeAmcUserQueryResponse struct {
	// User account is active
	Active *bool `form:"active,omitempty" json:"active,omitempty" xml:"active,omitempty"`
	// User's fullname
	FullName *string `form:"fullName,omitempty" json:"fullName,omitempty" xml:"fullName,omitempty"`
	// Additional Notes
	Notes *string `form:"notes,omitempty" json:"notes,omitempty" xml:"notes,omitempty"`
	// AMC User Roles
	Roles []string `form:"roles,omitempty" json:"roles,omitempty" xml:"roles,omitempty"`
	// User Id
	Username string `form:"username" json:"username" xml:"username"`
}

// Validate validates the AerospikeAmcUserQueryResponse media type instance.
func (mt *AerospikeAmcUserQueryResponse) Validate() (err error) {
	if mt.Username == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "username"))
	}
	return
}

// Resource Usage (default view)
//
// Identifier: application/vnd.aerospike.amc.version.info.response+json; view=default
type AerospikeAmcVersionInfoResponse struct {
	// Latest server version used in the cluster
	LatestVersion string `form:"latestVersion" json:"latestVersion" xml:"latestVersion"`
	// Map of server versions to nodes
	VersionList map[string][]string `form:"versionList" json:"versionList" xml:"versionList"`
}

// Validate validates the AerospikeAmcVersionInfoResponse media type instance.
func (mt *AerospikeAmcVersionInfoResponse) Validate() (err error) {
	if mt.VersionList == nil {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "versionList"))
	}
	if mt.LatestVersion == "" {
		err = goa.MergeErrors(err, goa.MissingAttributeError(`response`, "latestVersion"))
	}
	return
}
