package controllers

import (
	// "fmt"
	// "encoding/json"
	"errors"
	// "fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	// . "github.com/ahmetalpbalkan/go-linq"
	log "github.com/Sirupsen/logrus"
	ast "github.com/aerospike/aerospike-client-go/types"
	"github.com/labstack/echo"
	"github.com/satori/go.uuid"

	"github.com/citrusleaf/amc/common"
	// "github.com/citrusleaf/amc/observer"
)

//----------
// Handlers
//----------

func sessionId(c echo.Context) (string, error) {
	cookie, err := c.Cookie("session")
	if err != nil || cookie.Value == "" {
		return "", errors.New("Invalid session")
	}

	return cookie.Value, nil
}

func manageSession(c echo.Context) string {
	cookie, err := c.Cookie("session")
	if err != nil || cookie.Value == "" {
		return setSession(c)
	}

	if !_observer.SessionExists(cookie.Value) {
		return setSession(c)
	}

	return cookie.Value
}

// func invalidateSession(c echo.Context) {
// 	cookie := new(http.Cookie)
// 	cookie.Name = "session"
// 	cookie.Value = ""
// 	cookie.Expires = time.Now().Add(-365 * 24 * time.Hour)
// 	c.SetCookie(cookie)
// }

func setSession(c echo.Context) string {
	sid := "00000000-0000-0000-0000-000000000000"
	// commonity version is single-session
	if common.AMCIsEnterprise() {
		sid = uuid.NewV4().String()
	}

	cookie, err := c.Cookie("session")
	if err != nil {
		cookie = new(http.Cookie)
	}
	cookie.Value = sid
	cookie.Expires = time.Now().Add(24 * time.Hour)
	c.SetCookie(cookie)

	return sid
}

func errorMap(err string) map[string]interface{} {
	return map[string]interface{}{
		"status": "failure",
		"error":  err,
	}
}

func postGetClusterId(c echo.Context) error {
	log.Info("getClusterId...")

	form := struct {
		SeedNode     string `form:"seed_node"`
		Username     string `form:"username"`
		Password     string `form:"password"`
		ClusterAlias string `form:"cluster_name"`
	}{}

	c.Bind(&form)
	if len(form.SeedNode) == 0 {
		return c.JSON(http.StatusNotFound, errorMap("No seed name specified."))
	}

	host, port, err := common.SplitHostPort(form.SeedNode)
	if err != nil {
		return c.JSON(http.StatusNotFound, errorMap(err.Error()))
	}

	sid := manageSession(c)
	cluster := _observer.FindClusterBySeed(sid, host, port, form.Username, form.Password)
	if cluster != nil {
		_observer.AppendCluster(sid, cluster)
	}

	if cluster == nil {
		clientPolicy := *_defaultClientPolicy
		clientPolicy.User = form.Username
		clientPolicy.Password = form.Password
		cluster, err = _observer.Register(sid, &clientPolicy, host, uint16(port))
		if err != nil {
			if aerr, ok := err.(ast.AerospikeError); ok && aerr.ResultCode() == ast.NOT_AUTHENTICATED {
				// create output
				response := map[string]interface{}{
					"security_enabled": true,
					"cluster_id":       nil,
				}
				return c.JSON(http.StatusOK, response)
			}

			log.Error(err)
			return c.JSON(http.StatusNotFound, errorMap(err.Error()))
		}
	}

	// create output
	response := map[string]interface{}{
		"status":              "success",
		"security_enabled":    cluster.SecurityEnabled(),
		"build_details":       cluster.BuildDetails(),
		"nodes_compatibility": cluster.NodeCompatibility(),
		"cluster_id":          cluster.Id(),
		"update_interval":     cluster.UpdateInterval(),
		"nodes":               cluster.NodeList(),
		"seed_address":        cluster.SeedAddress(),
	}

	return c.JSON(http.StatusOK, response)

	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"security_enabled": false,
	// 	"status": "success",
	// 	"build_details": {
	// 		"version_list": {
	// 			"3.10.0.3": ["172.16.224.150:3020",	"172.16.224.150:3030", "172.16.224.150:3010", "172.16.224.150:3000"]
	// 		},
	// 		"latest_build_no": "3.10.0.3"
	// 	},
	// 	"nodes_compatibility": "homogeneous",
	// 	"cluster_id": "f7b04e3c-dad6-4ed4-8c04-6a543e17003a",
	// 	"update_interval": 5,
	// 	"nodes": [
	// 		"172.16.224.150:3020",
	// 		"172.16.224.150:3030",
	// 		"172.16.224.150:3010",
	// 		"172.16.224.150:3000"
	// 	],
	// 	"seed_address": "172.16.224.150:3000"
	// }`))
}

func postClusterFireCmd(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	node := cluster.RandomActiveNode()
	if node == nil {
		return c.JSON(http.StatusNotFound, errorMap("No active nodes found in the cluster"))
	}

	return nil
}

func getCurrentMonitoringClusters(c echo.Context) error {

	// sid, err := sessionId(c)
	// if err != nil {
	// 	// invalidateSession(c)
	// 	return c.JSON(http.StatusOK, errorMap("invalid session : None"))
	// }

	clusters, err := _observer.MonitoringClusters("sid")
	if err != nil {
		return c.JSON(http.StatusOK, errorMap("invalid session : None"))
	}

	result := make([]map[string]interface{}, len(clusters))
	for i, cluster := range clusters {
		result[i] = map[string]interface{}{
			"username":     cluster.User(),
			"cluster_name": cluster.Alias(),
			"cluster_id":   cluster.Id(),
			"roles":        cluster.Roles(),
			"seed_node":    cluster.SeedAddress(),
		}
	}

	return c.JSON(http.StatusOK, result)

	// return c.JSONBlob(http.StatusOK, []byte(`[
	// 	{
	// 		"username": null,
	// 		"cluster_name": null,
	// 		"cluster_id": "f7b04e3c-dad6-4ed4-8c04-6a543e17003a",
	// 		"roles": null,
	// 		"seed_node": "172.16.224.150:3000"
	// 	}
	// ]`))
}

