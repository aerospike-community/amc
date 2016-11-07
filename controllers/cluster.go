package controllers

import (
	// "fmt"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	// . "github.com/ahmetalpbalkan/go-linq"
	log "github.com/Sirupsen/logrus"
	ast "github.com/aerospike/aerospike-client-go/types"
	"github.com/labstack/echo"

	"github.com/aerospike/aerospike-console/common"
)

//----------
// Handlers
//----------

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
		return errors.New("No seed name specified.")
	}

	// cookie = new(echo.Cookie)
	// cookie.SetName("panelState")
	// cookie.SetValue(`dashboard%3B3%2C0%3B%7Cadmin-console%3B%7Clatency%3B; shownAlerts=5%3Af68304f0-14f3-4ead-b13e-74ec7340e490%3B4%3Af68304f0-14f3-4ead-b13e-74ec7340e490%3B3%3Af68304f0-14f3-4ead-b13e-74ec7340e490%3B2%3Af68304f0-14f3-4ead-b13e-74ec7340e490%3B1%3Af68304f0-14f3-4ead-b13e-74ec7340e490%3B2%3Aa552508e-4e8f-40c4-bdcd-45d020a18080%3B1%3Aa552508e-4e8f-40c4-bdcd-45d020a18080%3B1%3Ac5da26f4-8cd6-4bf6-bbf9-181eb562fbed%3B2%3A17c629d3-f096-4f0c-a0cd-b134e724c6c9%3B1%3A17c629d3-f096-4f0c-a0cd-b134e724c6c9%3B3%3Aa76dc6a4-7c9f-4499-bf6a-c40dff4cec0b%3B2%3Aa76dc6a4-7c9f-4499-bf6a-c40dff4cec0b%3B1%3Aa76dc6a4-7c9f-4499-bf6a-c40dff4cec0b%3B3%3Af92fc7bf-d92c-4216-ad8a-00316fe3b0ad%3B2%3Af92fc7bf-d92c-4216-ad8a-00316fe3b0ad%3B1%3Af92fc7bf-d92c-4216-ad8a-00316fe3b0ad%3B3%3A2e419c02-ec5c-4bb6-9c19-9fada35769a2%3B2%3A2e419c02-ec5c-4bb6-9c19-9fada35769a2%3B1%3A2e419c02-ec5c-4bb6-9c19-9fada35769a2%3B2%3Af82f25b7-cca7-438e-b16e-b8446fb19699%3B1%3Af82f25b7-cca7-438e-b16e-b8446fb19699%3B14%3A4032fa69-7310-4816-b5b5-2c8ca5aeb99a%3B13%3A4032fa69-7310-4816-b5b5-2c8ca5aeb99a%3B12%3A4032fa69-7310-4816-b5b5-2c8ca5aeb99a%3B11%3A4032fa69-7310-4816-b5b5-2c8ca5aeb99a%3B7%3A7ca0ba2e-697b-41fc-ba72-d2248ec70362%3B6%3A7ca0ba2e-697b-41fc-ba72-d2248ec70362%3B5%3A7ca0ba2e-697b-41fc-ba72-d2248ec70362%3B4%3A7ca0ba2e-697b-41fc-ba72-d2248ec70362%3B3%3A7ca0ba2e-697b-41fc-ba72-d2248ec70362%3B2%3A7ca0ba2e-697b-41fc-ba72-d2248ec70362%3B1%3A7ca0ba2e-697b-41fc-ba72-d2248ec70362%3B8%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B7%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B6%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B5%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B4%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B3%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B2%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B1%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B9%3Accd16e0f-3298-4392-9e3b-3cf274f293b0%3B40%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B39%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B38%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B35%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B34%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B33%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B32%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B31%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B29%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B28%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B27%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B26%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B25%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B24%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B23%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B22%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B21%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B20%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B19%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B18%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B17%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B16%3Ac9e5d740-ebc8-4391-8721-563d23ddbd17%3B1%3Aa00b5a61-6e1a-4516-9f91-ba8c6a2324eb%3B16%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B15%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B14%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B13%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B12%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B11%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B10%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B9%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B8%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B7%3A9dcc9755-7dbb-46ed-91de-7f313c31bdac%3B`)
	// cookie.SetExpires(time.Now().Add(24 * time.Hour))
	// c.SetCookie(cookie)

	host, port, err := common.SplitHostPort(form.SeedNode)
	if err != nil {
		return err
	}

	clientPolicy := *_defaultClientPolicy
	clientPolicy.User = form.Username
	clientPolicy.Password = form.Password
	cluster, err := _observer.Register(&clientPolicy, host, uint16(port))
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
		return err
	}

	cookie := new(echo.Cookie)
	cookie.SetName("session")
	cookie.SetValue("729552f96ace14ea_581cb181.aEaZDV2xzuMHc63ouE4Wq5pBY-g")
	cookie.SetExpires(time.Now().Add(24 * time.Hour))
	c.SetCookie(cookie)

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

