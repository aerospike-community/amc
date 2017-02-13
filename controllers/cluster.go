package controllers

import (
	"crypto/tls"
	// "crypto/x509"
	"math"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	// . "github.com/ahmetalpbalkan/go-linq"
	log "github.com/Sirupsen/logrus"
	as "github.com/aerospike/aerospike-client-go"
	ast "github.com/aerospike/aerospike-client-go/types"
	"github.com/labstack/echo"

	"github.com/citrusleaf/amc/common"
)

//----------
// Handlers
//----------

func postGetClusterId(c echo.Context) error {
	form := struct {
		SeedNode     string `form:"seed_node"`
		TLSName      string `form:"tls_name"`
		CertFile     string `form:"cert_file"`
		KeyFile      string `form:"key_file"`
		Username     string `form:"username"`
		Password     string `form:"password"`
		ClusterAlias string `form:"cluster_name"`
		EncryptOnly  bool   `form:"encrypt_only"`
	}{}

	c.Bind(&form)
	if len(form.SeedNode) == 0 {
		return c.JSON(http.StatusOK, errorMap("No seed name specified."))
	}

	host, port, err := common.SplitHostPort(form.SeedNode)
	if err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// update the session cookie
	sid := manageSession(c)

	seedHost := as.NewHost(host, port)
	seedHost.TLSName = form.TLSName

	cluster := _observer.FindClusterBySeed(sid, seedHost, form.Username, form.Password)
	if cluster != nil {
		cluster.SetAlias(form.ClusterAlias)
		_observer.AppendCluster(sid, cluster)
	} else {
		clientPolicy := *_defaultClientPolicy
		clientPolicy.User = form.Username
		clientPolicy.Password = form.Password

		if len(form.TLSName) > 0 || form.EncryptOnly == true {
			// Setup TLS Config
			tlsConfig := &tls.Config{
				Certificates:             _observer.Config().ClientPool(),
				RootCAs:                  _observer.Config().ServerPool(),
				InsecureSkipVerify:       form.EncryptOnly,
				PreferServerCipherSuites: true,
			}
			tlsConfig.BuildNameToCertificate()

			clientPolicy.TlsConfig = tlsConfig
		}

		// hostAddrs := strings.Split(host, ",")
		// hosts := make([]*as.Host, 0, len(hostAddrs))

		// for _, addr := range hostAddrs {
		// 	resolved, err := resolveHost(addr)
		// 	if err != nil {
		// 		return nil, err
		// 	}

		// 	for _, ip := range resolved {
		// 		hosts = append(hosts, as.NewHost(ip, int(port)))
		// 	}
		// }

		cluster, err = _observer.Register(sid, &clientPolicy, &form.ClusterAlias, seedHost)
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
			return c.JSON(http.StatusOK, errorMap(err.Error()))
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
}

func postRemoveClusterFromSession(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("cluster not found"))
	}

	sid, _ := sessionId(c)
	if remainingClusterCount := _observer.RemoveCluster(sid, cluster); remainingClusterCount <= 0 {
		invalidateSession(c)
	}

	return c.JSON(http.StatusOK, common.Stats{
		"status": "success",
	})
}

func getCluster(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("cluster not found"))
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
}

func getClusterBasic(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("cluster not found"))
	}

	builds := cluster.NodeBuilds()
	var clusterBuild interface{}
	if len(builds) > 0 {
		clusterBuild = builds[0]
	}

	userRoles := cluster.Users()
	users := make([]string, 0, len(userRoles))
	for _, u := range userRoles {
		users = append(users, u.User)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"cluster_builds":         builds,
		"cluster_name":           cluster.Alias(),
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
}

var statsNameAliases = map[string][2]string{
	"read_tps":  {"stat_read_reqs", "stat_read_success"},
	"write_tps": {"stat_write_reqs", "stat_write_success"},

	"xdr_read_tps":  {"xdr_read_reqs", "xdr_read_success"},
	"xdr_write_tps": {"xdr_write_reqs", "xdr_write_success"},

	"scan_tps":  {"scan_reqs", "scan_success"},
	"query_tps": {"query_reqs", "query_success"},

	"udf_tps":        {"udf_reqs", "udf_success"},
	"batch_read_tps": {"batch_read_reqs", "batch_read_success"},
}