func getMultiClusterView(c echo.Context) error {

	return c.JSON(http.StatusOK, _observer.DatacenterInfo())

	// port := c.Param("port")
	// fmt.Println(port)
	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"status": "success",
	// 	"data": {
	// 		"e84f8ba2-9123-4f4d-86fc-d618b28ff228": {
	// 			"dc_name": [],
	// 			"read_tps": {
	// 				"total": 0,
	// 				"success": 0
	// 			},
	// 			"seednode": "172.16.224.150:3000",
	// 			"xdr_info": {},
	// 			"cluster_name": null,
	// 			"namespaces": ["test", "bar"],
	// 			"nodes": {
	// 				"BCDEB6C71290C00": {
	// 					"status": "on",
	// 					"access_ip": "172.16.224.150",
	// 					"cur_throughput": null,
	// 					"ip": "172.16.224.150",
	// 					"access_port": "3020",
	// 					"xdr_uptime": null,
	// 					"port": "3020",
	// 					"lag": null
	// 				},
	// 				"BD7EB6C71290C00": {
	// 					"status": "on",
	// 					"access_ip": "172.16.224.150",
	// 					"cur_throughput": null,
	// 					"ip": "172.16.224.150",
	// 					"access_port": "3030",
	// 					"xdr_uptime": null,
	// 					"port": "3030",
	// 					"lag": null
	// 				},
	// 				"BC3EB6C71290C00": {
	// 					"status": "on",
	// 					"access_ip": "172.16.224.150",
	// 					"cur_throughput": null,
	// 					"ip": "172.16.224.150",
	// 					"access_port": "3010",
	// 					"xdr_uptime": null,
	// 					"port": "3010",
	// 					"lag": null
	// 				},
	// 				"BB9EB6C71290C00": {
	// 					"status": "on",
	// 					"access_ip": "172.16.224.150",
	// 					"cur_throughput": null,
	// 					"ip": "172.16.224.150",
	// 					"access_port": "3000",
	// 					"xdr_uptime": null,
	// 					"port": "3000",
	// 					"lag": null
	// 				}
	// 			},
	// 			"write_tps": {
	// 				"total": 0,
	// 				"success": 0
	// 			},
	// 			"discovery": "complete"
	// 		}
	// 	}
	// }`))
}

func getCluster(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("cluster not found"))
	}

	builds := cluster.NodeBuilds()
	var clusterBuild interface{}
	if len(builds) > 0 {
		clusterBuild = builds[0]
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"cluster_builds":          builds,
		"different_cluster_nodes": []string{},
		"indexes":                 cluster.NamespaceIndexes(),
		"build":                   clusterBuild,
		"namespaces":              cluster.NamespaceList(),
		"update_interval":         cluster.UpdateInterval(),
		"nodes":                   cluster.NodeList(),
		"cluster_status":          cluster.Status(),
	})

	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"cluster_builds": ["3.10.0.3"],
	// 	"different_cluster_nodes": [],
	// 	"indexes": {
	// 		"test": ["Rdg6CNRTlYZSy45mLNYkQvj4Hq5BJwt151XgJ5degX1bUXgxsNAerospike1"]
	// 	},
	// 	"build": "3.10.0.3",
	// 	"namespaces": ["test", "bar"],
	//  	"nodes": [
	// 	 	"172.16.224.150:3020",
	// 		"172.16.224.150:3030",
	// 		"172.16.224.150:3010",
	// 		"172.16.224.150:3000"
	// 	],
	// 	"update_interval": 5,
	// 	"cluster_status": "on"
	// }`))
}

func getClusterBasic(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("cluster not found"))
	}

	builds := cluster.NodeBuilds()
	var clusterBuild interface{}
	if len(builds) > 0 {
		clusterBuild = builds[0]
	}

	userRoles := cluster.Users()
	users := []string{}
	if u, exists := userRoles["users"]; exists {
		users = u.([]string)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"cluster_builds":         builds,
		"build_details":          cluster.BuildDetails(),
		"active_red_alert_count": 0, // TODO: implement
		"users":                  users,
		"off_nodes":              cluster.OffNodes(),
		"nodes_compatibility":    cluster.NodeCompatibility(),
		"cluster_status":         cluster.Status(),
		"namespaces":             cluster.NamespaceList(),
		"memory":                 cluster.Memory(),
		"nodes":                  cluster.NodeList(),
		"disk":                   cluster.Disk(),
		"build":                  clusterBuild,
		"update_interval":        cluster.UpdateInterval(),
	})

	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"cluster_builds": ["3.10.0.3"],
	// 	"build_details": {
	// 		"version_list": {
	// 			"3.10.0.3": [
	// 				"172.16.224.150:3020",
	// 				"172.16.224.150:3030",
	// 				"172.16.224.150:3010",
	// 				"172.16.224.150:3000"
	// 			]
	// 		},
	// 		"latest_build_no": "3.10.0.3"
	// 	},
	// 	"active_red_alert_count": 0,
	// 	"users": {},
	// 	"off_nodes": [],
	// 	"nodes_compatibility": "homogeneous",
	// 	"cluster_status": "on",
	// 	"namespaces": ["test", "bar"],
	// 	"memory": {
	// 		"used": 15008539,
	// 		"details": {
	// 			"172.16.224.150:3030": {
	// 				"used": 3772215,
	// 				"free": 2143711433
	// 			},
	// 			"172.16.224.150:3010": {
	// 				"used": 3753581,
	// 				"free": 2143730067
	// 			},
	// 			"172.16.224.150:3020": {
	// 				"used": 3691934,
	// 				"free": 2143791714
	// 			},
	// 			"172.16.224.150:3000": {
	// 				"used": 3790809,
	// 				"free": 2143692839
	// 			}
	// 		},
	// 		"free": 8574926053
	// 	},
	// 	"nodes": [
	// 		"172.16.224.150:3020",
	// 		"172.16.224.150:3030",
	// 		"172.16.224.150:3010",
	// 		"172.16.224.150:3000"
	// 	],
	// 	"disk": {
	// 		"used": 0,
	// 		"details": {
	// 			"172.16.224.150:3030": {
	// 				"used": 0,
	// 				"free": 1073741824
	// 			},
	// 			"172.16.224.150:3010": {
	// 				"used": 0,
	// 				"free": 1073741824
	// 			},
	// 			"172.16.224.150:3020": {
	// 				"used": 0,
	// 				"free": 1073741824
	// 			},
	// 			"172.16.224.150:3000": {
	// 				"used": 0,
	// 				"free": 1073741824
	// 			}
	// 		},
	// 		"free": 4294967296
	// 	},
	// 	"update_interval": 5,
	// 	"build": "3.10.0.3"
	// }`))
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
					// "value": math.Max(0, common.Round(tps*pct/100, 0.01, 2)),
					// "pct":   math.Max(0, common.Round(pct, 0.01, 2)),
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
			"timestamp": timestamp,
			"ops/sec":   tps,
			"data":      data,
		}
	}

	return latencies
}