func getCurrentMonitoringClusters(c echo.Context) error {
	return c.JSON(http.StatusOK, _observer.MonitoringClusters())

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
	// port := c.Param("port")
	// fmt.Println(port)
	return c.JSONBlob(http.StatusOK, []byte(`{
		"status": "success",
		"data": {
			"e84f8ba2-9123-4f4d-86fc-d618b28ff228": {
				"dc_name": [],
				"read_tps": {
					"total": 0,
					"success": 0
				},
				"seednode": "172.16.224.150:3000",
				"xdr_info": {},
				"cluster_name": null,
				"namespaces": ["test", "bar"],
				"nodes": {
					"BCDEB6C71290C00": {
						"status": "on",
						"access_ip": "172.16.224.150",
						"cur_throughput": null,
						"ip": "172.16.224.150",
						"access_port": "3020",
						"xdr_uptime": null,
						"port": "3020",
						"lag": null
					},
					"BD7EB6C71290C00": {
						"status": "on",
						"access_ip": "172.16.224.150",
						"cur_throughput": null,
						"ip": "172.16.224.150",
						"access_port": "3030",
						"xdr_uptime": null,
						"port": "3030",
						"lag": null
					},
					"BC3EB6C71290C00": {
						"status": "on",
						"access_ip": "172.16.224.150",
						"cur_throughput": null,
						"ip": "172.16.224.150",
						"access_port": "3010",
						"xdr_uptime": null,
						"port": "3010",
						"lag": null
					},
					"BB9EB6C71290C00": {
						"status": "on",
						"access_ip": "172.16.224.150",
						"cur_throughput": null,
						"ip": "172.16.224.150",
						"access_port": "3000",
						"xdr_uptime": null,
						"port": "3000",
						"lag": null
					}
				},
				"write_tps": {
					"total": 0,
					"success": 0
				},
				"discovery": "complete"
			}
		}
	}`))
}

