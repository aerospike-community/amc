/******************************************************************************
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
******************************************************************************/

define(['jquery', 'underscore', 'backbone', 'd3'], function($, _, Backbone, D3) {
    var AppConfig = {
        baseUrl : '/aerospike/service/clusters/',
        amc_enterprise_matrix_url :"http://www.aerospike.com/docs/amc/",
        videoHelp : {
        	enterprise : 'http://www.aerospike.com/docs/amc/user_guide/enterprise/',
        	community : 'http://www.aerospike.com/docs/amc/user_guide/community/'
        },
        maxConnectionRequestErrorBeforeAlert:5,
        maxStartNodes: 50,
        maxNumberOfAlerts: 50,
        toastTimeout: 3000,
        retryDelayTime: 1000,
        modalWidth : 480,
        amc_type : ['community','enterprise'],
        version3point7 : "3.7.0.0",
        updateInterval: {
            'cluster': 5000,
            'jobs': 5000,
            'alerts': 5000,
            'throughput': 5000,
            'nodes': 5000,
            'xdr': 5000,
            'namespaces': 5000,
            'stat': 5000,
            'latency': 10000,
			'def': 10000,
			'backup' : 3000,
            'restore' : 3000
        },

        mainContainer: {
            id: '#mainContainer'
        },
        sessionKeys : {
        	isSecurityEnable : "isSecurityEnable",
        	username : "username",
        	userClusterId : "userClusterId"
        },
        header : {
            subHeader : ".header-container .sub-header",
        	loginButtonId : "#userLoginButton",
        	logOutBtn : "#logOutBtn",
            sessionCloseBtn : "#sessionTerminateBtn",
        	userMenuContainer : "#userMenuContainer",
        	loggedInUserContainer : "#loggedInUserContainer",
        	changePassword : "#changePassword",
        	multipleClusterListContainer : "#multiple-cluster-list-container",
        	multipleClusterListHolder : "#multiple-cluster-list-holder"
        },

        stat: {
            addressListDiv: '#address-list',
            nodeStatTableDiv: '#nodeStatListTable',
            statTableDiv: '#statListTable'
        },
        cluster: {
            resourceUrl: '/basic',
            memoryPieDiv: '#memory_overview',
            diskPieDiv: '#disk_overview',
            addressListOLContainerDiv: "#all_address_checkboxes",
            addressListOL: '#nodeListSelectable'
        },
        throughput: {
            resourceUrl: '/throughput',
            historySelect: '#selectHistory',

            readChart: 'readChart',
            readChartLegend: 'readLegend',
            readChartXAxis: 'readChartXAxis',
            readSlider: 'readSlider',
            readTPS: 'readTps',

            writeChart: 'writeChart',
            writeChartLegend: 'writeLegend',
            writeChartXAxis: 'writeChartXAxis',
            writeSlider: 'writeSlider',
            writeTPS: 'writeTps',

            xdrReadChart: 'xdrReadChart',
            xdrReadChartLegend: 'xdrReadLegend',
            xdrReadChartXAxis: 'xdrReadChartXAxis',
            xdrReadSlider: 'xdrReadSlider',
            xdrReadTPS: 'xdrReadTps',

            xdrWriteChart: 'xdrWriteChart',
            xdrWriteChartLegend: 'xdrWriteLegend',
            xdrWriteChartXAxis: 'xdrWriteChartXAxis',
            xdrWriteSlider: 'xdrWriteSlider',
            xdrWriteTPS: 'xdrWriteTps',

            queryChart: 'queryChart',
            queryChartLegend: 'queryLegend',
            queryChartXAxis: 'queryChartXAxis',
            querySlider: 'querySlider',
            queryTPS: 'queryTps',

            scanChart: 'scanChart',
            scanChartLegend: 'scanLegend',
            scanChartXAxis: 'scanChartXAxis',
            scanSlider: 'scanSlider',
            scanTPS: 'scanTps',

            udfChart: 'udfChart',
            udfChartLegend: 'udfLegend',
            udfChartXAxis: 'udfChartXAxis',
            udfSlider: 'udfSlider',
            udfTPS: 'udfTps',

            batchReadChart: 'batchReadChart',
            batchReadChartLegend: 'batchReadLegend',
            batchReadChartXAxis: 'batchReadChartXAxis',
            batchReadSlider: 'batchReadSlider',
            batchReadTPS: 'batchReadTps'
        },
        node: {
            resourceUrl: '/nodes/',
            nodeTableDiv: '#nodeListTable',
			nodeTablePrefix: 'nodesDetails'
        },
        xdr: {
            resourceUrl: '/xdr/',
            xdrTableDiv: '#xdrListTable',
            xdrNotConfiguredMsg: 'XDR is not configured or not running on port '
        },
        namespace: {
            resourceUrl: '/namespaces/',
            namespaceTableDiv: '#namespaceListTable',
            namespaceClusterWideTableDiv: '#namepaceClusterWideListTable',
            namespaceClusterWideTablePrefix: 'clusterWideNamespace',
            nodeWiseNamespaceContainer: '#nodeWiseNamespaceContainer',
            nodeWiseNamespaceTablePrefix: 'nodeWiseNamespace',
            selectedNamespaceTable: '#namespaceTable',
            clusterWideNodeNamespaceContainer: '#clusterWideNodeNamespaceContainer',
            namespaceListCloseButton: '#namespaceListCloseButton',
            namespaceNameMainContainer: '#namespaceNameMainContainer'
        },
        job: {
//            resourceUrl: '/scanjobs/nodes/',
            resourceUrl: '/jobs/nodes/',
            nodeTableDiv: '#nodeListTable',
            nodeTableCompletedJobsDiv: '#nodeListTableCompletedJobs',
            runningJobPager: '#runningJobPager',
            completedJobPager: '#completedJobPager'
        },
        sindex: {
            resourceUrl: '/namespaces/',
            tableDiv: '#sIndexTable'
        },
        sets: {
            resourceUrl: '/namespaces/',
            tableDiv: '#setsTable'
        },
        storage: {
            resourceUrl: '/namespaces/',
            tableDiv: '#storageTable'
        },
        udf: {
            resourceUrl: '/namespaces/',
            tableDiv: '#udfTable'
        },
        alerts: {
            resourceUrl: '/alerts',
            container: '#alerts_list',
            noAlertsContainer: '#no_alerts'
        },
		backup: {
			resourceUrl: '/get_backup_progress',
			container: '#clusterBackupProgress',
			initiationUrl: '/initiate_backup'
		},

        restore : {
            resourceUrl: '/get_restore_progress',
            knownBackups : '/get_successful_backups',
            availableBackups : '/get_available_backups',
            container: '#clusterRestoreProgress',
            initiationUrl: '/initiate_restore'
        },

        userAdmin : {
            getAllUsers: '/get_all_users',
            addUser: '/add_user',
            updateUser: '/update',
            deleteUser: '/remove',
            tableDiv: "#userStatTable",
            userTablePrefix: "userDetails"
        },

        roleAdmin: {
            getAllRoles: '/get_all_roles',
            addRole: '/add_role',
            deleteRole: '/drop_role',
            updateRole: '/update',
            tableDiv: '#rolesStatTable',
            roleTablePrefix: 'role'
        },

        commandLine: {
            resourceUrl: "/fire_cmd",
            nodeColoumnWidth: '150px'
        },

        availableRole : ["user-admin", "sys-admin", "read-write", "read", "write","data-admin"],

	    secondaryIndexDefList: ['Index Name', 'Bin', 'Set', 'Bin Type', 'Synced on all nodes?'],
        setsDefList: ['Set', 'Objects', 'Stop Writes Count', 'Delete', 'Enable XDR', 'Disable Eviction'],
        storageDefList: ['Storage', 'Devices', 'Synced on all nodes?'],
        udfDefList: ['UDF File Name', 'UDF File Type', 'Cache Size', 'Synced on all nodes?'],
        xdrDefList: ['Namespace Name', 'Destination Nodes'],
        secondaryIndexDefListColumn: [
            {name: 'indexname', width: 150, align: 'center', resizable: false, sortable: true, title: 'Node IP and port', searchoptions:{clearSearch: false}},
            {name: 'bins', width: 150, align: 'center', resizable: false, sortable: true, title: 'Node IP and port', searchoptions:{clearSearch: false}},
            {name: 'set', width: 150, align: 'center', resizable: false, sortable: true, title: 'Aerospike build version', searchoptions:{clearSearch: false}},
//            {name: 'namespaceName', width: 150, align: 'center', resizable: false, sortable: true, title: 'Size of the cluster'},
            {name: 'type', width: 150, align: 'center', resizable: false, sortable: true, title: 'If all the nodes are visible to all the nodes in the cluster ', searchoptions:{clearSearch: false}},
            {name: 'sync_state', width: 100, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
        ],
        setsDefListColumn: [
//            {name: 'namespaceName', width: 150, align: 'center', resizable: false, sortable: true, title: 'Size of the cluster'},
            {name: 'set_name', width: 200, align: 'center', resizable: false, sortable: true, title: '', searchoptions:{clearSearch: false}},
            {name: 'n_objects', width: 150, align: 'center', resizable: false, sortable: true, title: '', searchoptions:{clearSearch: false}, sorttype : 'number'},
            {name: 'stop-write-count', width: 150, align: 'center', resizable: false, sortable: true, title: '', searchoptions:{clearSearch: false}, sorttype : 'number'},
            // {name: 'evict-hwm-count', width: 150, align: 'center', resizable: false, sortable: true, title: '', searchoptions:{clearSearch: false}, sorttype : 'number'},
            {name: 'delete', width: 150, align: 'center', resizable: false, sortable: true, title: '', searchoptions:{clearSearch: false}},
            {name: 'enable-xdr', width: 150, align: 'center', resizable: false, sortable: true, title: '', searchoptions:{clearSearch: false}},
			{name: 'disable-eviction', width: 150, align: 'center', resizable: false, sortable: true, title: '', searchoptions:{clearSearch: false}}
        ],
        storageDefListColumn: [
//            {name: 'namespaceName', width: 150, align: 'center', resizable: false, sortable: true, title: 'Size of the cluster'},
            {name: 'storageType', width: 100, align: 'center', resizable: false, sortable: false, title: 'If all the nodes are visible to all the nodes in the cluster ', searchoptions:{clearSearch: false}},
            {name: 'storageDevice', width: 150, align: 'center', resizable: false, sortable: false, title: 'If all the nodes are visible to all the nodes in the cluster ', searchoptions:{clearSearch: false}},
            {name: 'synced', width: 100, align: 'center', resizable: false, sortable: false, title: 'Disk Usage', searchoptions:{clearSearch: false}},
        ],
        udfDefListColumn: [
            {name: 'filename', width: 150, align: 'center', resizable: false, sortable: true, title: 'Size of the cluster', searchoptions:{clearSearch: false}},
            {name: 'type', width: 150, align: 'center', resizable: false, sortable: true, title: 'If all the nodes are visible to all the nodes in the cluster ', searchoptions:{clearSearch: false}},
            {name: 'cache_size', width: 150, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
            {name: 'synced', width: 150, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
        ],
        xdrDefListColumn: [
            {name: 'namespaceName', width: 150, align: 'center', resizable: false, sortable: true, title: 'Size of the cluster', searchoptions:{clearSearch: false}},
            {name: 'destinationNodes', width: 150, align: 'center', resizable: false, sortable: true, title: 'If all the nodes are visible to all the nodes in the cluster ', searchoptions:{clearSearch: false}},
        ],

        //////////
        sIndexStatsList: [],



        //////////
        nodeStatsList: [],
		namespaceStatsList: [],
		nodeConfigList: [],
        xdrStatsList: [],
        xdrConfigList : [],
        namespaceConfigList : [],

        jobsList: [ 'Host : Port', 'Job ID', 'Progress %', 'Status', 'Memory',  'Net. IO', 'Priority', 'Recs Read', 'Namespace', 'Run Time', 'Module', 'Type'],
        jobsListColumn: [
            {name: 'address', width: 150, align: 'center', resizable: false, sortable: true, title: 'Size of the cluster', searchoptions:{clearSearch: false}},
            {name: 'trid', width: 150, align: 'center', resizable: false, sortable: true, title: 'Size of the cluster', searchoptions:{clearSearch: false}},
            {name: 'job-progress', width: 50, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
            {name: 'status', width: 80, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
            {name: 'mem_pie_chart', width: 100, align: 'center', resizable: false, sortable: true, title: 'If all the nodes are visible to all the nodes in the cluster ', searchoptions:{clearSearch: false}},
            {name: 'net-io-bytes', width: 100, align: 'center', resizable: false, sortable: true, title: 'Network IO (bytes)', searchoptions:{clearSearch: false}},
            {name: 'priority', width: 100, align: 'center', resizable: false, sortable: true, title: 'Priority', searchoptions:{clearSearch: false}},
            {name: 'recs-read', width: 100, align: 'center', resizable: false, sortable: true, title: 'Records Read', searchoptions:{clearSearch: false}},
            {name: 'ns', width: 100, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
            {name: 'run_time', width: 60, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
            {name: 'module', width: 60, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
            {name: 'job-type', width: 60, align: 'center', resizable: false, sortable: true, title: 'Disk Usage', searchoptions:{clearSearch: false}},
//            {name: 'priority', width: 60, align: 'center', resizable: false, sortable: true, title: 'Disk Usage'},
        ],
        nodeColumnNames: ['', 'Host : Port', 'Build</br> Version', 'Cluster</br> Size', 'Cluster</br> Visibility', 'Disk', 'RAM', 'Cluster Name', 'Master and Replica</br> Objects', 'Master and Replica</br> Tombstones', 'Client</br> Connections', 'Migrates</br> Incoming', 'Migrates</br> Outgoing'],
        nodeListColumn: [
            {name: 'icon', width: 80, align: 'left', resizable: false, sortable: false, title: 'Node IP and port'},
            {name: 'address', width: 150, align: 'center', resizable: false, sortable: false, title: 'Node IP and port'},
            {name: 'build', width: 60, align: 'center', resizable: false, sortable: false, title: 'Aerospike build version'},
            {name: 'cluster_size', width: 50, align: 'center', resizable: false, sortable: false, title: 'Size of the cluster'},
            {name: 'cluster_visibility', width: 70, align: 'center', resizable: false, sortable: false, title: 'If all the nodes are visible to all the nodes in the cluster '},
            {name: 'disk-arr-str', width: 80, align: 'center', resizable: false, sortable: false, title: 'Disk Usage'},
            {name: 'memory-arr-str', width: 80, align: 'center', resizable: false, sortable: false, title: 'Memory Usage'},
            {name: 'cluster_name', width: 60, align: 'center', resizable: false, sortable: false, title: 'Cluster Name'},
            {name: 'objects', width: 110, align: 'center', resizable: false, sortable: false, title: 'Total number of records in the node'},
            {name: 'tombstones', width: 110, align: 'center', resizable: false, sortable: false, title: 'Total number of tombstones in the node'},
            {name: 'client_connections', width: 70, align: 'center', resizable: false, sortable: false, title: 'Number of active client connections to the node'},
            {name: 'migrate_progress_recv', width: 90, align: 'center', resizable: false, sortable: false, title: 'Number of partitions currently being migrated in to the node'},
            {name: 'migrate_progress_send', width: 90, align: 'center', resizable: false, sortable: false, title: 'Number of partitions pending to be migrated out of the node'}
        ],
        xdrColumnNames: ['XDR Status', 'Host : Port', 'Bytes Shipped', 'Free Dlog', 'Lag Secs', 'Req Outstanding', 'Req Relog', 'Req Shipped', 'Throughput'],
        xdrListColumn: [
			{name: 'xdr_status', width: 80, align: 'center', resizable: false, sortable: false, title: 'XDR On/Off Status'},
            {name: 'address', width: 150, align: 'center', resizable: false, sortable: false, title: 'Node IP and port'},
            {name: 'esmt-bytes-shipped', width: 100, align: 'center', resizable: false, sortable: false, title: 'Estimated number of bytes shipped over the network to remote data center.'},
            {name: 'free-dlog-pct', width: 90, align: 'center', resizable: false, sortable: false, title: 'Percentage of the digest log free and available for use'},
            {name: 'xdr_timelag', width: 90, align: 'center', resizable: false, sortable: false, title: 'Time difference in seconds between last shipped record and current time.'},
            {name: 'stat_recs_outstanding', width: 90, align: 'center', resizable: false, sortable: false, title: 'Number of overall outstanding records yet to be shipped'},
            {name: 'stat_recs_relogged', width: 100, align: 'center', resizable: false, sortable: false, title: 'Number of deletes re-logged'},
            {name: 'stat_recs_shipped', width: 100, align: 'center', resizable: false, sortable: false, title: 'Number of deletes shipped'},
            {name: 'cur_throughput', width: 100, align: 'center', resizable: false, sortable: false, title: 'Number of partitions pending to be migrated out of the node'},
        ],
        namespaceColumnNames: ['Host', 'Total Objects', 'Master</br> (Objects, Tombstones)', 'Replica</br> (Objects, Tombstones)', 'Repl\'n Factor', /*'Least Avail%'*/'Avail%','Disk </br>Used, HWM', 'RAM </br>Used, HWM, Stop Writes'/*, 'RAM'*/, 'Expired Objects', 'Evicted Objects'],
        namespaceListColumn: [
            {name: 'node', width: 136, align: 'center', resizable: false, sortable: false, title: 'Host Name'},
            {name: 'objects-num', width: 86, align: 'center', resizable: false, sortable: false, title: 'Total number of Master objects + Replica objects in the cluster'},
            {name: 'master-objects-tombstones', width: 66, align: 'center', resizable: false, sortable: false, title: 'Total number of master records and tombstones in the cluster'},
            {name: 'prole-objects-tombstones', width: 66, align: 'center', resizable: false, sortable: false, title: 'Total number of replica records and tombstones in the cluster'},
            {name: 'repl-factor', width: 56, align: 'center', resizable: false, sortable: false, title: 'Number of copies of a record (including the master copy) maintained in the entire cluster'},
            /*{name: 'disk-arr-str', width: 66, align: 'center', resizable: false, sortable: false, title: 'Disk Usage'},*/
            {name: 'min-avail', width: 66, align: 'center', resizable: false, sortable: false, title: '% of write blocks available'},
            {name: 'disk-pct-bullet', width: 166, align: 'center', resizable: false, sortable: false, title: 'Disk used percentage, disk high water mark percentage'},
            {name: 'memory-pct-bullet', width: 166, align: 'center', resizable: false, sortable: false, title: 'Memory used percentage, disk high water mark percentage, stop writes percentage'},
            /*{name: 'memory-arr-str', width: 60, align: 'center', resizable: false, sortable: false, title: 'Memory Usage'},*/
            {name: 'expired-objects-num', width: 56, align: 'center', resizable: false, sortable: false, title: 'Total number of records expired for the namespace in the cluster'},
            {name: 'evicted-objects-num', width: 56, align: 'center', resizable: false, sortable: false, title: 'Total number of records evicted for the namespace in the cluster'}
        ],
        namespaceClusterWideColumnNames: ['Namespace', 'Total Objects', 'Master</br> (Objects, Tombstones)', 'Replica</br> (Objects, Tombstones)', 'Repl\'n Factor', /*'Least Avail%'*/'Avail%', 'Disk', 'RAM', 'Expired Objects', 'Evicted Objects'],
        namespaceClusterWideListColumn: [
            {name: 'name', width: 150, align: 'center', resizable: false, sortable: false, title: 'Namespace Name'},
            {name: 'objects', width: 80, align: 'center', resizable: false, sortable: false, title: 'Total number of Master objects + Replica objects in the cluster'},
            {name: 'master-objects-tombstones', width: 80, align: 'center', resizable: false, sortable: false, title: 'Total number of master records in the cluster'},
            {name: 'prole-objects-tombstones', width: 80, align: 'center', resizable: false, sortable: false, title: 'Total number of prole records in the cluster'},
            {name: 'repl-factor', width: 60, align: 'center', resizable: false, sortable: false, title: 'Number of copies of a record (including the master copy) maintained in the entire cluster'},
            {name: 'min-avail', width: 80, align: 'center', resizable: false, sortable: false, title: '% of write blocks available, least value for nodes across cluster'},
            {name: 'disk-arr-str', width: 80, align: 'center', resizable: false, sortable: false, title: 'Disk Usage'},
            {name: 'memory-arr-str', width: 80, align: 'center', resizable: false, sortable: false, title: 'Memory Usage'},
            {name: 'expired-objects', width: 100, align: 'center', resizable: false, sortable: false, title: 'Total number of records expired for the namespace in the cluster'},
            {name: 'evicted-objects', width: 100, align: 'center', resizable: false, sortable: false, title: 'Total number of records evicted for the namespace in the cluster'}
        ],
        userManagementGridColumnNames: ['Username', 'Roles'],
        userManagementGridColumn: [
            {name: 'user', width: 150, align: 'left', resizable: false, sortable: true, title: 'Username'},
            {name: 'roles', width: 600, align: 'left', resizable: false, sortable: false, title: 'Role privilege : Read', formatter: function(roleArray){
                    var roles = roleArray;
                    for (var i = 0; i < roles.length; i++) {
                        var role = roles[i].match(/\<span\ *class\ *\=\ *\'[a-z0-9A-Z_\-]*tag[a-z0-9A-Z_\-]*\'\>[a-z\-A-Z0-9\.]+\<\/span\>/g);
                        if(role != null){
                            role = role[0];
                            var start = role.indexOf(">");
                            start++;
                            var end = role.indexOf("<", start);
                            roles[i] = role.substr(start, end - start);
                        }
                        roles[i] = "<span class='tag'>" + roles[i] + "</span>";
                    };
                    return roles.join(" ");
                }, unformat: function(cellvalue, options, rowObject ){
                    return cellvalue.split(" ");
                }
            }
        ],
        roleManagementGridColumnNames: ['Role', 'Privileges'],
        roleManagementGridColumn: [
            {name: 'role', width: 150, align: 'left', resizable: false, sortable: true, title:"Assigned Role"},
            {name: 'privileges', width: 600, align: 'left', resizable: false, sortable: false, title:"Privileges available to role", formatter: function(roleArray){
                    var roles = roleArray;
                    for (var i = 0; i < roles.length; i++) {
                        var role = roles[i].match(/\<span\ *class\ *\=\ *\'[a-z0-9A-Z_\-]*tag[a-z0-9A-Z_\-]*\'\>[a-z\-A-Z0-9\.]+\<\/span\>/g);
                        if(role != null){
                            role = role[0];
                            var start = role.indexOf(">");
                            start++;
                            var end = role.indexOf("<", start);
                            roles[i] = role.substr(start, end - start);
                        }
                        roles[i] = "<span class='tag'>" + roles[i] + "</span>";
                    };
                    return roles.join(" ");
                }, unformat: function(cellvalue, options, rowObject ){
                    return cellvalue.split(" ");
                }
            }
        ],
        throughputGraphColorList: [
            //Unique 50 shades..
            "#2bb1c2", "#99c2f6", "#6fd2aa", "#638ca7", "#f58f63", "#c3c271", "#f8da49", "#eba888", "#af1234", "#f56423",
            "#b9d761", "#ced19b", "#b4ded9", "#164e5b", "#cae2c2", "#b3c086", "#45a79a", "#d6171a", "#e7461e", "#d6da54",
            "#d3c587", "#9ddee7", "#c4dff5", "#a5dab1", "#74b8d2", "#535368", "#8b0c36", "#e87114", "#9adab0", "#debe83",
            "#48d0c5", "#256476", "#8fa3de", "#c1cd98", "#702f79", "#f88957", "#d3deb7", "#f6bb4c", "#a06a63", "#227e8d",
            "#91b3ee", "#3dc6af", "#5a738f", "#fdd7cc", "#f1b1e2", "#fdc4bb", "#f667a2", "#fcaebd", "#fc98b7", "#f3cbde",

            //Repeat
            "#2bb1c2", "#99c2f6", "#6fd2aa", "#638ca7", "#f58f63", "#c3c271", "#f8da49", "#eba888", "#af1234", "#f56423",
            "#b9d761", "#ced19b", "#b4ded9", "#164e5b", "#cae2c2", "#b3c086", "#45a79a", "#d6171a", "#e7461e", "#d6da54",
            "#d3c587", "#9ddee7", "#c4dff5", "#a5dab1", "#74b8d2", "#535368", "#8b0c36", "#e87114", "#9adab0", "#debe83",
            "#48d0c5", "#256476", "#8fa3de", "#c1cd98", "#702f79", "#f88957", "#d3deb7", "#f6bb4c", "#a06a63", "#227e8d",
            "#91b3ee", "#3dc6af", "#5a738f", "#fdd7cc", "#f1b1e2", "#fdc4bb", "#f667a2", "#fcaebd", "#fc98b7", "#f3cbde",

            //Repeat
            "#2bb1c2", "#99c2f6", "#6fd2aa", "#638ca7", "#f58f63", "#c3c271", "#f8da49", "#eba888", "#af1234", "#f56423",
            "#b9d761", "#ced19b", "#b4ded9", "#164e5b", "#cae2c2", "#b3c086", "#45a79a", "#d6171a", "#e7461e", "#d6da54",
            "#d3c587", "#9ddee7", "#c4dff5", "#a5dab1", "#74b8d2", "#535368", "#8b0c36", "#e87114", "#9adab0", "#debe83",
            "#48d0c5", "#256476", "#8fa3de", "#c1cd98", "#702f79", "#f88957", "#d3deb7", "#f6bb4c", "#a06a63", "#227e8d",
            "#91b3ee", "#3dc6af", "#5a738f", "#fdd7cc", "#f1b1e2", "#fdc4bb", "#f667a2", "#fcaebd", "#fc98b7", "#f3cbde",

            //Repeat
            "#2bb1c2", "#99c2f6", "#6fd2aa", "#638ca7", "#f58f63", "#c3c271", "#f8da49", "#eba888", "#af1234", "#f56423",
            "#b9d761", "#ced19b", "#b4ded9", "#164e5b", "#cae2c2", "#b3c086", "#45a79a", "#d6171a", "#e7461e", "#d6da54",
            "#d3c587", "#9ddee7", "#c4dff5", "#a5dab1", "#74b8d2", "#535368", "#8b0c36", "#e87114", "#9adab0", "#debe83",
            "#48d0c5", "#256476", "#8fa3de", "#c1cd98", "#702f79", "#f88957", "#d3deb7", "#f6bb4c", "#a06a63", "#227e8d",
            "#91b3ee", "#3dc6af", "#5a738f", "#fdd7cc", "#f1b1e2", "#fdc4bb", "#f667a2", "#fcaebd", "#fc98b7", "#f3cbde"
        ],
        pollerOptions: function(pollingInterval) {
            if (typeof pollingInterval === 'undefined')
                pollingInterval = 1000;
            var options = {
                delay: +pollingInterval
            };
            return options;
        },
        blankNodeStatListData: function(address, rowID, clusterID, displayStr) {
            if (typeof displayStr === 'undefined') {
                displayStr = 'N/A';
            }
            var blankData = {
                'address': address,
                'node_status': 'off',
                'stat_recs_outstanding': displayStr,
                'timediff_lastship_cur_secs': displayStr,
                'xdr_timelag': displayStr,
                'esmt-bytes-shipped': displayStr,
                'stat_recs_relogged': displayStr,
                'stat_recs_shipped': displayStr,
                'free-dlog-pct': displayStr,
                'cur_throughput': displayStr
            };
            return blankData;
        },
        blankNodeListData: function(address, displayStr) {
            if (typeof displayStr === 'undefined') {
                displayStr = 'N/A';
            }
            var blankData = {
                'address': address,
                'node_status': 'off',
                'build': displayStr,
                'migrate_progress_recv': displayStr,
                'migrate_progress_send': displayStr,
                'cluster_size': displayStr,
                'cluster_visibility': displayStr,
                'disk-arr-str': displayStr,
                'memory-arr-str': displayStr,
                'objects': displayStr,
                'client_connections': displayStr,
                'cluster_integrity': displayStr,
                'err_out_of_space': displayStr,
                'write_master': displayStr,
                'write_prole': displayStr,
                'queue': displayStr,
                'system_swapping': displayStr,
                'err_write_fail_prole_unknown': displayStr,
                'stat_duplicate_operation': displayStr,
                'uptime': displayStr,
                'nsup-threads': displayStr,
                'scan-priority': displayStr,
                'storage-benchmarks': displayStr,
                'system_free_mem_pct': displayStr,
                'replication-fire-and-forget': displayStr,
                'free-pct-disk': displayStr
            };
            return blankData;
        },
        blankJobData: function(address, displayStr) {
            if (typeof displayStr === 'undefined') {
                displayStr = 'N/A';
            }
            var blankData = {
                'address': address,
                'trid': displayStr,
                'job-progress': displayStr,
                'status': displayStr,
                'mem_pie_chart': displayStr,
                'run_time': displayStr,
                'module': displayStr,
                'job-type': displayStr,
                'net_io_bytes': displayStr,
                'set': displayStr,
                'recs_read': displayStr,
                'priority': displayStr,
                'mem_usage': displayStr,
                'mem_arr': displayStr
            };
            return blankData;
        },
        blankXdrListData: function(address, nodeStatus, xdrStatus, displayStr) {
            if (typeof displayStr === 'undefined') {
                displayStr = 'N/A';
            }
            if (typeof xdrStatus === 'undefined') {
                xdrStatus = displayStr;
            }

            var blankData = {
                'address': address,
                'stat_recs_outstanding': displayStr,
                'timediff_lastship_cur_secs': displayStr,
                'xdr_timelag': displayStr,
                'esmt-bytes-shipped': displayStr,
                'stat_recs_relogged': displayStr,
                'stat_recs_shipped': displayStr,
                'free-dlog-pct': displayStr,
                'cur_throughput': displayStr,
                'build': displayStr,
                'node_status': nodeStatus,
                'xdr_status': xdrStatus
            };
            return blankData;
        },
        blankNamespaceListData: function(name, node, displayStr) {//rowID, clusterID, totalNamespace){
            if (typeof displayStr === 'undefined') {
                displayStr = 'N/A';
            }
            var blankData = {
                'name': name,
                'node': node,
                'nodeNamespaceUrl': displayStr,
                'node_status': displayStr,
                'cluster_status': displayStr,
                'objects': displayStr,
                'master-objects': displayStr,
                'prole-objects': displayStr,
                'evicted-objects-num': displayStr,
                'expired-objects-num': displayStr,
                'repl-factor': displayStr,
                'disk-pct-bullet': displayStr,
                'disk-arr-str': displayStr,
                'disk-arr': displayStr,
                'memory-pct-bullet': displayStr,
                'memory-arr-str': displayStr,
                'memory-arr': displayStr,
                'least_available_pct': displayStr,
                'min-avail': displayStr,
                'expired-objects': displayStr,
                'evicted-objects': displayStr,
                'memory-size': displayStr,
                'free-pct-memory': displayStr,
                'available_pct': displayStr,
                'max-void-time': displayStr,
                'stop-writes': displayStr,
                'stop-writes-pct': displayStr,
                'hwm-breached': displayStr,
                'default-ttl': displayStr,
                'max-ttl': displayStr,
                'enable-xdr': displayStr,
                'single-bin': displayStr,
                'data-in-memory': displayStr
            };
            return blankData;
        },
        htmlVideo: {
			selectNodes :function(){
				/*
			var tempStr=  '<video id="selectNodesHelpVideo" loop muted >' +
						'<source src="http://aerospike.com/amc/videos/select-nodes-help.webm" type="video/webm" onerror="fallback(parentNode)">' +
						'<source src="http://aerospike.com/amc/videos/select-nodes-help.mp4" type="video/mp4" onerror="fallback(parentNode)">' +
						'Your browser does not support the video tag.' +
						'</video>';; */
			return "";
			}
        },
        changeClusterHtmlStr:'<span class="seed-ip-title">Seed node: </span>' +
            '<span id="seed_ip_text"></span>' +
            '<span id="seed_ip_link" onclick="onChangeClusterClick()" title="Click to change seed IP">Change</span>',

        cursorStyler : {
        	cursorStylerDiv : "#cursorStyler",
        	cursorStylerHtmlStr : "<div id='cursorStyler' " +
        			"style='position : fixed; width : 100%; height : 100%; top : 0; left : 0; " +
        			"cursor : progress; background-color : rgba(0,0,0,0); pointer-events : none;  z-index : 1000;'></div>"
        },

        urls : {
            REMOVE_CLUSTER : '/logout',
            GET_CURRENT_USER : '/get-current-user',
            CHANGE_PASSWORD : '/change_password',
            SET_UPDATE_INTERVAL : '/set-update-interval',
            GET_AMC_VERSION : '/get_amc_version',
            USER_ROLES : "/get_user_roles",
            GET_CURRENT_MONITORING_CLUSTESR : "/get_current_monitoring_clusters",
            SESSION_TERMINATE : "/session-terminate"
        },

        multicluster : {
            multiclusterurls : {
                GET_MULTICLUSTER_VIEW : '/aerospike/get_multicluster_view'
            },
            pollInterval : 5000
        }

    };
    return AppConfig;

});

function fallback(video) {
	while (video.hasChildNodes()) {
		if (video.firstChild instanceof HTMLSourceElement)
			video.removeChild(video.firstChild);
		else{
			$("#selectNodesHelpVideoContainer").remove();
			var htmlStr = $("#selectNodesHelp").html();

			htmlStr += "Please Use following links to access help videos<br/><a href='http://aerospike.com/amc/videos/select-nodes-help.mp4' target='_blank'>http://aerospike.com/amc/videos/select-nodes-help.mp4</a><br/>OR<br/><a href='http://aerospike.com/amc/videos/select-nodes-help.webm' target='_blank'>http://aerospike.com/amc/videos/select-nodes-help.webm</a>";

			$("#selectNodesHelp").html(htmlStr);
			$("#selectNodesHelp").css("text-align","center");
			break;
		}
	}
}