func getNodeLatencyHistory(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"status": "failure", "error": "Cluster not found"})
	}

	node := cluster.FindNodeByAddress(c.Param("nodes"))
	if node == nil {
		return c.JSON(http.StatusNotFound, map[string]string{"status": "failure", "error": "Node not found"})
	}

	latencyHistory := []common.Stats{}
	for _, latency := range node.LatencySince(c.Param("start_time")) {
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
		return c.JSON(http.StatusBadRequest, map[string]string{"status": "failure", "error": "Cluster not found"})
	}

	nodes := cluster.FindNodesByAddress(strings.Split(c.Param("nodes"), ",")...)
	if len(nodes) == 0 {
		return c.JSON(http.StatusNotFound, map[string]string{"status": "failure", "error": "Node not found"})
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

	// sres := `{
	//    "172.16.224.150:3000":{
	//       "latency":{
	//          "reads":{
	//             "timestamp":"17:01:21",
	//             "data":[
	//                {
	//                   "&#x2264;1ms":{
	//                      "pct":94.58,
	//                      "value":5397.2077
	//                   }
	//                },
	//                {
	//                   ">1ms to &#x2264;8ms":{
	//                      "pct":5.29,
	//                      "value":301.87385
	//                   }
	//                },
	//                {
	//                   ">8ms to &#x2264;64ms":{
	//                      "pct":0.13,
	//                      "value":7.41845
	//                   }
	//                },
	//                {
	//                   ">64ms":{
	//                      "pct":0.0,
	//                      "value":0.0
	//                   }
	//                }
	//             ],
	//             "ops/sec":5706.5
	//          },
	//          "writes":{
	//             "timestamp":"17:01:21",
	//             "data":[
	//                {
	//                   "&#x2264;1ms":{
	//                      "pct":48.97,
	//                      "value":704.13963
	//                   }
	//                },
	//                {
	//                   ">1ms to &#x2264;8ms":{
	//                      "pct":50.580000000000005,
	//                      "value":727.2898200000001
	//                   }
	//                },
	//                {
	//                   ">8ms to &#x2264;64ms":{
	//                      "pct":0.44999999999999996,
	//                      "value":6.47055
	//                   }
	//                },
	//                {
	//                   ">64ms":{
	//                      "pct":0.0,
	//                      "value":0.0
	//                   }
	//                }
	//             ],
	//             "ops/sec":1437.9
	//          }
	//       },
	//       "node_status":"on"
	//    }
	// }`
}

