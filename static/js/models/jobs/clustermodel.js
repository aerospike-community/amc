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

define(["underscore", "backbone", "helper/util", "models/jobs/nodemodel", "collections/jobs/nodes",  "config/app-config"], function(_, Backbone, Util, NodeModel, NodeCollection, AppConfig){
    var ClusterModel = Backbone.Model.extend({
        initialize: function(){
			this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();
            this.startEventListeners();
            window.AMCGLOBALS.pageSpecific.toBeSelectedNodes = [];
            this.on('change:nodes', function(){
				Util.setUpdateInterval(this.get("update_interval"));
				Util.updateModelPoller(this, AppConfig.updateInterval['cluster'], true);
				Util.initSelectNodesToggling('.title-bar');

                if(Util.isBelowVersion3(this.get('build'))){
                   this.nodeList = this.get("nodes");
                   this.initSelectedNodes();
                   $('#nodeListGrid').empty();
                   Util.displayOldVersionMsg('#nodeListGrid');
                   this.isOldVersion = true;
                   return;
                }else{
                    if(this.clusterInitialized === false){
                        this.nodeList = this.get("nodes");
                        this.initSelectedNodes();
                        this.initNodeDetails();
                        this.clusterInitialized = true;
                    }else{
                        this.validateNodeChange();
                        $("#nodeListSelectBtn").trigger('click');
                    }
                }
            });
			this.on('change:update_interval', function(){
				if(typeof this.previous("update_interval") !== 'undefined'){
					Util.setUpdateInterval(this.get("update_interval"));
					this.updatePollingInterval();
				}
            });
			this.on("change:different_cluster_nodes",function(){
			   	var differentClusterNodes = this.get('different_cluster_nodes');
			   	if(differentClusterNodes.length !== 0 ){
			   		Util.showClusterDivertPopup("Node <strong>" + (differentClusterNodes[0]) + "</strong> cannot be monitored here as it belongs to a different cluster");
			   	}
			});
			this.connectionReqErrCount = 0;

            if( Util.setGlobalClusterInfoInModel("clusters", this) ){
                this.fetchSuccess(this);
            }
        },
		updatePollingInterval: function(){
            var that = this;
			Util.updateModelPoller(that, AppConfig.updateInterval['cluster'], true);
			Util.updateModelPoller(window.AMCGLOBALS.persistent.models.alertModel, AppConfig.updateInterval['alerts'], true);
			Util.updateCollectionPoller(that.nodeCollection, AppConfig.updateInterval['nodes'], true);
		},
        initVariables: function(){
            this.isOldVersion = false;
            this.clusterInitialized = false;
            this.nodeList = null;
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
            this.nodeCollection = null;
        },
        initSelectedNodes: function(){
            var isBookmarked = false;
            if(window.AMCGLOBALS.persistent.selectedNodesStr !== null){
                var tempSelectedNodes = window.AMCGLOBALS.persistent.selectedNodesStr.split(',');
                window.AMCGLOBALS.persistent.selectedNodes = _.intersection(this.nodeList, tempSelectedNodes);
                var totalSelectedNodes = window.AMCGLOBALS.persistent.selectedNodes.length;
                if(totalSelectedNodes > 0){
                    isBookmarked = true;
                    if(totalSelectedNodes > AppConfig.maxStartNodes){
                        window.AMCGLOBALS.persistent.selectedNodes = _.first(window.AMCGLOBALS.persistent.selectedNodes,AppConfig.maxStartNodes);
                    }
                    window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(this.nodeList, window.AMCGLOBALS.persistent.selectedNodes);
                }

            }
             this.initNodeList(!isBookmarked);
        },
        initNodeList: function(reCalculateSelectedNodes){
            if(reCalculateSelectedNodes === true){
                var totalNodes = this.nodeList.length;
                if(totalNodes > AppConfig.maxStartNodes){
                    window.AMCGLOBALS.persistent.selectedNodes = _.first(this.nodeList, AppConfig.maxStartNodes);
                    window.AMCGLOBALS.persistent.unSelectedNodes = _.last(this.nodeList, totalNodes - AppConfig.maxStartNodes);
                }else{
                    window.AMCGLOBALS.persistent.selectedNodes = this.nodeList;
                }
            }
            window.location.hash = window.AMCGLOBALS.activePage + "/"+window.AMCGLOBALS.persistent.seedNode + "/nodelist/"+window.AMCGLOBALS.persistent.selectedNodes.toString();
            window.AMCGLOBALS.persistent.nodeList = this.nodeList;
            window.AMCGLOBALS.persistent.nodeListView.render(this);
        },
        validateNodeChange: function(){
            var oldNodeList = this.nodeList;
            var newNodeList = this.get("nodes");
            var removedNodes = _.difference(oldNodeList, newNodeList);
            var newNodes = _.difference(newNodeList, oldNodeList);
            if(_.isEmpty(removedNodes) && _.isEmpty(newNodes)){
                return;
            }
            if(!_.isEmpty(removedNodes)){
                this.deleteRemovedNodes(removedNodes);
                this.nodeList = _.difference(this.nodeList, removedNodes);
                window.AMCGLOBALS.persistent.selectedNodes = _.difference(window.AMCGLOBALS.persistent.selectedNodes, removedNodes);
                window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(window.AMCGLOBALS.persistent.unSelectedNodes, removedNodes);
            }
            if(!_.isEmpty(newNodes)){
                this.nodeList = _.union(this.nodeList, newNodes);
                if(window.AMCGLOBALS.persistent.selectedNodes.length < AppConfig.maxStartNodes ){
                	while(newNodes.length > 0){
                		if(window.AMCGLOBALS.persistent.selectedNodes.length >= AppConfig.maxStartNodes){
                			break;
                		}
                		window.AMCGLOBALS.pageSpecific.toBeSelectedNodes.push(newNodes[0]);
                		window.AMCGLOBALS.persistent.selectedNodes.push(newNodes.shift());
                	}
                	if(newNodes.length > 0){
                		window.AMCGLOBALS.persistent.unSelectedNodes = _.union(window.AMCGLOBALS.persistent.unSelectedNodes, newNodes);
                	}
                } else {
                	window.AMCGLOBALS.persistent.unSelectedNodes = _.union(window.AMCGLOBALS.persistent.unSelectedNodes, newNodes);
                }
            }
            $(AppConfig.cluster.addressListOL).selectable( "disable" );
            $(AppConfig.cluster.addressListOLContainerDiv).empty();
            $(AppConfig.cluster.addressListOLContainerDiv).html('<ol id="nodeListSelectable"></ol>');

            if(_.isEmpty(window.AMCGLOBALS.persistent.selectedNodes)){
                this.refreshGrid(this.nodeCollection);
                this.initSelectedNodes();
                this.initNodeDetails();
            }else{
                this.initNodeList(false);
            }
        },
        deleteRemovedNodes: function(removedNodes){
            for(var nodeI in removedNodes){
                var node = removedNodes[nodeI];
                Util.deleteJobFromClusterModel(this, node);
            }
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ ;
        },
        fetchSuccess: function(response){
            
            Util.setGlobalClusterInfo({type : "clusters", attributes : response.attributes});
            Util.removeEnviromentSetupUI();
            
        	response.connectionReqErrCount = 0;
        	Util.hideAMCNEErrorAlert();
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
            if(response.isOldVersion){
                Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, false);
            }
			
			if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				this.clusterID = window.AMCGLOBALS.persistent.clusterID;

			}
			
			if(typeof response.attributes.error !== 'undefined' && response.attributes.error.indexOf("Invalid cluster id") != -1){
				delete response.attributes.error;
				Util.clusterIDReset();				
			}
        },
        fetchError: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
			if(this.xhr.status === 401) {
        		Util.showUserSessionInvalidateError();
        		return;
        	}
			if(AMCGLOBALS.pageSpecific.GlobalPollingActive){
            	if(AppConfig.maxConnectionRequestErrorBeforeAlert <= ++response.connectionReqErrCount){
            		Util.showAMCNEErrorAlert();
            	} 
            }
            var that = this;
			!AMCGLOBALS.pageSpecific.GlobalPollingActive && Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, false);
        },
        initNodeDetails : function(){
            this.totalNodes = this.nodeList.length;
            this.nodeCollection = new NodeCollection();

            this.createNewGridCollection(this.nodeCollection, window.AMCGLOBALS.persistent.selectedNodes, window.AMCGLOBALS.persistent.selectedNodes.length);
        },
        refreshGrid: function(collection, gridContainer){
                $(gridContainer).jqGrid("clearGridData");
                for(var model in collection.models){
                        //oldRowID = collection.models[model].attributes['row_id'];
                        collection.models[model].attributes['row_id'] = model;
                        $(gridContainer).jqGrid("clearGridData");
                }
                $(gridContainer).jqGrid("clearGridData");
        },
        createNewGridCollection: function(collection, list, totalElements, optionalParameter){
            //Optional Parameter : xdrPort or namespace name
            totalElements = list.length;
            for(var i=0; i < totalElements ;i++){
                Util.createNewJobModel(this, collection, i, list[i], 2, 'jobs', optionalParameter);
            }
        },

        startEventListeners : function (){
            var that = this;
            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            };

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);

            $(".title-bar").off('click').on('click', that.checkTabPollerState);

            window.$("#nodeListSelectBtn").off('click').on('click', function(e){
                var container = $("#all_address_checkboxes");
                $("#nodeListSelectable li.ui-selected").removeClass("unselectable").addClass("selectable");
                $("#nodeListSelectable li").not("#nodeListSelectable li.ui-selected").removeClass("selectable").addClass("unselectable");
                Util.checkMaxLimitAndResetToDefaultMax(container, that);
                $(container).find('li').each(function() {
                    try{  
                    	 if($(this).hasClass('ui-selected')){
                             var nodeAddr = $(this).find('.li-node-addr').text();
                             if(!(_.contains(window.AMCGLOBALS.persistent.selectedNodes, nodeAddr)) || _.contains(window.AMCGLOBALS.pageSpecific.toBeSelectedNodes, nodeAddr)){
                                 Util.addJobToClusterModel(that, nodeAddr);
                                 window.AMCGLOBALS.persistent.selectedNodes = _.union(window.AMCGLOBALS.persistent.selectedNodes,[nodeAddr]);
                                 window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(window.AMCGLOBALS.persistent.unSelectedNodes, [nodeAddr]);
                                 if(typeof window.AMCGLOBALS.pageSpecific.toBeSelectedNodes !== "undefined")
                                    window.AMCGLOBALS.pageSpecific.toBeSelectedNodes.splice(window.AMCGLOBALS.pageSpecific.toBeSelectedNodes.indexOf(nodeAddr,1));
                             }
                         }else{
                             var nodeAddr = $(this).find('.li-node-addr').text();
                             if(_.contains(window.AMCGLOBALS.persistent.selectedNodes, nodeAddr)){
                                 Util.deleteJobFromClusterModel(that, nodeAddr);
                                 window.AMCGLOBALS.persistent.selectedNodes = _.difference(window.AMCGLOBALS.persistent.selectedNodes, [nodeAddr]);
                                 window.AMCGLOBALS.persistent.unSelectedNodes = _.union(window.AMCGLOBALS.persistent.unSelectedNodes,[nodeAddr]);
                             }
                         }
                         Util.updateTabLinks();
                         window.location.hash = window.AMCGLOBALS.activePage + "/"+window.AMCGLOBALS.persistent.seedNode+"/nodelist/"+window.AMCGLOBALS.persistent.selectedNodes.toString();        
						 Util.updateSelectAllToggle();
                    }catch(e){
                        console.info('error in LI iterator');
                    }

                });
            });
			
			//Binding panel state to pollers
			var container = $("#nodeContainer .card_layout");
			
			container.off("startPoller", that.startModelPoller).on("startPoller", {model : that}, that.startModelPoller);
			container.off("stopPoller", that.stopModelPoller).on("stopPoller", {model : that}, that.stopModelPoller);

            var containerCompletedJobs = $("#nodeContainerCompletedJobs .card_layout");

            containerCompletedJobs.off("startPoller", that.startModelPoller).on("startPoller", {model : that}, that.startModelPoller);
            containerCompletedJobs.off("stopPoller", that.stopModelPoller).on("stopPoller", {model : that}, that.stopModelPoller);
        },
        
        //Start the model pollers even if one tab is closed
        checkTabPollerState : function(event){
            setTimeout(function(){
                var nodeContainerClose = $("#nodeContainer .card_layout .closed");
                var nodeContainerCompletedJobsOpen = $("#nodeContainerCompletedJobs .card_layout .open");
                if(nodeContainerClose.length != 0 && nodeContainerCompletedJobsOpen.length != 0 ){
                    var container = $("#nodeContainerCompletedJobs .card_layout");
                    container.trigger("startPoller");
                }

                var nodeContainerOpen = $("#nodeContainer .card_layout .open");
                var nodeContainerCompletedJobsClose = $("#nodeContainerCompletedJobs .card_layout .closed");
                if( nodeContainerCompletedJobsClose.length != 0 && nodeContainerOpen.length != 0 ){
                    var container = $("#nodeContainer .card_layout");
                    container.trigger("startPoller");
                }
            }, 1000); 
        },
		
		startModelPoller: function(event){
			Util.updateCollectionPoller(event.data.model.nodeCollection, AppConfig.updateInterval['nodes'], true);
		},
		
		stopModelPoller: function(event){
			Util.updateCollectionPoller(event.data.model.nodeCollection, AppConfig.updateInterval['nodes'], false);			
		}
    });
    return ClusterModel;
});
