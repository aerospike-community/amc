package controllers

import (
	"net/http"
	"strings"
	"sync"

	// log "github.com/sirupsen/logrus"
	// as "github.com/aerospike/aerospike-client-go/v5"
	// ast "github.com/aerospike/aerospike-client-go/v5/types"
	"github.com/labstack/echo/v4"

	"github.com/aerospike-community/amc/common"
	"github.com/aerospike-community/amc/models"
)

func getClusterXdrNodes(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	keys := []string{
		"stat_recs_outstanding", "timediff_lastship_cur_secs", "xdr_timelag",
		"esmt_bytes_shipped", "stat_recs_relogged",
		"stat_recs_shipped", "free_dlog_pct",
		"cur_throughput", "esmt-bytes-shipped", "free-dlog-pct",
	}

	res := map[string]common.Stats{}
	for _, node := range cluster.Nodes() {
		if node.Status() != "on" && !node.XdrEnabled() {
			res[node.Address()] = common.Stats{
				"xdr_status":  node.XdrStatus(),
				"node_status": node.Status(),
			}
			continue
		}

		stats := node.AnyAttrs(keys...)
		stats["xdr_status"] = node.XdrStatus()
		stats["node_status"] = node.Status()
		res[node.Address()] = stats
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterXdrNodeAllStats(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nodeAddress := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddress)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
			"xdr_status":  "off",
		})
	}

	res := node.XdrStats()
	res["node_status"] = "on"
	res["xdr_status"] = node.XdrStatus()

	return c.JSON(http.StatusOK, res)
}

func setClusterXdrNodesConfig(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nodeAddrs := strings.Split(c.Param("nodes"), ",")
	res := make(common.Stats, len(nodeAddrs))
	for _, addr := range nodeAddrs {
		res[addr] = map[string]interface{}{"node_status": "off"}
	}

	nodes := cluster.FindNodesByAddress(nodeAddrs...)
	if len(nodes) == 0 {
		return c.JSON(http.StatusOK, res)
	}

	formParams, err := c.FormParams()
	if err != nil {
		return c.JSON(http.StatusOK, errorMap("No Parameters found"))
	}
	config := make(map[string]string, len(formParams))
	for k, v := range formParams {
		config[k] = ""
		if len(v) > 0 {
			config[k] = v[0]
		}
	}

	wg := new(sync.WaitGroup)
	wg.Add(len(nodes))
	resChan := make(chan *NodeResult, len(nodes))

	for _, node := range nodes {
		go func(node *models.Node) {
			defer wg.Done()

			unsetParams, err := node.SetServerConfig("xdr", config)
			resChan <- &NodeResult{Name: node.Address(), Status: string(node.Status()), Err: err, UnsetParams: unsetParams}
		}(node)
	}

	wg.Wait()
	close(resChan)

	for nr := range resChan {
		nodeStatus := nr.Status
		if nr.Node != nil {
			nodeStatus = string(nr.Node.Status())
		}

		err := ""
		if nr.Err != nil {
			err = nr.Err.Error()
		}

		res[nr.Name] = map[string]interface{}{
			"node_status":      nodeStatus,
			"error":            err,
			"unset_parameters": nr.UnsetParams,
		}
	}

	return c.JSON(http.StatusOK, res)
}

func postSwitchXDR(c echo.Context, on bool) error {
	nodeAddr := c.Param("node")
	res := map[string]interface{}{
		"address": nodeAddr,
		"status":  "failure",
	}

	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		res["error"] = "Cluster not found"
		return c.JSON(http.StatusNotFound, res)
	}

	node := cluster.FindNodeByAddress(nodeAddr)
	if node == nil {
		res["node_status"] = "off"
		res["error"] = "Node not found"
		return c.JSON(http.StatusBadRequest, res)
	}

	switch string(node.XdrStatus()) {
	case "on":
		if on {
			res["error"] = "XDR Already On"
			return c.JSON(http.StatusOK, res)
		}
	case "off":
		if !on {
			res["error"] = "XDR Already Off"
			return c.JSON(http.StatusOK, res)
		}
	}

	if err := node.SwitchXDR(on); err != nil {
		res["error"] = err
		return c.JSON(http.StatusBadRequest, res)
	}

	res["status"] = "Success"
	return c.JSON(http.StatusOK, res)
}

func postSwitchXDROn(c echo.Context) error {
	return postSwitchXDR(c, true)
}

func postSwitchXDROff(c echo.Context) error {
	return postSwitchXDR(c, false)
}

func getClusterXdrNodesAllConfig(c echo.Context) error {
	clusterUUID := c.Param("clusterUUID")
	cluster := _observer.FindClusterByID(clusterUUID)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nodeAddr := c.Param("nodes")
	node := cluster.FindNodeByAddress(nodeAddr)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	res := node.XdrConfig()
	res["address"] = node.Address()
	res["node_status"] = node.Status()

	return c.JSON(http.StatusOK, res)
}