func getClusterThroughputHistory(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"status": "failure", "error": "Cluster not found"})
	}

	since := time.Now().Unix() - (31 * 60) // 30 minutes
	beginStr := c.Param("start_time")
	if beginStr != "" {
		sinceUnix, err := strconv.ParseInt(beginStr, 10, 64)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"status": "failure", "error": "Invalid start_time value"})
		}
		since = sinceUnix / 1000
	}

	// make the output. x: timestamp, y: total reqs, y: successful reqs
	type chartStat struct {
		X         *int64   `json:"x"`
		Y         *float64 `json:"y"`
		Secondary *float64 `json:"secondary"`
	}

	converter := map[string][2]string{
		"read_tps":  {"stat_read_reqs", "stat_read_success"},
		"write_tps": {"stat_write_reqs", "stat_write_success"},

		"xdr_read_tps":  {"xdr_read_reqs", "xdr_read_success"},
		"xdr_write_tps": {"xdr_write_reqs", "xdr_write_success"},

		"scan_tps":  {"scan_reqs", "scan_success"},
		"query_tps": {"query_reqs", "query_success"},

		"udf_tps":        {"udf_reqs", "udf_success"},
		"batch_read_tps": {"batch_read_reqs", "batch_read_success"},
	}

	tm := time.Unix(since, 0)
	throughput := cluster.ThroughputSince(tm)

	res := map[string]interface{}{
		"cluster_status": cluster.Status(),
	}

	for outStatName, aliases := range converter {
		primaryVals := throughput[aliases[0]]
		secondaryVals := throughput[aliases[1]]

		statRes := map[string][]chartStat{}
		for node, yValuesList := range primaryVals {
			statList := make([]chartStat, 0, len(yValuesList))
			for i, yValues := range yValuesList {
				statList = append(statList, chartStat{X: yValues.TimestampJson(&tm), Y: yValues.Value(), Secondary: secondaryVals[node][i].Value()})
			}
			statRes[node] = statList
		}

		res[outStatName] = statRes
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterThroughput(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	// make the output. x: timestamp, y: total reqs, y: successful reqs
	type chartStat struct {
		X         *int64   `json:"x"`
		Y         *float64 `json:"y"`
		Secondary *float64 `json:"secondary"`
	}

	converter := map[string][2]string{
		"read_tps":  {"stat_read_reqs", "stat_read_success"},
		"write_tps": {"stat_write_reqs", "stat_write_success"},

		"xdr_read_tps":  {"xdr_read_reqs", "xdr_read_success"},
		"xdr_write_tps": {"xdr_write_reqs", "xdr_write_success"},

		"scan_tps":  {"scan_reqs", "scan_success"},
		"query_tps": {"query_reqs", "query_success"},

		"udf_tps":        {"udf_reqs", "udf_success"},
		"batch_read_tps": {"batch_read_reqs", "batch_read_success"},
	}

	throughput := cluster.LatestThroughput()

	res := map[string]interface{}{
		"cluster_status": cluster.Status(),
	}

	for outStatName, aliases := range converter {
		primaryVals := throughput[aliases[0]]
		secondaryVals := throughput[aliases[1]]

		statRes := map[string]chartStat{}
		for node, yValues := range primaryVals {
			statRes[node] = chartStat{X: yValues.TimestampJson(nil), Y: yValues.Value(), Secondary: secondaryVals[node].Value()}
		}

		res[outStatName] = statRes
	}

	// log.Info(res)

	return c.JSON(http.StatusOK, res)

	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"cluster_status": "on",
	// 	"read_tps": {
	// 		"172.16.224.150:3030": {"y": 0.0, "x": 1478352637081, "secondary": 0.0},
	// 		"172.16.224.150:3010": {"y": 0.0, "x": 1478352637090, "secondary": 0.0},
	// 		"172.16.224.150:3020": {"y": 0.0, "x": 1478352637072, "secondary": 0.0},
	// 		"172.16.224.150:3000": {"y": 0.0, "x": 1478352637098, "secondary": 0.0}
	// 	},
	// 	"batch_read_tps": {
	// 		"172.16.224.150:3030": {"y": 0.0, "x": 1478352637081, "secondary": 0.0},
	// 		"172.16.224.150:3010": {"y": 0.0, "x": 1478352637090, "secondary": 0.0},
	// 		"172.16.224.150:3020": {"y": 0.0, "x": 1478352637072, "secondary": 0.0},
	// 		"172.16.224.150:3000": {"y": 0.0, "x": 1478352637098, "secondary": 0.0}
	// 	},
	// 	"xdr_read_tps": {
	// 		"172.16.224.150:3030": {"y": null, "x": 1478352637081, "secondary": null},
	// 		"172.16.224.150:3010": {"y": null, "x": 1478352637090, "secondary": null},
	// 		"172.16.224.150:3020": {"y": null, "x": 1478352637072, "secondary": null},
	// 		"172.16.224.150:3000": {"y": null, "x": 1478352637098, "secondary": null}
	// 	},
	// 	"scan_tps": {
	// 		"172.16.224.150:3030": {"y": 0.0, "x": 1478352637081, "secondary": 0.0},
	// 		"172.16.224.150:3010": {"y": 0.0, "x": 1478352637090, "secondary": 0.0},
	// 		"172.16.224.150:3020": {"y": 0.0, "x": 1478352637072, "secondary": 0.0},
	// 		"172.16.224.150:3000": {"y": 0.0, "x": 1478352637098, "secondary": 0.0}
	// 	},
	// 	"udf_tps": {
	// 		"172.16.224.150:3030": {"y": 0.0, "x": 1478352637081, "secondary": 0.0},
	// 		"172.16.224.150:3010": {"y": 0.0, "x": 1478352637090, "secondary": 0.0},
	// 		"172.16.224.150:3020": {"y": 0.0, "x": 1478352637072, "secondary": 0.0},
	// 		"172.16.224.150:3000": {"y": 0.0, "x": 1478352637098, "secondary": 0.0}
	// 	},
	// 	"query_tps": {
	// 		"172.16.224.150:3030": {"y": 0.0, "x": 1478352637081, "secondary": 0.0},
	// 		"172.16.224.150:3010": {"y": 0.0, "x": 1478352637090, "secondary": 0.0},
	// 		"172.16.224.150:3020": {"y": 0.0, "x": 1478352637072, "secondary": 0.0},
	// 		"172.16.224.150:3000": {"y": 0.0, "x": 1478352637098, "secondary": 0.0}
	// 	},
	// 	"xdr_write_tps": {
	// 		"172.16.224.150:3030": {"y": 0.0, "x": 1478352637081, "secondary": 0.0},
	// 		"172.16.224.150:3010": {"y": 0.0, "x": 1478352637090, "secondary": 0.0},
	// 		"172.16.224.150:3020": {"y": 0.0, "x": 1478352637072, "secondary": 0.0},
	// 		"172.16.224.150:3000": {"y": 0.0, "x": 1478352637098, "secondary": 0.0}
	// 	},
	// 	"write_tps": {
	// 		"172.16.224.150:3030": {"y": 0.0, "x": 1478352637081, "secondary": 0.0},
	// 		"172.16.224.150:3010": {"y": 0.0, "x": 1478352637090, "secondary": 0.0},
	// 		"172.16.224.150:3020": {"y": 0.0, "x": 1478352637072, "secondary": 0.0},
	// 		"172.16.224.150:3000": {"y": 0.0, "x": 1478352637098, "secondary": 0.0}
	// 	}
	// }`))
}

func getClusterNodes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}
	nodeList := strings.Split(c.Param("nodes"), ",")

	statKeys := []string{"system_free_mem_pct",
		"nsup-threads",
		"cluster_integrity",
		"storage_defrag_records",
		"scan-priority",
		"client_connections",
		"migrate_progress_recv",
		"replication-fire-and-forget",
		"storage-benchmarks",
		"stat_write_errs",
		"node_status",
		"objects",
		"tombstones",
		"proto-fd-max",
		"system_swapping",
		"err_write_fail_prole_unknown",
		"queue",
		"uptime",
		"err_out_of_space",
		"tsvc_queue",
		"migrate_progress_send",
		"client-fd-max",
		"migrate_incoming_remaining",
		"free-pct-memory",
		"cluster_name",
		"migrate_outgoing_remaining",
		"cluster_visibility",
		"build",
		"cluster_size",
		"stat_duplicate_operation",
		"free-pct-disk",
		"batch_errors",
		"same_cluster",
	}

	res := make(map[string]interface{}, len(nodeList))
	for _, node := range cluster.Nodes() {
		for _, nodeName := range nodeList {
			if node.Address() == nodeName {
				stats := node.AnyAttrs(statKeys...)
				stats["cluster_visibility"] = (node.VisibilityStatus())
				stats["same_cluster"] = true
				stats["memory"] = node.Memory()
				stats["disk"] = node.Disk()
				stats["node_status"] = node.Status()
				for _, key := range statKeys {
					if _, exists := stats[key]; !exists {
						stats[key] = common.NOT_AVAILABLE
					}
				}
				res[nodeName] = stats
			}
		}
	}

	return c.JSON(http.StatusOK, res)

	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"172.16.224.150:3030": {
	// 		"system_free_mem_pct": "34",
	// 		"nsup-threads": "n/s",
	// 		"cluster_integrity": "true",
	// 		"storage_defrag_records": "n/s",
	// 		"scan-priority": "n/s",
	// 		"client_connections": "10",
	// 		"migrate_progress_recv": "0",
	// 		"replication-fire-and-forget": "n/s",
	// 		"storage-benchmarks": "n/s",
	// 		"stat_write_errs": "n/s",
	// 		"node_status": "on",
	// 		"objects": "15631",
	// 		"tombstones": "0",
	// 		"proto-fd-max": "10000",
	// 		"system_swapping": "false",
	// 		"err_write_fail_prole_unknown": "n/s",
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"free-bytes-disk": 1073741824,
	// 			"total-bytes-disk": 1073741824
	// 		},
	// 		"queue": "0",
	// 		"uptime": "508426",
	// 		"err_out_of_space": "n/s",
	// 		"tsvc_queue": "0",
	// 		"migrate_progress_send": "0",
	// 		"client-fd-max": "n/s",
	// 		"migrate_incoming_remaining": 0,
	// 		"free-pct-memory": "n/s",
	// 		"cluster_name": "N/A",
	// 		"migrate_outgoing_remaining": 0,
	// 		"cluster_visibility": true,
	// 		"build": "3.10.0.3",
	// 		"cluster_size": "4",
	// 		"memory": {
	// 			"free-bytes-memory": 2143711433,
	// 			"total-bytes-memory": 2147483648,
	// 			"used-bytes-memory": 3772215
	// 		},
	// 		"stat_duplicate_operation": "n/s",
	// 		"free-pct-disk": "n/s",
	// 		"batch_errors": "n/s",
	// 		"same_cluster": "True"
	// 	},
	// 	"172.16.224.150:3010": {
	// 		"system_free_mem_pct": "34",
	// 		"nsup-threads": "n/s",
	// 		"cluster_integrity": "true",
	// 		"storage_defrag_records": "n/s",
	// 		"scan-priority": "n/s",
	// 		"client_connections": "10",
	// 		"migrate_progress_recv": "0",
	// 		"replication-fire-and-forget": "n/s",
	// 		"storage-benchmarks": "n/s",
	// 		"stat_write_errs": "n/s",
	// 		"node_status": "on",
	// 		"objects": "15624",
	// 		"tombstones": "0",
	// 		"proto-fd-max": "10000",
	// 		"system_swapping": "false",
	// 		"err_write_fail_prole_unknown": "n/s",
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"free-bytes-disk": 1073741824,
	// 			"total-bytes-disk": 1073741824
	// 		},
	// 		"queue": "0",
	// 		"uptime": "508426",
	// 		"err_out_of_space": "n/s",
	// 		"tsvc_queue": "0",
	// 		"migrate_progress_send": "0",
	// 		"client-fd-max": "n/s",
	// 		"migrate_incoming_remaining": 0,
	// 		"free-pct-memory": "n/s",
	// 		"cluster_name": "N/A",
	// 		"migrate_outgoing_remaining": 0,
	// 		"cluster_visibility": true,
	// 		"build": "3.10.0.3",
	// 		"cluster_size": "4",
	// 		"memory": {
	// 			"free-bytes-memory": 2143730067,
	// 			"total-bytes-memory": 2147483648,
	// 			"used-bytes-memory": 3753581
	// 		},
	// 		"stat_duplicate_operation": "n/s",
	// 		"free-pct-disk": "n/s",
	// 		"batch_errors": "n/s",
	// 		"same_cluster": "True"
	// 	},
	// 	"172.16.224.150:3020": {
	// 		"system_free_mem_pct": "34",
	// 		"nsup-threads": "n/s",
	// 		"cluster_integrity": "true",
	// 		"storage_defrag_records": "n/s",
	// 		"scan-priority": "n/s",
	// 		"client_connections": "10",
	// 		"migrate_progress_recv": "0",
	// 		"replication-fire-and-forget": "n/s",
	// 		"storage-benchmarks": "n/s",
	// 		"stat_write_errs": "n/s",
	// 		"node_status": "on",
	// 		"objects": "15345",
	// 		"tombstones": "0",
	// 		"proto-fd-max": "10000",
	// 		"system_swapping": "false",
	// 		"err_write_fail_prole_unknown": "n/s",
	// 		"disk": {"used-bytes-disk": 0,
	// 		"free-bytes-disk": 1073741824,
	// 		"total-bytes-disk": 1073741824},
	// 		"queue": "0",
	// 		"uptime": "508426",
	// 		"err_out_of_space": "n/s",
	// 		"tsvc_queue": "0",
	// 		"migrate_progress_send": "0",
	// 		"client-fd-max": "n/s",
	// 		"migrate_incoming_remaining": 0,
	// 		"free-pct-memory": "n/s",
	// 		"cluster_name": "N/A",
	// 		"migrate_outgoing_remaining": 0,
	// 		"cluster_visibility": true,
	// 		"build": "3.10.0.3",
	// 		"cluster_size": "4",
	// 		"memory": {
	// 			"free-bytes-memory": 2143791714,
	// 			"total-bytes-memory": 2147483648,
	// 			"used-bytes-memory": 3691934
	// 		},
	// 		"stat_duplicate_operation": "n/s",
	// 		"free-pct-disk": "n/s",
	// 		"batch_errors": "n/s",
	// 		"same_cluster": "True"
	// 	},
	// 	"172.16.224.150:3000": {
	// 		"system_free_mem_pct": "34",
	// 		"nsup-threads": "n/s",
	// 		"cluster_integrity": "true",
	// 		"storage_defrag_records": "n/s",
	// 		"scan-priority": "n/s",
	// 		"client_connections": "10",
	// 		"migrate_progress_recv": "0",
	// 		"replication-fire-and-forget": "n/s",
	// 		"storage-benchmarks": "n/s",
	// 		"stat_write_errs": "n/s",
	// 		"node_status": "on",
	// 		"objects": "15686",
	// 		"tombstones": "0",
	// 		"proto-fd-max": "10000",
	// 		"system_swapping": "false",
	// 		"err_write_fail_prole_unknown": "n/s",
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"free-bytes-disk": 1073741824,
	// 			"total-bytes-disk": 1073741824
	// 		},
	// 		"queue": "0",
	// 		"uptime": "508427",
	// 		"err_out_of_space": "n/s",
	// 		"tsvc_queue": "0",
	// 		"migrate_progress_send": "0",
	// 		"client-fd-max": "n/s",
	// 		"migrate_incoming_remaining": 0,
	// 		"free-pct-memory": "n/s",
	// 		"cluster_name": "N/A",
	// 		"migrate_outgoing_remaining": 0,
	// 		"cluster_visibility": true,
	// 		"build": "3.10.0.3",
	// 		"cluster_size": "4",
	// 		"memory": {
	// 			"free-bytes-memory": 2143692839,
	// 			"total-bytes-memory": 2147483648,
	// 			"used-bytes-memory": 3790809
	// 		},
	// 		"stat_duplicate_operation": "n/s",
	// 		"free-pct-disk": "n/s",
	// 		"batch_errors": "n/s",
	// 		"same_cluster": "True"
	// 	}
	// }`))
}

