/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["underscore", "backbone", "helper/util", "config/app-config", "timechart", "models/latency/nodeCentralisedModel"], function(_, Backbone, Util, AppConfig, TimeChart, NodeCentralisedModel){
    var ClusterModel = Backbone.Model.extend({
        initialize: function(){
			this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();
            this.startEventListeners();
			this.initMainChart("#mainLatencyChartContainer");
            window.AMCGLOBALS.pageSpecific.toBeSelectedNodes = [];
            this.on('change:nodes', function(){
				Util.setUpdateInterval(this.get("update_interval"));
				Util.updateModelPoller(this, AppConfig.updateInterval['cluster'], true);

				if(this.clusterInitialized === false){
					this.nodeList = this.get("nodes");
					this.initSelectedNodes();
					this.initNodeDetails();
					this.clusterInitialized = true;
				}else{
					this.validateNodeChange();
                    $("#nodeListSelectBtn").trigger('click');
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

            if(Util.setGlobalClusterInfoInModel("clusters", this)){
                this.fetchSuccess(this);
            }

            // set selected latency window
            this.initLatencyWindow();
        },

      initLatencyWindow: function() {
          var latencyWindow = window.AMCGLOBALS.persistent.latencyWindow;
          if(!latencyWindow) {
            return;
          }

          this.updateChartWindow(latencyWindow);
          // set value in dropdown
          $('#selectHistory').val(latencyWindow);
      },

      updateChartWindow: function(latencyWindow) {
          this.mainChart.configure({
              timeWindowSize : parseInt(latencyWindow)*1000,
              fixTimeWindowSize : latencyWindow === "1800" ? false : true,
          });
      },
        

        startEventListeners : function (){
            var that = this;
            function viewDestroy(){
                that.mainChart.remove();
                that.destroy();
            }

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);

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
                                that.addNode(that, nodeAddr);
                                window.AMCGLOBALS.persistent.selectedNodes = _.union(window.AMCGLOBALS.persistent.selectedNodes,[nodeAddr]);
                                window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(window.AMCGLOBALS.persistent.unSelectedNodes, [nodeAddr]);
                                window.AMCGLOBALS.pageSpecific.toBeSelectedNodes.splice(window.AMCGLOBALS.pageSpecific.toBeSelectedNodes.indexOf(nodeAddr,1));
                            }
                        }else{
                            var nodeAddr = $(this).find('.li-node-addr').text();
                            if(_.contains(window.AMCGLOBALS.persistent.selectedNodes, nodeAddr)){
                                that.deleteNode(that, nodeAddr);
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
				if(typeof that.mainChart !== 'undefined' && $("#nodesLatencyChartsContainer").find(".selected").length == 0)
					that.bindMainChart();
            });

            window.$("#selectHistory").off("change").on("change", function(){
                var latencyWindow = this.value;
                window.AMCGLOBALS.persistent.latencyWindow = latencyWindow;

                that.updateChartWindow(latencyWindow);
                that.mainChart.updateSeries(that.mainChart.rawData);
            });
        },

		initMainChart : function(latencyChartContainer){
			var that = this;
			this.mainChart = timechart({
					id : "mainChart",
					container : latencyChartContainer
				});

			this.mainChart.initialize({
					updateInterval : 0,
					fixedSnapShotLength : false,
					fixScaleY : false,
					autoResize : true,
					xAxisShowTickLines : true,
					yAxisShowTickLines : true,
					showHoverBubble : true,
					xAxisVisible : true,
					yAxisVisible : true,
					marginTop : 10,
					marginBottom : 15,
					marginRight : 20,
					marginLeft : 10,
					yAxisTickOrientation : 'right',
                    xAxisTickFormat : "%H:%M:%S",
					scaleYCeilOffset : "5%",
					hoverBubbleStyle : 'combined:sortUpon=ORDER,orderBy=INC',
					bubbleTemplate : //"<div class='timeseries %%ID%% bubble header' style='background-color : %%COLOR%% !important;'>%%TITLE%%</div>" +
						 "<div class='timeseries %%ID%% bubble body'>" +
						 "<div class='timeseries %%ID%% bubble innerBody'>" +
						 "<span class='timeseries %%ID%% bubble x date'>%%DATE%%/%%month%%/%%YEAR%%</span>" +
						 "&nbsp&nbsp&nbsp" +
						 "<span class='timeseries %%ID%% bubble x time'>%%HOUR%%:%%MINUTE%%:%%SECOND%%</span>" +
						 "%%individual_template%%" +
						 "<div class='timeseries %%ID%% bubble individual'>" +
						 "<div class='timeseries %%ID%% bubble individual colorBullet' style='background-color : %%COLOR%%;'> </div>" +
						 "<div class='timeseries %%ID%% bubble individual title'><div>%%SUBTITLE%%</div></div>" +
						 "<div class='timeseries %%ID%% bubble individual value'><div>%%VALUE%%</div></div>" +
						 "<div class='timeseries %%ID%% bubble individual secondary'><div>%%SECONDARY%%</div></div>" +
						 "</div>" +
						 "%%individual_template%%" +
						 "</div>" +
						 "</div>"
				});

			this.mainChart.enableRangeSlider("#mainLatencyChartSlider .sliderContainer");

			that.bindMainChart();

			$("#mainLatencyChartControl").off("click");
			$("#mainLatencyChartControl").on("click",function(){
				var button = $(this).find(".controlsContainer");
				if(button.hasClass("icon-pause2")){
					button.removeClass("icon-pause2").addClass("icon-play3");
					button.attr("title","Continue graph updates");
					that.mainChart.secondarySource.removeSecondaryChart(that.mainChart.id);
				}else {
					button.removeClass("icon-play3").addClass("icon-pause2");
					button.attr("title","Pause graph updates");
					var secondarySource = that.mainChart.secondarySource;
					that.mainChart.secondarySource = null;
					secondarySource.addSecondaryChart({id : that.mainChart.id, preProcessor : Util.mainChartPreProcessor});
				}
			});
		},

		bindMainChart : function(){
			function bindChart(){
                var nodetLatencyContainer = $('.node-latency-container').not('.rowDisabled');
				var containers = $(".sparkline-container").length;
				var chartsCount = $(".sparkline-container svg").length + $(".node-latency-container.rowDisabled").find('.sparkline-container').length;

				if(containers == chartsCount && containers > 0 && nodetLatencyContainer.length>0){
					nodetLatencyContainer.find(".sparkline-chart").first().trigger("click");
				} else if(window.location.hash.indexOf("latency") !== -1){
					setTimeout(bindChart, 500);
					console.info("trying bind");
				}
			}
			bindChart();
		},

		updateLegend : function(container, data){
			var legendaryDOM = "<div class='legend'>";
			for(var i=0; i<data.length; i++){
                legendaryDOM += "<div class='legend-bullets-container'>"
				legendaryDOM += "<div class='legend-color-container' style='background-color : " + data[i].color + ";'></div>";
				legendaryDOM += "<div class='legend-title'>" + data[i].title + "</div>"
                legendaryDOM += "</div>";
			}

			legendaryDOM += "</div>";
			$(container).html(legendaryDOM);
		},

		updateChartTitle : function(container, title){
			$(container).text(title);
		},

		updatePollingInterval: function(){
            var that = this;
			Util.updateModelPoller(that, AppConfig.updateInterval['cluster'], true);
			Util.updateModelPoller(window.AMCGLOBALS.persistent.models.alertModel, AppConfig.updateInterval['alerts'], true);
		},
        initVariables: function(){
            this.isOldVersion = false;
            this.clusterInitialized = false;
            this.nodeList = null;
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
            this.nodeCollection = null;
			this.mainChart = null;
			window.AMCGLOBALS.pageSpecific.mainChartController = window.AMCGLOBALS.persistent.seedNode;
			window.AMCGLOBALS.pageSpecific.pollingMain = false;
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
            window.location.hash = window.AMCGLOBALS.activePage + "/"+window.AMCGLOBALS.persistent.seedNode+"/nodelist/"+window.AMCGLOBALS.persistent.selectedNodes.toString();
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
				response.mainChart.remove();
				response.destroy(); return;
			}
            if(response.isOldVersion){
                Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, false);
            }

			if(typeof response.attributes.error !== 'undefined' && response.attributes.error.indexOf("Invalid cluster id") != -1){
				delete response.attributes.error;
				Util.clusterIDReset();
			}
        },
        fetchError: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.mainChart.remove();
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
            this.nodeCentralisedModel = new NodeCentralisedModel({update_interval : 10});
            this.nodeCollection = this.nodeCentralisedModel.nodeCollection;

            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['latency']);
            Util.initPoller(this.nodeCentralisedModel,polOptions).start();
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

		addNode: function(clusterModel, nodeAddr){
            try{
                var nodeModelI = clusterModel.nodeCollection.models.length;
                Util.createNewModel(clusterModel, clusterModel.nodeCollection, nodeModelI, nodeAddr, 2, 'latency');

            }catch(e){
                console.info('error in addNodeToClusterModel')
            }
        },
        deleteNode: function(clusterModel, nodeAddr){
            try{
				clusterModel.nodeCollection.each(function(model){
					if(model.address === nodeAddr){
						model.rowView.cleanView(model.rowView);
						clusterModel.nodeCollection.remove(model);
						model = null;
					}
				});

			}catch(e){
                console.info('error in deleteNodeFromClusterModel');
            }
        },
    });
    return ClusterModel;
});
