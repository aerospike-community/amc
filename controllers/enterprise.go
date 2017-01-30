package controllers

import (
	"errors"
	"math"
	"net/http"
	"strings"
	"sync"

	// log "github.com/Sirupsen/logrus"
	"github.com/labstack/echo"

	"github.com/citrusleaf/amc/common"
	"github.com/citrusleaf/amc/models"
)

func postClusterFireCmd(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	cmd := c.FormValue("command")
	if len(cmd) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid command"))
	}

	type nodeCommand struct {
		Node *models.Node
		Res  map[string]string
		Err  error
	}

	nodes := cluster.Nodes()
	ch := make(chan nodeCommand, len(nodes))

	wg := new(sync.WaitGroup)
	for _, node := range nodes {
		if node != nil {
			wg.Add(1)
			go func(node *models.Node) {
				defer wg.Done()

				result, err := node.RequestInfo(1, cmd)
				ch <- nodeCommand{Node: node, Res: result, Err: err}
			}(node)
		} else {
			ch <- nodeCommand{Node: node, Res: nil, Err: nil}
		}
	}

	wg.Wait()
	close(ch)

	res := map[string][]string{}
	for r := range ch {
		res[r.Node.Address()] = nil
		if r.Err == nil && len(r.Res) > 0 && len(r.Res[cmd]) > 0 {
			res[r.Node.Address()] = strings.Split(r.Res[cmd], ";")
		}
	}

	return c.JSON(http.StatusOK, res)
}

func getCurrentMonitoringClusters(c echo.Context) error {
	sid, err := sessionId(c)
	if err != nil {
		invalidateSession(c)
		return c.JSON(http.StatusOK, errorMap("invalid session : None"))
	}

	clusters, _ := _observer.MonitoringClusters(sid)
	result := make([]map[string]interface{}, len(clusters))
	for i, cluster := range clusters {
		result[i] = map[string]interface{}{
			"username":     cluster.User(),
			"cluster_name": cluster.Alias(),
			"cluster_id":   cluster.Id(),
			"roles":        cluster.RoleNames(),
			"seed_node":    cluster.SeedAddress(),
		}
	}

	return c.JSON(http.StatusOK, result)
}

func getMultiClusterView(c echo.Context) error {

	return c.JSON(http.StatusOK, _observer.DatacenterInfo())
}

var opMapper = map[string]string{
	"read":  "reads",
	"write": "writes",
	"query": "query",
	"scan":  "scan",
	"udf":   "udf",
}

func transformLatency(latestLatency map[string]common.Stats) common.Stats {
	const LTE = "&#x2264;"

	latencies := make(common.Stats, len(latestLatency))

	for op, stats := range latestLatency {
		buckets := stats["buckets"].([]string)
		valBuckets := stats["valBuckets"].([]float64)

		totalOver1ms := 0.0
		for _, v := range valBuckets {
			totalOver1ms += v
		}

		tps := stats.TryFloat("tps", 0)
		tpsCalc := tps
		if tpsCalc == 0 {
			tpsCalc = 1
		}

		timestamp := stats["timestamp"].(string)
		timestamp = timestamp[:8]

		data := make([]map[common.JsonRawString]interface{}, 0, len(buckets)+1)

		if len(buckets) > 0 {
			pct := math.Max(0, 100.0-totalOver1ms)
			data = append(data, map[common.JsonRawString]interface{}{
				common.JsonRawString(LTE + buckets[0][1:]): common.Stats{
					"value": math.Max(0, tps*pct/100),
					"pct":   math.Max(0, pct),
				},
			})
		}

		for i := range buckets {
			title := buckets[i]
			if i < len(buckets)-1 {
				title += " to " + LTE + buckets[i+1][1:]
			}
			data = append(data, map[common.JsonRawString]interface{}{
				common.JsonRawString(title): common.Stats{
					"value": valBuckets[i] * tps / 100.0,
					// "pct":   common.Round(valBuckets[i], 0.01, 2),
					"pct": valBuckets[i],
				},
			})
		}

		latencies[opMapper[op]] = common.Stats{
			"timestamp":      timestamp,
			"timestamp_unix": stats["timestamp_unix"],
			"ops/sec":        tps,
			"data":           data,
		}
	}

	return latencies
}

func getNodeLatencyHistory(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	node := cluster.FindNodeByAddress(c.Param("nodes"))
	if node == nil {
		return c.JSON(http.StatusOK, errorMap("Node not found"))
	}

	latencyHistory := []common.Stats{}
	for _, latency := range node.LatencySince(c.QueryParam("start_time")) {
		latencyHistory = append(latencyHistory, transformLatency(latency))
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"node_status":     node.Status(),
		"node_build":      node.Build(),
		"latency_history": latencyHistory,
		"address":         node.Address(),
	})
}

