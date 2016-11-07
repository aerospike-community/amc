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

define(["underscore", "backbone", "helper/util", "views/dashboard/pieview", "models/dashboard/throughputmodel",
        "config/app-config", "d3", "helper/namespace-table", "helper/namespace-clusterwide-table",
        "views/dashboard/summaryView", "helper/overlay", "collections/dashboard/nodes",
        "collections/dashboard/clusterwidenamespaces", "collections/dashboard/xdrs"], 
        function(_, Backbone, Util,
        PieView, ThroughputModel, AppConfig, D3, NamespaceTable, NamespaceClusterWideTable,
        SummaryView, Overlay, NodeCollection, NamespaceCollection, XdrCollection) {

    var ClusterModel = Backbone.Model.extend({
        initialize: function() {
            var that = this;
            this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();
            Util.initAllStatsLinks();
            this.initClusterOverview();
            this.startEventListeners();
            this.summaryView = new SummaryView({
                el: ".cluster-overview"
            });
            this._previousSummary = null;
            window.AMCGLOBALS.pageSpecific.toBeSelected = [];

            this.spinner1 = new Overlay("clusterDiskUsage");
            this.spinner2 = new Overlay("clusterRamUsage");
            this.spinner3 = new Overlay("clusterSummary");
            this.spinner4 = new Overlay("alertActivity");

            this.on('change:namespaces', function() {
                if (typeof this.previous('namespaces') !== 'undefined') {
                    if (this.namespaceInitialized === true) {
                        this.validateNamespaceChange();
                        Util.updateAllStatsLinks();
                    }
                }
            });
            this.on('change:update_interval', function() {
                Util.setUpdateInterval(this.get("update_interval"));
                this.updatePollingInterval();
            });

            this.on('change:nodes', function() {
                if (this.clusterInitialized === false) {
                    this.nodeList = this.get("nodes");
                    this.namespaceList = this.get("namespaces");
                    Util.setUpdateInterval(this.get("update_interval"));
                    Util.updateModelPoller(this, AppConfig.updateInterval['cluster'], true);
                    Util.updateNodesColorList(this.nodeList);
                    this.initSelectedNodes();
                    this.initNodeDetails();
                    this.initNamespaceDetails();
                    this.initXdrDetails();
                    this.initThroughput();
                    this.clusterInitialized = true;
                    Util.updateAllStatsLinks();
                } else {
                    var previousNodeList = this._previousAttributes.nodes;
                    if (previousNodeList) {
                        var currentNodeList = this.get("nodes");
                        var newNodeList = _.difference(currentNodeList, previousNodeList);
                        var canBeSelected = AppConfig.maxStartNodes - window.AMCGLOBALS.persistent.selectedNodes.length;
                        window.AMCGLOBALS.persistent.selectedNodes = _.intersection(window.AMCGLOBALS.persistent.selectedNodes, currentNodeList);
                        window.AMCGLOBALS.persistent.selectedNodes = window.AMCGLOBALS.persistent.selectedNodes.concat((_.union(newNodeList, window.AMCGLOBALS.pageSpecific.toBeSelected)).slice(0, canBeSelected));
                        window.AMCGLOBALS.pageSpecific.toBeSelected = [];
                    }
                    this.validateNodeChange();
                    window.AMCGLOBALS.persistent.nodeListView.render(that);
                    Util.updateModelsImmediately();
                    Util.updateTabLinks();
                    window.location.hash = window.AMCGLOBALS.activePage + "/" + window.AMCGLOBALS.persistent.seedNode + "/" + window.AMCGLOBALS.persistent.snapshotTime + "/" + window.AMCGLOBALS.persistent.selectedNodes.toString();

                    Util.validateNodeThroughput(this);
                    Util.updateAllStatsLinks();
                }
            });
            
			Util.initSelectNodesToggling('.title-bar');

            Util.initAddNewNode("#addNewNodeButton");

            $("#xdr_port").val(window.AMCGLOBALS.persistent.xdrPort);

            this.connectionReqErrCount = 0;

            if (Util.setGlobalClusterInfoInModel("basic", this)) {
                this.fetchSuccess(this);
            }
        },
        updatePollingInterval: function() {
            var that = this;
            Util.updateModelPoller(that, AppConfig.updateInterval['cluster'], true);
            Util.updateModelPoller(window.AMCGLOBALS.persistent.models.alertModel, AppConfig.updateInterval['alerts'], true);
            Util.updateModelPoller(that.throughputModel, AppConfig.updateInterval['throughput'], true);
            that.throughputModel.activelyPolling && that.throughputModel.initChartUpdate(that.throughputModel);
            that.nodeCollection.updatePoller({
                poll: true
            });
            that.namespaceCollection.updatePoller({
                poll: true
            });
            that.xdrCollection.updatePoller({
                poll: true
            });
            that.updateSelectedNamespaceCollectionPoller();

        },
        updateSelectedNamespaceCollectionPoller: function() {
            var that = this;
            that.namespaceCollection.each(function(model) {
                if (typeof model.namespaceCollection !== 'undefined' && model.namespaceCollection !== null) {
                    model.namespaceCollection.updatePoller({
                        poll: true
                    });
                }
            });
        },
        initVariables: function() {
            this.clusterInitialized = false;
            this.namespaceInitialized = false;
            this.nodeList = null;
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;
            this.clusterStatusWasFalse = false;
            this.nodeCollection = null;
            this.namespaceCollection = null;
            this.throughputModel = null;
            this.xdrCollection = null;
            this.summaryView = null;
        },
        initSelectedNodes: function() {
            var isBookmarked = false;
            var that = this;
            $("#connect_xdr").off("click").on("click", function(e) {
                e.stopPropagation();
                var port = $("#xdr_port").val();

                if (!Util.validatePort(port)) {
                    $("#xdr_port").val(window.AMCGLOBALS.persistent.xdrPort);
                }

                window.AMCGLOBALS.persistent.xdrPort = $("#xdr_port").val();

                that.set("xdrPort", window.AMCGLOBALS.persistent.xdrPort);
                Util.updateAllStatsLinks();

            });

            if (window.AMCGLOBALS.persistent.selectedNodesStr !== null) {
                var tempSelectedNodes = window.AMCGLOBALS.persistent.selectedNodesStr.split(',');
                window.AMCGLOBALS.persistent.selectedNodes = _.intersection(this.nodeList, tempSelectedNodes);
                var totalSelectedNodes = window.AMCGLOBALS.persistent.selectedNodes.length;
                if (totalSelectedNodes > 0) {
                    isBookmarked = true;
                    if (totalSelectedNodes > AppConfig.maxStartNodes) {
                        window.AMCGLOBALS.persistent.selectedNodes = _.first(window.AMCGLOBALS.persistent.selectedNodes, AppConfig.maxStartNodes);
                    }
                    window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(this.nodeList, window.AMCGLOBALS.persistent.selectedNodes);
                }

            }
            this.initNodeList(!isBookmarked);
        },
        initNodeList: function(reCalculateSelectedNodes) {
            if (reCalculateSelectedNodes === true) {
                var totalNodes = this.nodeList.length;
                if (totalNodes > AppConfig.maxStartNodes) {
                    window.AMCGLOBALS.persistent.selectedNodes = _.first(this.nodeList, AppConfig.maxStartNodes);
                    window.AMCGLOBALS.persistent.unSelectedNodes = _.last(this.nodeList, totalNodes - AppConfig.maxStartNodes);
                } else {
                    window.AMCGLOBALS.persistent.selectedNodes = this.nodeList;
                }
            }
            window.location.hash = window.AMCGLOBALS.activePage + "/" + window.AMCGLOBALS.persistent.seedNode + "/" + window.AMCGLOBALS.persistent.snapshotTime + "/" + window.AMCGLOBALS.persistent.selectedNodes.toString();
            window.AMCGLOBALS.persistent.nodeList = this.nodeList;
            window.AMCGLOBALS.persistent.nodeListView.render(this);
        },
        validateNodeChange: function() {
            var oldNodeList = this.nodeList;
            var newNodeList = this.get("nodes");
            var removedNodes = _.difference(oldNodeList, newNodeList);
            var newNodes = _.difference(newNodeList, oldNodeList);
            if (_.isEmpty(removedNodes) && _.isEmpty(newNodes)) {
                return;
            }
            if (!_.isEmpty(removedNodes)) {
                this.deleteRemovedNodes(removedNodes);
                this.nodeList = _.difference(this.nodeList, removedNodes);
                window.AMCGLOBALS.persistent.selectedNodes = _.difference(window.AMCGLOBALS.persistent.selectedNodes, removedNodes);
                window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(window.AMCGLOBALS.persistent.unSelectedNodes, removedNodes);
            }
            if (!_.isEmpty(newNodes)) {
                this.nodeList = _.union(this.nodeList, newNodes);
                Util.updateNodesColorList(newNodes);
                this.throughputModel.addNewNodesInSeries(newNodes);
                window.AMCGLOBALS.persistent.unSelectedNodes = _.union(window.AMCGLOBALS.persistent.unSelectedNodes, newNodes);
            }
            $(AppConfig.cluster.addressListOLContainerDiv).empty();
            $(AppConfig.cluster.addressListOLContainerDiv).html('<ol id="nodeListSelectable"></ol>');

            if (_.isEmpty(window.AMCGLOBALS.persistent.selectedNodes)) {
                this.initNodeList(true);
                for (var nodeI in window.AMCGLOBALS.persistent.selectedNodes) {
                    var node = window.AMCGLOBALS.persistent.selectedNodes[nodeI];
                    Util.toggleNodeThroughput(this, nodeAddr, true);
                }
            } else {
                this.initNodeList(false);
            }
        },
        validateNamespaceChange: function() {
            var oldNamespaceList = this.namespaceList;
            var newNamespaceList = this.get("namespaces");
            var deletedNamespaces = _.difference(oldNamespaceList, newNamespaceList);
            var newNamespaces = _.difference(newNamespaceList, oldNamespaceList);

            if (!_.isEmpty(deletedNamespaces)) {
                for (var namespace in deletedNamespaces) {
                    Util.deleteNamespaceFromClusterModel(this, deletedNamespaces[namespace]);
                }
            }
            if (!_.isEmpty(newNamespaces)) {
                var namespaceModelI = this.namespaceCollection.models.length;
                for (var namespace in newNamespaces) {
                    Util.createNewModel(this, this.namespaceCollection, namespaceModelI, newNamespaces[namespace], '2', 'namespaces');
                    namespaceModelI++;
                }
            }

            this.namespaceList = this.get("namespaces");

            //RECHECK
            if (!_.isEmpty(newNamespaces) || (!_.isEmpty(deletedNamespaces) && !_.isEmpty(this.namespaceList))) {
                this.namespaceCollection.updatePoller({
                    poll: true
                });
            } else if (_.isEmpty(this.namespaceList)) {
                this.namespaceCollection.updatePoller({
                    poll: false
                });
            }
        },
        deleteRemovedNodes: function(removedNodes) {
            for (var nodeI in removedNodes) {
                var node = removedNodes[nodeI];
                if (_.contains(window.AMCGLOBALS.persistent.selectedNodes, node)) {
                    Util.deleteNodeFromClusterModel(this, node);
                    Util.deleteNamespaceFromClusterModel(this, node);
                }
            }
        },
        url: function() {
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.cluster.resourceUrl;
        },

        startEventListeners: function() {
            var that = this;

            function viewDestroy() {
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            }

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);

            window.$("#nodeListSelectBtn").off('click').on('click', function(e) {
                var container = $("#all_address_checkboxes");
                $("#nodeListSelectable li.ui-selected").removeClass("unselectable").addClass("selectable");
                $("#nodeListSelectable li").not("#nodeListSelectable li.ui-selected").removeClass("selectable").addClass("unselectable");
                Util.checkMaxLimitAndResetToDefaultMax(container, that);
                $(container).find('li').each(function() {
                    try {
                        if ($(this).hasClass('ui-selected')) {
                            var nodeAddr = $(this).find('.li-node-addr').text();
                            if (!(_.contains(window.AMCGLOBALS.persistent.selectedNodes, nodeAddr))) {
                                Util.toggleNodeThroughput(that, nodeAddr, true);
                                window.AMCGLOBALS.persistent.selectedNodes = _.union(window.AMCGLOBALS.persistent.selectedNodes, [nodeAddr]);
                                window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(window.AMCGLOBALS.persistent.unSelectedNodes, [nodeAddr]);

                            }
                        } else {
                            var nodeAddr = $(this).find('.li-node-addr').text();
                            if (_.contains(window.AMCGLOBALS.persistent.selectedNodes, nodeAddr)) {
                                Util.deleteNodeFromClusterModel(that, nodeAddr);
                                window.AMCGLOBALS.persistent.selectedNodes = _.difference(window.AMCGLOBALS.persistent.selectedNodes, [nodeAddr]);
                                window.AMCGLOBALS.persistent.unSelectedNodes = _.union(window.AMCGLOBALS.persistent.unSelectedNodes, [nodeAddr]);
                            }
                        }
                        Util.updateTabLinks();

                        var snapshotString = "nodelist";
                        if (window.AMCGLOBALS.activePage === "dashboard") {
                            snapshotString = window.AMCGLOBALS.persistent.snapshotTime;
                        }

                        window.location.hash = window.AMCGLOBALS.activePage + "/" + window.AMCGLOBALS.persistent.seedNode + "/" + snapshotString + "/" + window.AMCGLOBALS.persistent.selectedNodes.toString();
                        Util.updateSelectAllToggle();
                    } catch (e) {
                        console.info('error in LI iterator');
                    }

                });
            });
        },

        fetchSuccess: function(response) {

            Util.setGlobalClusterInfo({
                type: "basic",
                attributes: response.attributes
            });
            Util.removeEnviromentSetupUI();

            response.connectionReqErrCount = 0;
            Util.hideAMCNEErrorAlert();
            $(AppConfig.mainContainer.serverNetworkErrorContainer).css("display", "none");
            if (response.CID !== window.AMCGLOBALS.currentCID) {
                response.destroy();
                return;
            }
            try {

                if (!_(response.attributes["memory"]).isEqual(response._previousAttributes["memory"])) {
                    response.spinner1.stopOverlay();
                    response.memoryView.render(response.attributes["memory"]);
                }
                if (!_(response.attributes["disk"]).isEqual(response._previousAttributes["disk"])) {
                    response.spinner2.stopOverlay();
                    response.diskView.render(response.attributes["disk"]);
                }

                var summary = {};
                summary.totalNodes = response.attributes["nodes"];
                summary.nodesDown = response.attributes["off_nodes"];
                summary.nodesUp = _.difference(summary.totalNodes, summary.nodesDown);
                summary.namespaces = response.attributes["namespaces"];
                summary.buildVersion = response.attributes["build_details"];
                summary.activeRedAlerts = response.attributes["active_red_alert_count"];

                if (!_(summary).isEqual(response._previousSummary)) {
                    response.spinner3.stopOverlay();
                    response.spinner4.stopOverlay();
                    response.summaryView.render(response, summary);
                    response._previousSummary = summary;
                }
            } catch (e) {
                console.info(e.toString());
                Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, true);
            }

            if (this.clusterID !== window.AMCGLOBALS.persistent.clusterID) {
                this.clusterID = window.AMCGLOBALS.persistent.clusterID;

            }

            if (typeof response.attributes.error !== 'undefined' && response.attributes.error.indexOf("Invalid cluster id") != -1) {
                delete response.attributes.error;
                Util.clusterIDReset();
            }
        },
        fetchError: function(response) {
            if (response.CID !== window.AMCGLOBALS.currentCID) {
                response.destroy();
                return;
            }
            if (this.xhr.status === 401) {
                Util.showUserSessionInvalidateError();
                return;
            }
            if (AMCGLOBALS.pageSpecific.GlobalPollingActive) {
                if (AppConfig.maxConnectionRequestErrorBeforeAlert <= ++response.connectionReqErrCount) {
                    Util.showAMCNEErrorAlert();
                }
            }
            var that = this;
            !AMCGLOBALS.pageSpecific.GlobalPollingActive && Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, false);
        },
        initClusterOverview: function() {
            this.memoryView = new PieView({
                el: AppConfig.cluster.memoryPieDiv
            });
            this.diskView = new PieView({
                el: AppConfig.cluster.diskPieDiv
            });
        },
        initThroughput: function() {
            this.throughputPoller = null;
            this.throughputModel = new ThroughputModel({
                "cluster_id": window.AMCGLOBALS.persistent.clusterID,
                "basicNodesList": this.get("nodes")
            });
            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['throughput']);
            this.throughputPoller = Util.initPoller(this.throughputModel, polOptions);
            this.throughputPoller.start();
        },

        initNamespaceDetails: function() {
            if (!this.namespaceCollection) {
                this.namespaceCollection = new NamespaceCollection({
                    poll: true,
                    "namespace_list": this.namespaceList
                });
                this.namespaceInitialized = true;
            } else {
                this.namespaceCollection.updatePoller({
                    poll: true
                });
            }
        },

        initNodeDetails: function() {
            $('#addNewNodeButton').show();

            if (!this.nodeCollection) {
                this.nodeCollection = new NodeCollection({
                    poll: true
                });
            } else {
                this.nodeCollection.updatePoller({
                    poll: true
                });
            }
        },

        initXdrDetails: function() {

            if (!this.xdrCollection) {
                this.xdrCollection = new XdrCollection({
                    poll: true
                });
            } else {
                this.xdrCollection.updatePoller({
                    poll: true
                });
            }
        },

        refreshGrid: function(collection, gridContainer) {
            $(gridContainer).jqGrid("clearGridData");
            for (var model in collection.models) {
                collection.models[model].attributes['row_id'] = model;
                $(gridContainer).jqGrid("clearGridData");
            }
            $(gridContainer).jqGrid("clearGridData");
        },
    });
    return ClusterModel;
});