func getCluster(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return errors.New("Cluster not found")
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
		return errors.New("Cluster not found")
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

func getClusterThroughputHistory(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"status": "failure", "error": "Cluster not found"})
	}

	since := time.Now().Unix() - 34
	beginStr := c.Param("start_time")
	if beginStr != "" {
		sinceUnix, err := strconv.ParseInt(beginStr, 64, 10)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"status": "failure", "error": "Invalid start_time value"})
		}
		since = sinceUnix
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
				statList = append(statList, chartStat{X: yValues.TimestampJson(), Y: yValues.Value(), Secondary: secondaryVals[node][i].Value()})
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
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
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
			statRes[node] = chartStat{X: yValues.TimestampJson(), Y: yValues.Value(), Secondary: secondaryVals[node].Value()}
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
	// clusterUuid := c.Param("clusterUuid")
	// nodes := c.Param("nodes")
	// fmt.Println(clusterUuid, nodes)
	return c.JSONBlob(http.StatusOK, []byte(`{
		"172.16.224.150:3030": {
			"system_free_mem_pct": "34",
			"nsup-threads": "n/s",
			"cluster_integrity": "true",
			"storage_defrag_records": "n/s",
			"scan-priority": "n/s",
			"client_connections": "10",
			"migrate_progress_recv": "0",
			"replication-fire-and-forget": "n/s",
			"storage-benchmarks": "n/s",
			"stat_write_errs": "n/s",
			"node_status": "on",
			"objects": "15631",
			"tombstones": "0",
			"proto-fd-max": "10000",
			"system_swapping": "false",
			"err_write_fail_prole_unknown": "n/s",
			"disk": {
				"used-bytes-disk": 0,
				"free-bytes-disk": 1073741824,
				"total-bytes-disk": 1073741824
			},
			"queue": "0",
			"uptime": "508426",
			"err_out_of_space": "n/s",
			"tsvc_queue": "0",
			"migrate_progress_send": "0",
			"client-fd-max": "n/s",
			"migrate_incoming_remaining": 0,
			"free-pct-memory": "n/s",
			"cluster_name": "N/A",
			"migrate_outgoing_remaining": 0,
			"cluster_visibility": true,
			"build": "3.10.0.3",
			"cluster_size": "4",
			"memory": {
				"free-bytes-memory": 2143711433,
				"total-bytes-memory": 2147483648,
				"used-bytes-memory": 3772215
			},
			"stat_duplicate_operation": "n/s",
			"free-pct-disk": "n/s",
			"batch_errors": "n/s",
			"same_cluster": "True"
		},
		"172.16.224.150:3010": {
			"system_free_mem_pct": "34",
			"nsup-threads": "n/s",
			"cluster_integrity": "true",
			"storage_defrag_records": "n/s",
			"scan-priority": "n/s",
			"client_connections": "10",
			"migrate_progress_recv": "0",
			"replication-fire-and-forget": "n/s",
			"storage-benchmarks": "n/s",
			"stat_write_errs": "n/s",
			"node_status": "on",
			"objects": "15624",
			"tombstones": "0",
			"proto-fd-max": "10000",
			"system_swapping": "false",
			"err_write_fail_prole_unknown": "n/s",
			"disk": {
				"used-bytes-disk": 0,
				"free-bytes-disk": 1073741824,
				"total-bytes-disk": 1073741824
			},
			"queue": "0",
			"uptime": "508426",
			"err_out_of_space": "n/s",
			"tsvc_queue": "0",
			"migrate_progress_send": "0",
			"client-fd-max": "n/s",
			"migrate_incoming_remaining": 0,
			"free-pct-memory": "n/s",
			"cluster_name": "N/A",
			"migrate_outgoing_remaining": 0,
			"cluster_visibility": true,
			"build": "3.10.0.3",
			"cluster_size": "4",
			"memory": {
				"free-bytes-memory": 2143730067,
				"total-bytes-memory": 2147483648,
				"used-bytes-memory": 3753581
			},
			"stat_duplicate_operation": "n/s",
			"free-pct-disk": "n/s",
			"batch_errors": "n/s",
			"same_cluster": "True"
		},
		"172.16.224.150:3020": {
			"system_free_mem_pct": "34",
			"nsup-threads": "n/s",
			"cluster_integrity": "true",
			"storage_defrag_records": "n/s",
			"scan-priority": "n/s",
			"client_connections": "10",
			"migrate_progress_recv": "0",
			"replication-fire-and-forget": "n/s",
			"storage-benchmarks": "n/s",
			"stat_write_errs": "n/s",
			"node_status": "on",
			"objects": "15345",
			"tombstones": "0",
			"proto-fd-max": "10000",
			"system_swapping": "false",
			"err_write_fail_prole_unknown": "n/s",
			"disk": {"used-bytes-disk": 0,
			"free-bytes-disk": 1073741824,
			"total-bytes-disk": 1073741824},
			"queue": "0",
			"uptime": "508426",
			"err_out_of_space": "n/s",
			"tsvc_queue": "0",
			"migrate_progress_send": "0",
			"client-fd-max": "n/s",
			"migrate_incoming_remaining": 0,
			"free-pct-memory": "n/s",
			"cluster_name": "N/A",
			"migrate_outgoing_remaining": 0,
			"cluster_visibility": true,
			"build": "3.10.0.3",
			"cluster_size": "4",
			"memory": {
				"free-bytes-memory": 2143791714,
				"total-bytes-memory": 2147483648,
				"used-bytes-memory": 3691934
			},
			"stat_duplicate_operation": "n/s",
			"free-pct-disk": "n/s",
			"batch_errors": "n/s",
			"same_cluster": "True"
		},
		"172.16.224.150:3000": {
			"system_free_mem_pct": "34",
			"nsup-threads": "n/s",
			"cluster_integrity": "true",
			"storage_defrag_records": "n/s",
			"scan-priority": "n/s",
			"client_connections": "10",
			"migrate_progress_recv": "0",
			"replication-fire-and-forget": "n/s",
			"storage-benchmarks": "n/s",
			"stat_write_errs": "n/s",
			"node_status": "on",
			"objects": "15686",
			"tombstones": "0",
			"proto-fd-max": "10000",
			"system_swapping": "false",
			"err_write_fail_prole_unknown": "n/s",
			"disk": {
				"used-bytes-disk": 0,
				"free-bytes-disk": 1073741824,
				"total-bytes-disk": 1073741824
			},
			"queue": "0",
			"uptime": "508427",
			"err_out_of_space": "n/s",
			"tsvc_queue": "0",
			"migrate_progress_send": "0",
			"client-fd-max": "n/s",
			"migrate_incoming_remaining": 0,
			"free-pct-memory": "n/s",
			"cluster_name": "N/A",
			"migrate_outgoing_remaining": 0,
			"cluster_visibility": true,
			"build": "3.10.0.3",
			"cluster_size": "4",
			"memory": {
				"free-bytes-memory": 2143692839,
				"total-bytes-memory": 2147483648,
				"used-bytes-memory": 3790809
			},
			"stat_duplicate_operation": "n/s",
			"free-pct-disk": "n/s",
			"batch_errors": "n/s",
			"same_cluster": "True"
		}
	}`))
}