func getNodeLatency(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nodes := cluster.FindNodesByAddress(strings.Split(c.Param("nodes"), ",")...)
	if len(nodes) == 0 {
		return c.JSON(http.StatusOK, errorMap("Node not found"))
	}

	res := map[string]interface{}{}
	for _, node := range nodes {
		latestLatency := node.LatestLatency()
		res[node.Address()] = common.Stats{
			"latency":     transformLatency(latestLatency),
			"node_status": node.Status(),
		}
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterNodeAllConfig(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nodeAddr := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddr)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	res := node.ConfigAttrs()
	res["address"] = node.Address()
	res["node_status"] = node.Status()

	return c.JSON(http.StatusOK, res)
}

func setClusterNodesConfig(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
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

			err := node.SetServerConfig("service", config)
			resChan <- &NodeResult{Name: node.Address(), Err: err}
		}(node)
	}

	wg.Wait()
	close(resChan)

	for nr := range resChan {
		if nr.Err != nil {
			res[nr.Name] = map[string]interface{}{"node_status": "off"}
		} else {
			res[nr.Name] = map[string]interface{}{
				"node_status":      "on",
				"unset_parameters": []string{},
			}
		}
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterNamespaceAllConfig(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nodeAddr := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddr)
	if node == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"node":        nodeAddr,
			"node_status": "off",
		})
	}

	ns := node.NamespaceByName(c.Param("namespace"))
	if ns == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node":        nodeAddr,
			"node_status": "off",
		})
	}

	res := ns.ConfigAttrs()
	res["node"] = nodeAddr
	res["node_status"] = node.Status()

	return c.JSON(http.StatusOK, res)
}

func setClusterNamespaceConfig(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nodeAddrs := strings.Split(c.Param("node"), ",")
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
		return c.JSON(http.StatusOK, errorMap("Invalid input"))
	}

	config := make(map[string]string, len(formParams))
	for k, v := range formParams {
		config[k] = ""
		if len(v) > 0 {
			config[k] = v[0]
		}
	}

	namespaceName := c.Param("namespace")
	resChan := make(chan *NodeResult, len(nodes))
	wg := new(sync.WaitGroup)
	for _, node := range nodes {
		ns := node.NamespaceByName(namespaceName)
		if ns != nil {
			wg.Add(1)
			go func(node *models.Node, ns *models.Namespace) {
				defer wg.Done()

				err := ns.SetConfig(config)
				resChan <- &NodeResult{Name: node.Address(), Status: "on", Err: err}
			}(node, ns)
		} else {
			resChan <- &NodeResult{Name: namespaceName, Status: "on", Err: errors.New("Node not found")}
		}
	}

	wg.Wait()
	close(resChan)

	for nr := range resChan {
		if nr.Err != nil {
			res[nr.Name] = map[string]interface{}{
				"node_status":      nr.Status,
				"namespace_status": "off",
				"unset_parameters": []string{},
			}
		} else {
			res[nr.Name] = map[string]interface{}{
				"node_status":      "on",
				"namespace_status": "on",
				"unset_parameters": []string{},
			}
		}
	}

	return c.JSON(http.StatusOK, res)
}

func postAddClusterNodes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("cluster not found"))
	}

	form := struct {
		Address string `form:"address"`
	}{}

	c.Bind(&form)
	if len(form.Address) == 0 {
		return c.JSON(http.StatusOK, errorMap("No seed name specified."))
	}

	host, port, err := common.SplitHostPort(form.Address)
	if err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	err = cluster.AddNode(host, port)
	if err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// create output
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func getAlertEmails(c echo.Context) error {
	// create output
	return c.JSON(http.StatusOK, _observer.Config().AlertEmails())
}

func postAlertEmails(c echo.Context) error {
	form := struct {
		Emails string `form:"emails"`
	}{}

	c.Bind(&form)
	if len(form.Emails) == 0 {
		return c.JSON(http.StatusOK, errorMap("No emails specified."))
	}

	emails := strings.Split(form.Emails, ",")
	err := _observer.Config().AppendAlertEmails(emails)

	if err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// create output
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func deleteAlertEmails(c echo.Context) error {
	form := struct {
		Emails string `form:"emails"`
	}{}

	c.Bind(&form)
	if len(form.Emails) == 0 {
		return c.JSON(http.StatusOK, errorMap("No emails specified."))
	}

	emails := strings.Split(form.Emails, ",")
	err := _observer.Config().DeleteAlertEmails(emails)

	if err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// create output
	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func postSwitchNodeOff(c echo.Context) error {
	nodeAddr := c.Param("node")
	res := map[string]interface{}{
		"address": nodeAddr,
		"status":  "Failure",
	}

	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		res["error"] = "Cluster not found"
		return c.JSON(http.StatusNotFound, res)
	}

	if err := cluster.RemoveNodeByAddress(nodeAddr); err != nil {
		res["error"] = err.Error()
		return c.JSON(http.StatusNotFound, res)
	}

	res["status"] = "Success"
	return c.JSON(http.StatusOK, res)
}