func getClusterNamespaces(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	namespaces := strings.Split(c.Param("namespaces"), ",")
	res := cluster.NamespaceInfo(namespaces)
	return c.JSON(http.StatusOK, res)

	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"test": {
	// 		"evicted-objects": 0,
	// 		"repl-factor": 2,
	// 		"prole_tombstones": 0,
	// 		"prole-objects-tombstones": "31143, 0",
	// 		"master-objects-tombstones": "31143, 0",
	// 		"least_available_pct": {
	// 			"node": null,
	// 			"value": null
	// 		},
	// 		"prole-objects": 31143,
	// 		"expired-objects": 0,
	// 		"master-objects": 31143,
	// 		"cluster_status": "on",
	// 		"memory": {
	// 			"used-bytes-memory": 15008539,
	// 			"total-bytes-memory": 4294967296
	// 		},
	// 		"master_tombstones": 0,
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"total-bytes-disk": 0
	// 		}
	// 	},
	// 	"bar": {
	// 		"evicted-objects": 0,
	// 		"repl-factor": 2,
	// 		"prole_tombstones": 0,
	// 		"prole-objects-tombstones": "0, 0",
	// 		"master-objects-tombstones": "0, 0",
	// 		"least_available_pct": {
	// 			"node": "172.16.224.150:3020",
	// 			"value": 99
	// 		},
	// 		"prole-objects": 0,
	// 		"expired-objects": 0,
	// 		"master-objects": 0,
	// 		"cluster_status": "on",
	// 		"memory": {
	// 			"used-bytes-memory": 0,
	// 			"total-bytes-memory": 4294967296
	// 		},
	// 		"master_tombstones": 0,
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"total-bytes-disk": 4294967296
	// 		}
	// 	}
	// }`))
}

func getClusterNamespaceNodes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	namespace := c.Param("namespace")
	nodes := strings.Split(c.Param("nodes"), ",")
	res := cluster.NamespaceInfoPerNode(namespace, nodes)
	return c.JSON(http.StatusOK, res)

	// fmt.Println(clusterUuid, nodes)
	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"172.16.224.150:3030": {
	// 		"evicted-objects": "0",
	// 		"repl-factor": "2",
	// 		"master-objects": "0",
	// 		"hwm-breached": "false",
	// 		"stop-writes-pct": "90",
	// 		"enable-xdr": "false",
	// 		"memory-pct": {
	// 			"high-water-memory-pct": "60",
	// 			"free-pct-memory": "100"
	// 		},
	// 		"data-in-memory": false,
	// 		"free-pct-memory": "100",
	// 		"prole-objects-tombstones": "0, 0",
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"free-bytes-disk": 1073741824,
	// 			"total-bytes-disk": 1073741824
	// 		},
	// 		"prole_tombstones": "0",
	// 		"master_tombstones": "0",
	// 		"name": "bar",
	// 		"master-objects-tombstones": "0, 0",
	// 		"least_available_pct": 99,
	// 		"available_pct": "99",
	// 		"memory-size": "1073741824",
	// 		"max-void-time": null,
	// 		"node_status": "on",
	// 		"expired-objects": "0",
	// 		"max-ttl": "315360000",
	// 		"disk-pct": {
	// 			"high-water-disk-pct": "50",
	// 			"free-pct-disk": "100"
	// 		},
	// 		"memory": {
	// 			"free-bytes-memory": 1073741824,
	// 			"total-bytes-memory": 1073741824,
	// 			"used-bytes-memory": 0
	// 		},
	// 		"stop-writes": "false",
	// 		"single-bin": "false",
	// 		"type": "device",
	// 		"prole-objects": "0",
	// 		"default-ttl": "2592000"
	// 	},
	// 	"172.16.224.150:3010": {
	// 		"evicted-objects": "0",
	// 		"repl-factor": "2",
	// 		"master-objects": "0",
	// 		"hwm-breached": "false",
	// 		"stop-writes-pct": "90",
	// 		"enable-xdr": "false",
	// 		"memory-pct": {
	// 			"high-water-memory-pct": "60",
	// 			"free-pct-memory": "100"
	// 		},
	// 		"data-in-memory": false,
	// 		"free-pct-memory": "100",
	// 		"prole-objects-tombstones": "0, 0",
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"free-bytes-disk": 1073741824,
	// 			"total-bytes-disk": 1073741824
	// 		},
	// 		"prole_tombstones": "0",
	// 		"master_tombstones": "0",
	// 		"name": "bar",
	// 		"master-objects-tombstones": "0, 0",
	// 		"least_available_pct": 99,
	// 		"available_pct": "99",
	// 		"memory-size": "1073741824",
	// 		"max-void-time": null,
	// 		"node_status": "on",
	// 		"expired-objects": "0",
	// 		"max-ttl": "315360000",
	// 		"disk-pct": {
	// 			"high-water-disk-pct": "50",
	// 		"free-pct-disk": "100"},
	// 		"memory": {
	// 			"free-bytes-memory": 1073741824,
	// 			"total-bytes-memory": 1073741824,
	// 			"used-bytes-memory": 0
	// 		},
	// 		"stop-writes": "false",
	// 		"single-bin": "false",
	// 		"type": "device",
	// 		"prole-objects": "0",
	// 		"default-ttl": "2592000"},
	// 	"172.16.224.150:3020": {
	// 		"evicted-objects": "0",
	// 		"repl-factor": "2",
	// 		"master-objects": "0",
	// 		"hwm-breached": "false",
	// 		"stop-writes-pct": "90",
	// 		"enable-xdr": "false",
	// 		"memory-pct": {
	// 			"high-water-memory-pct": "60",
	// 			"free-pct-memory": "100"
	// 		},
	// 		"data-in-memory": false,
	// 		"free-pct-memory": "100",
	// 		"prole-objects-tombstones": "0, 0",
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"free-bytes-disk": 1073741824,
	// 			"total-bytes-disk": 1073741824
	// 		},
	// 		"prole_tombstones": "0",
	// 		"master_tombstones": "0",
	// 		"name": "bar",
	// 		"master-objects-tombstones": "0, 0",
	// 		"least_available_pct": 99,
	// 		"available_pct": "99",
	// 		"memory-size": "1073741824",
	// 		"max-void-time": null,
	// 		"node_status": "on",
	// 		"expired-objects": "0",
	// 		"max-ttl": "315360000",
	// 		"disk-pct": {
	// 			"high-water-disk-pct": "50",
	// 			"free-pct-disk": "100"
	// 		},
	// 		"memory": {
	// 			"free-bytes-memory": 1073741824,
	// 			"total-bytes-memory": 1073741824,
	// 			"used-bytes-memory": 0
	// 		},
	// 		"stop-writes": "false",
	// 		"single-bin": "false",
	// 		"type": "device",
	// 		"prole-objects": "0",
	// 		"default-ttl": "2592000"
	// 	},
	// 	"172.16.224.150:3000": {
	// 		"evicted-objects": "0",
	// 		"repl-factor": "2",
	// 		"master-objects": "0",
	// 		"hwm-breached": "false",
	// 		"stop-writes-pct": "90",
	// 		"enable-xdr": "false",
	// 		"memory-pct": {
	// 			"high-water-memory-pct": "60",
	// 			"free-pct-memory": "100"
	// 		},
	// 		"data-in-memory": false,
	// 		"free-pct-memory": "100",
	// 		"prole-objects-tombstones": "0, 0",
	// 		"disk": {
	// 			"used-bytes-disk": 0,
	// 			"free-bytes-disk": 1073741824,
	// 			"total-bytes-disk": 1073741824
	// 		},
	// 		"prole_tombstones": "0",
	// 		"master_tombstones": "0",
	// 		"name": "bar",
	// 		"master-objects-tombstones": "0, 0",
	// 		"least_available_pct": 99,
	// 		"available_pct": "99",
	// 		"memory-size": "1073741824",
	// 		"max-void-time": null,
	// 		"node_status": "on",
	// 		"expired-objects": "0",
	// 		"max-ttl": "315360000",
	// 		"disk-pct": {
	// 			"high-water-disk-pct": "50",
	// 			"free-pct-disk": "100"
	// 		},
	// 		"memory": {
	// 			"free-bytes-memory": 1073741824,
	// 			"total-bytes-memory": 1073741824,
	// 			"used-bytes-memory": 0
	// 		},
	// 		"stop-writes": "false",
	// 		"single-bin": "false",
	// 		"type": "device",
	// 		"prole-objects": "0",
	// 		"default-ttl": "2592000"
	// 	}
	// }`))
}

func getClusterXdrNodes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	keys := []string{
		"stat_recs_outstanding", "timediff_lastship_cur_secs", "xdr_timelag",
		"esmt_bytes_shipped", "stat_recs_relogged",
		"stat_recs_shipped", "free_dlog_pct", "xdr_uptime",
		"cur_throughput", "esmt-bytes-shipped", "free-dlog-pct",
		"xdr-uptime",
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

	// return c.JSONBlob(http.StatusOK, []byte(`{
	// 	"172.16.224.150:3030": {
	// 		"xdr_status": "off",
	// 		"node_status": "on"
	// 	},
	// 	"172.16.224.150:3010": {
	// 		"xdr_status": "off",
	// 		"node_status": "on"
	// 	},
	// 	"172.16.224.150:3020": {
	// 		"xdr_status": "off",
	// 		"node_status": "on"
	// 	},
	// 	"172.16.224.150:3000": {
	// 		"xdr_status": "off",
	// 		"node_status": "on"
	// 	}
	// }`))
}

func getClusterAlrets(c echo.Context) error {
	// clusterUuid := c.Param("clusterUuid")
	// lastId := c.QueryParam("last_id")
	// fmt.Println(clusterUuid, lastId)
	return c.JSONBlob(http.StatusOK, []byte(`[]`))
}

func getClusterNodeAllStats(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	nodeAddress := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddress)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	res := node.StatsAttrs()
	for k, v := range node.ConfigAttrs() {
		res[k] = v
	}
	res["node_status"] = node.Status()

	return c.JSON(http.StatusOK, res)
}