func getClusterNamespaces(c echo.Context) error {
	// clusterUuid := c.Param("clusterUuid")
	// namespaces := c.Param("namespaces")
	// nodes := c.QueryParam("nodes")
	// fmt.Println(clusterUuid, namespaces, nodes)
	return c.JSONBlob(http.StatusOK, []byte(`{
		"test": {
			"evicted-objects": 0,
			"repl-factor": 2,
			"prole_tombstones": 0,
			"prole-objects-tombstones": "31143, 0",
			"master-objects-tombstones": "31143, 0",
			"least_available_pct": {
				"node": null,
				"value": null
			},
			"prole-objects": 31143,
			"expired-objects": 0,
			"master-objects": 31143,
			"cluster_status": "on",
			"memory": {
				"used-bytes-memory": 15008539,
				"total-bytes-memory": 4294967296
			},
			"master_tombstones": 0,
			"disk": {
				"used-bytes-disk": 0,
				"total-bytes-disk": 0
			}
		},
		"bar": {
			"evicted-objects": 0,
			"repl-factor": 2,
			"prole_tombstones": 0,
			"prole-objects-tombstones": "0, 0",
			"master-objects-tombstones": "0, 0",
			"least_available_pct": {
				"node": "172.16.224.150:3020",
				"value": 99
			},
			"prole-objects": 0,
			"expired-objects": 0,
			"master-objects": 0,
			"cluster_status": "on",
			"memory": {
				"used-bytes-memory": 0,
				"total-bytes-memory": 4294967296
			},
			"master_tombstones": 0,
			"disk": {
				"used-bytes-disk": 0,
				"total-bytes-disk": 4294967296
			}
		}
	}`))
}

func getClusterNamespaceNodes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
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
	// clusterUuid := c.Param("clusterUuid")
	// nodes := c.QueryParam("nodes")
	// fmt.Println(clusterUuid, nodes)
	return c.JSONBlob(http.StatusOK, []byte(`{
		"172.16.224.150:3030": {
			"xdr_status": "off",
			"node_status": "on"
		},
		"172.16.224.150:3010": {
			"xdr_status": "off",
			"node_status": "on"
		},
		"172.16.224.150:3020": {
			"xdr_status": "off",
			"node_status": "on"
		},
		"172.16.224.150:3000": {
			"xdr_status": "off",
			"node_status": "on"
		}
	}`))
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
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
	}

	nodeAddress := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddress)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
		})
	}

	res := node.StatsAttrs()
	for k, v := range node.ConfigAttrs().ToStats() {
		res[k] = v
	}
	res["node_status"] = node.Status()

	return c.JSON(http.StatusOK, res)
}

func getClusterNamespaceNodeAllStats(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
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
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
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
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
	}

	nodeAddress := c.Param("node")
	node := cluster.FindNodeByAddress(nodeAddress)
	if node == nil {
		return c.JSON(http.StatusOK, map[string]interface{}{
			"node_status": "off",
			"xdr_status":  "off",
		})
	}

	res := map[string]interface{}{
		"node_status": "on",
		"xdr_status":  "off",
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterNamespaceSindexes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
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
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
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
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
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
		return c.JSON(http.StatusInternalServerError, map[string]string{"status": "failure", "error": "Cluster not found"})
	}

	res := map[string]interface{}{
		"rolelist": cluster.CurrentUserRoles(),
	}

	return c.JSON(http.StatusOK, res)
}