func getClusterThroughputHistory(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"status": "failure", "error": "Cluster not found"})
	}

	var tm time.Time // zero value

	since := int64(0)
	beginStr := c.QueryParam("start_time")
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

	if time.Unix(since, 0).After(cluster.ServerTime().Add(-time.Minute * 30)) {
		tm = time.Unix(since, 0)
	}

	throughput := cluster.ThroughputSince(tm)

	res := map[string]interface{}{
		"cluster_status": cluster.Status(),
	}

	zeroValue := float64(0)
	zeroTime := cluster.ServerTime()
	for outStatName, aliases := range statsNameAliases {
		primaryVals := throughput[aliases[1]]
		secondaryVals := throughput[aliases[0]]

		statRes := map[string][]chartStat{}
		for node, yValuesList := range primaryVals {
			statList := make([]chartStat, 0, len(yValuesList))
			for i, yValues := range yValuesList {
				var Secondary *float64
				if len(secondaryVals[node]) > i {
					Secondary = secondaryVals[node][i].Value(&zeroValue)
				}
				statList = append(statList, chartStat{X: yValues.TimestampJson(&zeroTime), Y: yValues.Value(&zeroValue), Secondary: Secondary})
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
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	// make the output. x: timestamp, y: total reqs, y: successful reqs
	type chartStat struct {
		X         *int64   `json:"x"`
		Y         *float64 `json:"y"`
		Secondary *float64 `json:"secondary"`
	}

	throughput := cluster.LatestThroughput()

	res := map[string]interface{}{
		"cluster_status": cluster.Status(),
	}

	zeroVal := float64(0)
	for outStatName, aliases := range statsNameAliases {
		primaryVals := throughput[aliases[1]]
		secondaryVals := throughput[aliases[0]]

		statRes := make(map[string]chartStat, len(primaryVals))
		for node, yValues := range primaryVals {
			statRes[node] = chartStat{X: yValues.TimestampJson(nil), Y: yValues.Value(&zeroVal), Secondary: secondaryVals[node].Value(&zeroVal)}
		}

		res[outStatName] = statRes
	}

	return c.JSON(http.StatusOK, res)
}

var statKeys = []string{
	"system_free_mem_pct",
	// "nsup-threads",
	"cluster_integrity",
	"storage_defrag_records",
	// "scan-priority",
	"client_connections",
	"migrate_progress_recv",
	// "replication-fire-and-forget",
	// "storage-benchmarks",
	"stat_write_errs",
	"node_status",
	"objects",
	"tombstones",
	"proto-fd-max",
	"system_swapping",
	// "err_write_fail_prole_unknown",
	"queue",
	"uptime",
	// "err_out_of_space",
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
	// "stat_duplicate_operation",
	"free-pct-disk",
	"batch_errors",
	"same_cluster",
}

func getClusterNodes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}
	nodeList := strings.Split(c.Param("nodes"), ",")

	res := make(map[string]interface{}, len(nodeList))
	for _, node := range cluster.Nodes() {
		for _, nodeName := range nodeList {
			if node.Address() == nodeName {
				nodeMem := node.Memory()
				nodeDisk := node.Disk()

				stats := node.AnyAttrs(statKeys...)
				stats["cluster_visibility"] = (node.VisibilityStatus())
				stats["same_cluster"] = true
				stats["memory"] = nodeMem
				stats["disk"] = nodeDisk
				stats["node_status"] = node.Status()

				// customized calculations
				if nodeDisk.TryFloat("total-bytes-disk", 0) > 0 {
					stats["free-pct-disk"] = math.Ceil(100 * nodeDisk.TryFloat("free-bytes-disk", 0) / nodeDisk.TryFloat("total-bytes-disk", 1))
				}
				if nodeMem.TryFloat("total-bytes-memory", 0) > 0 {
					stats["free-pct-memory"] = math.Ceil(100 * nodeDisk.TryFloat("free-bytes-memory", 0) / nodeDisk.TryFloat("total-bytes-memory", 1))
				}

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
}

func getClusterUDFs(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nodes := cluster.Nodes()
	res := map[string]common.Stats{}
	for _, node := range nodes {
		nodeUDFs := node.UDFs()
		for _, udf := range nodeUDFs {
			if u := res[udf.TryString("hash", "")]; u == nil {
				udf["nodes_present"] = []string{node.Address()}
				udf["nodes_absent"] = []string{}
				udf["cache_size"] = common.NOT_AVAILABLE
				res[udf.TryString("hash", "")] = udf
			} else {
				u["nodes_present"] = append(u["nodes_present"].([]string), node.Address())
			}

			for _, udf := range res {
				if name := udf["name"]; name != nil && nodeUDFs[name.(string)] == nil {
					udf["nodes_absent"] = append(udf["nodes_absent"].([]string), node.Address())
				}
			}
		}
	}

	for _, udf := range res {
		udf["synced"] = true
		if len(udf["nodes_absent"].([]string)) > 0 {
			udf["synced"] = false
		}
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"cluster_status": "on",
		"udfs":           res,
	})
}

func postClusterAddUDF(c echo.Context) error {
	form := struct {
		FileName     string `form:"file_name"`
		FileContents string `form:"file_contents"`
		UDFType      string `form:"udf_type"`
	}{}

	c.Bind(&form)
	if len(form.FileName) == 0 || len(form.FileContents) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid filename/contents"))
	}

	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if err := cluster.CreateUDF(form.FileName, form.FileContents); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func postClusterDropUDF(c echo.Context) error {
	form := struct {
		FileName string `form:"file_name"`
	}{}

	c.Bind(&form)
	if len(form.FileName) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid filename"))
	}

	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if err := cluster.DropUDF(form.FileName); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func getClusterNamespaces(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	namespaces := strings.Split(c.Param("namespaces"), ",")
	res := cluster.NamespaceInfo(namespaces)
	return c.JSON(http.StatusOK, res)
}

func getClusterNamespaceNodes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	namespace := c.Param("namespace")
	nodes := strings.Split(c.Param("nodes"), ",")
	res := cluster.NamespaceInfoPerNode(namespace, nodes)
	return c.JSON(http.StatusOK, res)
}

func getClusterAlerts(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	strLastId := c.QueryParam("last_id")
	lastId, err := strconv.ParseInt(strLastId, 10, 64)
	if err != nil {
		return c.JSON(http.StatusOK, errorMap("Invalid last_id"))
	}

	alerts := common.AlertsById(cluster.AlertsFrom(int64(lastId)))
	sort.Sort(alerts)

	res := [][]interface{}{}
	for _, alert := range alerts {
		res = append(res, []interface{}{
			strconv.FormatInt(alert.Id, 10),
			alert.ClusterId,
			alert.Desc,
			alert.Status,
			"alert",
			alert.LastOccured.UnixNano() / 1e6,
		})
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterNodeAllStats(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
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
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
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
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
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

func getClusterNamespaceSindexes(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
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
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	nsName := c.Param("namespace")
	sets := cluster.NamespaceSetsInfo(nsName)

	res := map[string]interface{}{
		"cluster_status": "on",
		"sets":           sets,
	}

	return c.JSON(http.StatusOK, res)
}

func getClusterNamespaceStorage(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if cluster.Status() != "on" {
		return c.JSON(http.StatusOK, common.Stats{"cluster_status": "off"})
	}

	nsName := c.Param("namespace")
	res := cluster.NamespaceDeviceInfo(nsName)
	return c.JSON(http.StatusOK, res)
}

// TODO: Remove this later when UI is updated
func getClusterJobsNode(c echo.Context) error {
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

	jobStats := node.Jobs()
	jobs := make([]common.Stats, 0, len(jobStats))
	for _, v := range jobStats {
		v["address"] = node.Address()
		jobs = append(jobs, v)
	}

	res := map[string]interface{}{
		"node_status": node.Status(),
		"build":       node.Build(),
		"memory":      node.Memory(),
		"jobs":        jobs,
	}

	return c.JSON(http.StatusOK, res)
}

var _jobsSortFields = map[string]common.StatsBy{
	"address":         common.ByStringField,
	"job-type":        common.ByStringField,
	"module":          common.ByStringField,
	"ns":              common.ByStringField,
	"set":             common.ByStringField,
	"status":          common.ByStringField,
	"job-progress":    common.ByIntField,
	"mem-usage":       common.ByIntField,
	"net-io-bytes":    common.ByIntField,
	"priority":        common.ByIntField,
	"recs-read":       common.ByIntField,
	"run-time":        common.ByIntField,
	"time-since-done": common.ByIntField,
	"trid":            common.ByIntField,
}

func getClusterNodesJobs(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	offset, err := strconv.Atoi(c.QueryParam("offset"))
	if err != nil {
		return c.JSON(http.StatusOK, errorMap("Wrong offset param specified."))
	}

	limit, err := strconv.Atoi(c.QueryParam("limit"))
	if err != nil {
		return c.JSON(http.StatusOK, errorMap("Wrong limit param specified."))
	}

	sortField := c.QueryParam("sort_by")
	if sortField == "" {
		sortField = "time-since-done"
	}

	jobStatus := strings.ToLower(c.QueryParam("status"))
	switch jobStatus {
	case "inprogress":
		jobStatus = "active"
	case "completed":
		jobStatus = "done"
	default:
		jobStatus = ""
	}

	sortFunc, exists := _jobsSortFields[sortField]
	if !exists {
		return c.JSON(http.StatusOK, errorMap("Field specified by sort_by not supported."))
	}

	res := common.Stats{
		"status": "success",
		"offset": offset,
		"limit":  limit,
	}

	jobs := []common.Stats{}
	nodesAddrs := common.DeleteEmpty(strings.Split(c.Param("nodes"), ","))
	for _, nodeAddr := range nodesAddrs {
		node := cluster.FindNodeByAddress(nodeAddr)
		if node == nil {
			continue
		}

		jobStats := node.Jobs()
		for _, v := range jobStats {
			if !strings.HasPrefix(v.TryString("status", ""), jobStatus) {
				continue
			}

			v["address"] = node.Address()
			v["node"] = map[string]interface{}{
				"node_status": node.Status(),
				"build":       node.Build(),
				"memory":      node.Memory(),
			}
			jobs = append(jobs, v)
		}

	}

	jobCount := len(jobs)
	if len(jobs) < offset {
		res["jobs"] = jobs
		res["job_count"] = jobCount
		return c.JSON(http.StatusOK, res)
	}

	if c.QueryParam("sort_order") == "desc" {
		common.StatsBy(sortFunc).SortReverse(sortField, jobs)
	} else {
		common.StatsBy(sortFunc).Sort(sortField, jobs)
	}

	if offset+limit <= len(jobs) {
		jobs = jobs[offset : offset+limit]
	}

	res["jobs"] = jobs
	res["job_count"] = jobCount

	return c.JSON(http.StatusOK, res)
}

func setClusterUpdateInterval(c echo.Context) error {
	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	intervalStr := c.FormValue("update_interval")
	if len(intervalStr) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid interval value"))
	}

	interval, err := strconv.Atoi(intervalStr)
	if err != nil {
		return c.JSON(http.StatusOK, errorMap("Invalid interval value"))
	}

	if interval > 10 || interval < 1 {
		return c.JSON(http.StatusOK, errorMap("Invalid interval value; must be between 1 and 10"))
	}

	cluster.SetUpdateInterval(interval)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func postClusterAddIndex(c echo.Context) error {
	form := struct {
		IndexName string `form:"index_name"`
		BinName   string `form:"bin_name"`
		SetName   string `form:"set_name"`
		IndexType string `form:"bin_type"`
		Namespace string `form:"namespace"`
	}{}

	c.Bind(&form)
	if len(form.IndexName) == 0 || len(form.BinName) == 0 || len(form.SetName) == 0 || len(form.IndexType) == 0 || len(form.Namespace) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid index data."))
	}

	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if err := cluster.CreateIndex(form.Namespace, form.SetName, form.IndexName, form.BinName, form.IndexType); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}

func postClusterDropIndex(c echo.Context) error {
	form := struct {
		IndexName string `form:"index_name"`
	}{}

	c.Bind(&form)
	if len(form.IndexName) == 0 {
		return c.JSON(http.StatusOK, errorMap("Invalid index name."))
	}

	clusterUuid := c.Param("clusterUuid")
	cluster := _observer.FindClusterById(clusterUuid)
	if cluster == nil {
		return c.JSON(http.StatusOK, errorMap("Cluster not found"))
	}

	if err := cluster.DropIndex(c.Param("namespace"), "", form.IndexName); err != nil {
		return c.JSON(http.StatusOK, errorMap(err.Error()))
	}

	// wait for different nodes to sync up
	time.Sleep(1 * time.Second)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"status": "success",
	})
}