func getClusterNamespaceNodeAllStats(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	nodeAddress := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddress)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	nsName := c.Param("namespace")
	ns := node.NamespaceByName(nsName)
	if ns == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	res := ns.StatsAttrs()
	res["node_status"] = node.Status()

	return c.JSON(http.StatusOK, res)
}

func getClusterNamespaceSindexNodeAllStats(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	nodeAddress := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddress)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	nsName := c.Param("namespace")
	ns := node.NamespaceByName(nsName)
	if ns == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	sindexName := c.Param("sindex")
	res := ns.IndexStats(sindexName)
	res["node_status"] = node.Status()

	return c.JSON(http.StatusOK, res)
}

func getClusterXdrNodeAllStats(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
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

func getClusterNamespaceSindexes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	nsName := c.Param("namespace")
	indexes := cluster.NamespaceIndexInfo(nsName)
	indexInfo := make([]common.Stats, 0, len(indexes))
	for _, v := range indexes {
		indexInfo = append(indexInfo, v.ToStats())
	}

	res := map[string]interface{}{
		"cluster_status": "on",
		"indexes":        indexes,
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterNamespaceSets(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	nsName := c.Param("namespace")
	sets := cluster.NamespaceSetsInfo(nsName)

	res := map[string]interface{}{
		"cluster_status": "on",
		"sets":           sets,
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterJobsNode(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	nodeAddr := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddr)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	jobStats := node.Jobs()
	jobs := make([]common.Stats, 0, len(jobStats))
	for _, v := range jobStats {
		v["address"] = node.Address()
		jobs = append(jobs, v)
	}

	res := map[string]interface{}{
		"node_status": "on",
		"build":       node.Build(),
		"memory":      node.Memory(),
		"jobs":        jobs,
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterUserRoles(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	res := map[string]interface{}{
		"rolelist": cluster.CurrentUserRoles(),
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterNodeAllConfig(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
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
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
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
		return c.JSON(http.StatusNotFound, errorMap("No Parameters found"))
	}
	config := make(map[string]string, len(formParams))
	for k, v := range formParams {
		config[k] = ""
		if len(v) > 0 {
			config[k] = v[0]
		}
	}

	wg := sync.WaitGroup{}
	wg.Add(len(nodes))
	resChan := make(chan *common.NodeResult, len(nodes))

	for _, node := range nodes {
		go node.SetServerConfig("service", config, &wg, resChan)
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

func postSwitchXDR(c echo.Context, on bool) error {
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

func getClusterNamespaceAllConfig(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
	}

	nodeAddr := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddr)
	// log.Info("((((((((((((((((((((((((((((((((((((((((((((((((1", nodeAddr, node)
	if node == nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"node":        nodeAddr,
			"node_status": "off",
		})
	}

	ns := node.NamespaceByName(c.Param("namespace"))
	// log.Info("((((((((((((((((((((((((((((((((((((((((((((((((2", ns)
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

// func setClusterNamespaceConfig(c echo.Context) error {
// 	clusterUuid := c.Param("clusterUuid")
// 	cluster := _observer.FindClusterById(clusterUuid)
// 	if cluster == nil {
// 		return c.JSON(http.StatusNotFound, errorMap("Cluster not found"))
// 	}

// 	nodeAddrs := strings.Split(c.Param("nodes"), ",")
// 	res := make(common.Stats, len(nodeAddrs))
// 	for _, addr := range nodeAddrs {
// 		res[addr] = map[string]interface{}{"node_status": "off"}
// 	}

// 	nodes := cluster.FindNodesByAddress(nodeAddrs...)
// 	if len(nodes) == 0 {
// 		return c.JSON(http.StatusOK, res)
// 	}

// 	config := make(map[string]string, len(c.FormParams()))
// 	for k, v := range c.FormParams() {
// 		config[k] = ""
// 		if len(v) > 0 {
// 			config[k] = v[0]
// 		}
// 	}

// 	wg := sync.WaitGroup{}
// 	wg.Add(len(nodes))
// 	resChan := make(chan *common.NodeResult, len(nodes))

// 	for _, node := range nodes {
// 		go node.SetServerConfig("service", config, &wg, resChan)
// 	}

// 	wg.Wait()
// 	close(resChan)

// 	for nr := range resChan {
// 		if nr.Err != nil {
// 			res[nr.Name] = map[string]interface{}{"node_status": "off"}
// 		} else {
// 			res[nr.Name] = map[string]interface{}{
// 				"node_status":      "on",
// 				"unset_parameters": []string{},
// 			}
// 		}
// 	}

// 	return c.JSON(http.StatusOK, res)
// }
