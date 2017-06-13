package controllers

import (
	"github.com/citrusleaf/amc/app"
	"github.com/citrusleaf/amc/models"
)

func indexInfo(cluster *models.Cluster, idxName *string, includeStats bool) map[string][]*app.AerospikeAmcIndexResponse {
	indexInfo := map[string][]*app.AerospikeAmcIndexResponse{}
	for _, node := range cluster.Nodes() {
		if node.Status() == "on" {
			for _, nsName := range cluster.NamespaceList() {
				for _, v := range node.Indexes(nsName) {
					indexStats := v.ToStats()

					if idxName != nil && indexStats.TryString("indexname", "") != *idxName {
						continue
					}

					idxObj := &app.AerospikeAmcIndexResponse{
						Name:           indexStats.TryString("indexname", ""),
						Namespace:      indexStats.TryString("ns", ""),
						Set:            indexStats.TryString("set", ""),
						Bin:            indexStats.TryString("bin", ""),
						BinType:        indexStats.TryString("type", ""),
						SyncOnAllNodes: indexStats.TryString("sync_state", ""),
					}

					if includeStats {
						if ns := node.NamespaceByName(nsName); ns != nil {
							idxObj.Stats = ns.IndexStats(idxObj.Name)
						}
					}

					indexInfo[node.Address()] = append(indexInfo[node.Address()], idxObj)
				}
			}
		}
	}

	return indexInfo
}
