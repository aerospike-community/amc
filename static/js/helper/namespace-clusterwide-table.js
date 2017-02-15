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

define(["jquery", "underscore", "backbone", "d3", "helper/jqgrid-helper", "helper/util", "config/app-config", "config/view-config", "helper/namespace-table"], function($, _, Backbone, D3, GridHelper, Util, AppConfig, ViewConfig, NamespaceTable){
        var NamespaceClusterWideTable = {
        updateRowData: function(container, data, rowID, isError, prefix){

                var prefixedID = (prefix || '') + rowID;

                NamespaceClusterWideTable.checkAndUpdateColvisibility(container, data);

                if(isError === false){
                    data = NamespaceClusterWideTable.getClusterWideNamespaceData(data);
                }
                if(!jQuery(container).getInd(prefixedID)){
                    if(data.viewPosition && data.viewPosition === "first")
                        jQuery(container).addRowData(rowID, data, "first");
                    else if(data.viewPosition && $("#" + (prefix || '') + data.viewPosition).length > 0 ){
                        jQuery(container).addRowData(rowID, data, "after", (prefix || '') + data.viewPosition);
                    } else{
                        jQuery(container).addRowData(rowID, data, "last");
                    }
                }else{
                    jQuery(container).setRowData(prefixedID, data);
                }
        },
        checkAndUpdateColvisibility: function(container, data){
            var colModel = $(container).jqGrid('getGridParam','colModel');
            var triggerResize = false;

            if(typeof data["objects"] !== 'undefined' && data["objects"] !== "--" && colModel[2].hidden && data["objects"] !== "N/E"){
                jQuery(container).showCol("objects");
                triggerResize = true;
            }
            if(typeof data["master-objects"] !== "undefined" && data["master-objects"] !== "--" && colModel[3].hidden && data["master-objects"] !== "N/E"){
                jQuery(container).showCol("master-objects");
                triggerResize = true;
            }
            if(typeof data["prole-objects"] !== "undefined" && data["prole-objects"] !== "--" && colModel[4].hidden && data["prole-objects"] !== "N/E"){
                jQuery(container).showCol("prole-objects");
                triggerResize = true;
            }

            if(triggerResize){
                document.dispatchEvent(new CustomEvent("resize"));
            }
        },
        getClusterWideNamespaceData: function(json){
            if(json['node_status'] === "off"){
                return json;
            }
            var newData = json;
            try{
                newData["objects"] = (typeof json["objects"] !== 'undefined') ? Util.formatNumber(json["objects"]) : "--";
                newData["master-objects"] = (typeof json["master-objects"] !== 'undefined') ? Util.formatNumber(json["master-objects"]) : "--";
                newData["prole-objects"] = (typeof json["prole-objects"] !== 'undefined') ? Util.formatNumber(json["prole-objects"]) : "--";

                newData["expired-objects"] = Util.formatNumber(json["expired-objects"]);
                newData["evicted-objects"] = Util.formatNumber(json["evicted-objects"]);
                newData["repl-factor"] = json["repl-factor"];

                if(newData["repl-factor"] == null){
                    newData["repl-factor"] = "N/A";
                }

                newData['min-avail'] = "Minimum Available : N/A";
                if(typeof json['least_available_pct'] !== 'undefined' && json['least_available_pct'].value !== null){
                    newData['min-avail'] = "Minimum Available " + json['least_available_pct'].value + "% on node [ " + json['least_available_pct'].node + " ]"
                }
                var totalMemory = json["memory"]["total-bytes-memory"];
                var usedMemory = json["memory"]["used-bytes-memory"];
                var freeMemory = Math.max(0, totalMemory - usedMemory);
                var totalDisk = json["disk"]["total-bytes-disk"];
                var usedDisk = json["disk"]["used-bytes-disk"];
                var freeDisk = Math.max(0, totalDisk - usedDisk);
                newData["memory-arr-str"] = 'Total Memory : '+Util.bytesToSize(totalMemory);
                newData["disk-arr-str"] =  'Total Disk : '+Util.bytesToSize(totalDisk);

                newData["memory-arr"] = [usedMemory, freeMemory];
                newData["disk-arr"] =  [usedDisk, freeDisk];
            }catch(e){
                console.info(e);
            }
            return newData;
        },
        initClusterWideNamespaceGrid: function(container, collection){
            var containerWidth = window.innerWidth * 0.95;
            $(container).jqGrid('GridUnload');

            var grid = jQuery(container).jqGrid({
                    idPrefix : AppConfig.namespace.namespaceClusterWideTablePrefix,
                    colNames: AppConfig.namespaceClusterWideColumnNames,
                    colModel: AppConfig.namespaceClusterWideListColumn,
                    datatype:'local',
                    loadonce:true,
                    height:'auto',
                    hidegrid: false,
                    loadui : 'disable',
                    subGrid: true,
                    headertitles : true,
                    width:containerWidth,
                    onSelectRow: function(row_id){
                        jQuery(container).toggleSubGridRow(row_id);
                    },
                    subGridRowExpanded: function(subgrid_id, row_id) {
                        var subGridEl = $("#" + subgrid_id);
                        subGridEl.parent().attr("colspan", (+subGridEl.parent().attr("colspan") + 1) );
                        $("#" + row_id + " td:first").attr("title", "Hide Per node namespace details");
                        function showGrid(){
                            var subgrid_table_id;
                            window.AMCGLOBALS.pageSpecific.selectedNamespace = NamespaceClusterWideTable.getNamespaceName(container, row_id);
                            subgrid_table_id = subgrid_id+"_t";
                            AppConfig.namespace.namespaceTableDiv = "#" + subgrid_id+"_t";
                            subGridEl.html("<table id='"+subgrid_table_id+"' class='scroll'></table>");
                            NamespaceClusterWideTable.displayClusterWideNamespaceView(collection, subgrid_id);
                            subGridEl.slideDown(100, function(event){
                                var grid = $(this);
                                var gridVerticalOffset = grid.offset().top;
                                var gridHeight = grid.height();
                                var verticalDelta = gridVerticalOffset - window.scrollY;
                                if(verticalDelta + gridHeight + 140 > window.innerHeight){
                                    var scrollByOffset = window.scrollY + gridHeight + verticalDelta - window.innerHeight + 150;
                                    window.scrollTo(0, scrollByOffset);
                                }
                            });
                            $("#allStatsLinkNamespaces").html("View all stats for '" + window.AMCGLOBALS.pageSpecific.selectedNamespace + "' ");
                            Util.updateAllStatsLinks();

                        }

                        if(window.AMCGLOBALS.pageSpecific.selectedNamespace != null){
                            var rowID = null;
                            collection.each(function(model, index){
                                if(model.attributes.name === window.AMCGLOBALS.pageSpecific.selectedNamespace)
                                    rowID = AppConfig.namespace.namespaceClusterWideTablePrefix + model.attributes.row_id;
                            });
                            if(rowID !== row_id)
                                showGrid();
                        } else{
                            showGrid();
                        }
                    },
                    subGridRowColapsed: function(subgrid_id, row_id) {
                        $("#" + row_id + " td:first").attr("title", "Show Per node namespace details");
                        $("#allStatsLinkNamespaces").html("View all namespace stats");
                        jQuery("#"+subgrid_id).slideUp(100);
                        NamespaceClusterWideTable.closeAndClearNodeWiseView(collection, subgrid_id);
                        window.AMCGLOBALS.pageSpecific.selectedNamespace = null;
                        Util.updateAllStatsLinks();
                    },
                    afterInsertRow: function(row_id, rowdata, rowelem){
                        $("#" + row_id + " td:first").attr("title", "Show Per node namespace details");
                    }
                });
            GridHelper.columnHeaderTitleFormatter(grid, AppConfig.namespaceClusterWideListColumn );
            jQuery(container).hideCol(["objects", "master-objects", "prole-objects"]);
            window.addEventListener('resize', function() {
                $(container).setGridWidth(Math.max(window.innerWidth * 0.95, 750));
            }, true);
            return grid;
        },
//         initSelectedNamespaceGrid: function(container){
//             $(container).jqGrid('GridUnload');

//             var containerWidth = window.innerWidth * 0.935;
//             var grid = jQuery(container).jqGrid({
//                     colNames: AppConfig.namespaceClusterWideColumnNames,
//                     colModel: AppConfig.namespaceClusterWideListColumn,
//                     datatype:'local',
//                     loadonce:true,
//                     height:'auto',
//                     hidegrid: false,
//                     loadui : 'disable',
//                     subGrid: false,
//                     headertitles : true,
//                     width:containerWidth
//                 });
//             GridHelper.columnHeaderTitleFormatter(grid, AppConfig.namespaceClusterWideListColumn );
//             jQuery(container).hideCol(["objects", "master-objects", "prole-objects"]);
// 			function handler() {
// 				if(window.AMCGLOBALS.activePage !== "dashboard"){
// 					window.removeEventListener("resize", handler,true);
// 					return;
// 				}
// 				$(container).setGridWidth(Math.max(window.innerWidth * 0.935, 750));
// 			}
// 			window.addEventListener('resize', handler, true);
//             return grid;
//         },
        displayClusterWideNamespaceView : function(collection, subgrid_id){
            var namespace = $("#" + subgrid_id).parent().parent().prev().find("td:nth-child(2)").text();
            if(namespace.indexOf("Per-node") !== -1){
                namespace = namespace.substr(0, namespace.indexOf("Per-node"));
            }

            var selectedModel = collection.get(namespace);

            selectedModel && selectedModel.initNamespaceGridCollection("#" + subgrid_id + "_t");

            Util.updateAllStatsLinks();
            $('#allStatsLinkSpecificNamespace').html('');
            $('#allStatsLinkSpecificNamespace').html("View all stats for '" + window.AMCGLOBALS.pageSpecific.selectedNamespace + "' ");

            setTimeout(function(){
                $('html, body').animate({ scrollTop: $(AppConfig.namespace.nodeWiseNamespaceContainer).offset().top }, 500);
            },AppConfig.retryDelayTime);
        },
        getNamespaceName: function(container, rowID){
            var rowData = jQuery(container).jqGrid('getRowData', rowID);
            var namespaceDivStr = rowData.name;
            if(namespaceDivStr.indexOf("div") !== -1){
                var first = namespaceDivStr.indexOf(">");
                namespaceDivStr = namespaceDivStr.slice(first);
                var second = namespaceDivStr.indexOf("<");
                return namespaceDivStr.slice(1,second);
            } else{
                return namespaceDivStr;
            }
        },
//         deleteAndDestroyAllModels: function(collection, modelsToBeDeleted, polOptions){
//             for(var modelI in modelsToBeDeleted){
//                 var model = modelsToBeDeleted[modelI];
//                 var tempPoller = Util.initPoller(model, polOptions);
//                 tempPoller.stop();
//                 window.clearTimeout(model.setTimeOut);
//                 Util.destroyModel(model);
//                 collection.remove(model);
//             }
//             collection = null;
//         },
        closeAndClearNodeWiseView: function(collection, subgrid_id){
            var namespace = $("#" + subgrid_id).parent().parent().prev().find("td:nth-child(2)").text();
            if(namespace.indexOf("Per-node") !== -1){
                namespace = namespace.substr(0, namespace.indexOf("Per-node"));
            }

			var models = collection.models;
			var openNamespace = $(namespace).text();
			var selectedModel;
			for(var modelI in models){
				model = models[modelI];
				if(namespace === model.name){
					selectedModel = model;
					break;
				}
			}

			$("#" + subgrid_id + "_t").jqGrid('GridUnload');

			selectedModel.deleteAndDestroyNamespaceCollection(selectedModel.namespaceCollection);
			selectedModel.namespaceCollection = null;
			selectedModel.isNamespaceSelected = false;

			window.AMCGLOBALS.pageSpecific.selectedNamespace = null;
        },

//         initNamespaceGrid: function(container, models){
//             var containerWidth = $("#mainContainer").parent().width() * 0.8;
//             var grid = jQuery(container).jqGrid({
//                     colNames: AppConfig.namespaceClusterWideColumnNames,
//                     colModel: AppConfig.namespaceClusterWideListColumn,
//                     datatype:'local',
//                     loadonce:true,
//                     height:'auto',
//                     hidegrid: false,
//                     loadui : 'disable',
//                     subGrid: false,
//                     headertitles : true,
//                     width:containerWidth
//                 });
//             GridHelper.columnHeaderTitleFormatter(grid, AppConfig.namespaceClusterWideListColumn );
//             jQuery(container).hideCol(["objects", "master-objects", "prole-objects"]);
//             return grid;
//         },
    };
    return NamespaceClusterWideTable;
});
