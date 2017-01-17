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

define(["jquery", "underscore", "backbone", "d3", "helper/jqgrid-helper", "helper/util", "config/app-config", "config/var-details"], function($, _, Backbone, D3, GridHelper, Util, AppConfig, VarDetails){
    var NodeTable = {
        nodeTableIds: [],
        updateRowData: function(container, data, rowID, isError, prefix, viewPosition){

                var prefixedId = (prefix || '') + rowID;

                if(isError === false){
                     data = NodeTable.getNodeListData(data);
                }
                try{
                    if(!jQuery(container).getInd(prefixedId)){
                        if(data.viewPosition && data.viewPosition === "first")
                            jQuery(container).addRowData(rowID, data, "first");
                        else if(data.viewPosition && $("#" + (prefix || '') + data.viewPosition).length > 0 ){
                            jQuery(container).addRowData(rowID, data, "after", (prefix || '') + data.viewPosition);
                        } else{
                            jQuery(container).addRowData(rowID, data, "last");
                        }
                    }else{
                        jQuery(container).setRowData(prefixedId, data);
                    }
                }catch(e){
                    console.info(e.toString());
                }
               //NodeTable.nodeTableIds = GridHelper.maintainExpandedState(container, NodeTable.nodeTableIds);
               //$(container).trigger("reloadGrid");
        },
        nodePropsHtml: function(model, rowID) {
          var rowData = model.data;
          var tableName = 'node';
          var html = '<div style="width: 95%;" id="nodeExpanded_' + rowID + '" class="expandDynamic">'
          var value, varName;
          for(varName in VarDetails[tableName]){
              description = VarDetails[tableName][varName][0];
              formatType = VarDetails[tableName][varName][1];
              if(typeof rowData[varName] === 'undefined'  || rowData[varName] ==='N/A' || rowData[varName] === null){
                  value = 'N/A';
              }else if(rowData[varName] ==='N/E'){
                  value = 'N/E';
              }else if(formatType === false || rowData[varName] === 'n/s'){
                  value = rowData[varName];
              }else{
                if(varName === 'write_master' || varName ==='write_prole'){
                  value = rowData[varName];
                } else {
                  value = GridHelper.formatExpandRow(rowData[varName], formatType);
                }
              }
              html += '<div style="float: left; width: 210px; margin-right: 20px; border-bottom: 1px solid #f0f0f0" title="' + description + '">' +
                        '<span style="float: left">' +
                          varName +
                        '</span>' +
                        '<span style="float: right">' +
                          value + 
                        '</span>' +
                      '</div>';
          }

          html += '<div style="clear: both"></div> </div>';
          return html;
        },
        getNodeListData: function(json){
            var newData = json;
            try{
                newData["objects"] = Util.formatNumber(json["objects"]);
                newData["client_connections"] = Util.formatNumber(json["client_connections"]);

                //Checking if any node have build greater or equal to 3.7.0 then show Migrates incoming/outgoing %
                if(typeof window.AMCGLOBALS.pageSpecific.show_migrate_pct !== "undefined" && window.AMCGLOBALS.pageSpecific.show_migrate_pct == true){
                    $("#jqgh_nodeListTable_migrate_progress_recv").html("Migrates Incoming: Partitions Remaining");
                    if(typeof newData["migrate_incoming_remaining"] !== "undefined" && newData["migrate_incoming_remaining"] != "n/s"){
                        if(newData["migrate_incoming_remaining"] == "n/a"){
                            newData["migrate_progress_recv"] = "N/A";
                        } else {
                            newData["migrate_progress_recv"] = Util.formatNumber(json["migrate_incoming_remaining"]);
                        }
                    } else {
                        newData["migrate_progress_recv"] = "N/A";
                    }

                    $("#jqgh_nodeListTable_migrate_progress_send").html("Migrates Outgoing: Partitions Remaining");
                    if(typeof newData["migrate_outgoing_remaining"] !== "undefined" && newData["migrate_outgoing_remaining"] != "n/s"){
                        if(newData["migrate_outgoing_remaining"] == "n/a"){
                            newData["migrate_progress_send"] = "N/A";
                        } else {
                            newData["migrate_progress_send"] = Util.formatNumber(json["migrate_outgoing_remaining"]);
                        }
                    } else {
                        newData["migrate_progress_send"] = "N/A";
                    }
                } else {
                    $("#jqgh_nodeListTable_migrate_progress_recv").html("Migrates Incoming")
                    newData["migrate_progress_recv"] = Util.formatNumber(json["migrate_progress_recv"]);

                    $("#jqgh_nodeListTable_migrate_progress_send").html("Migrates Outgoing")
                    newData["migrate_progress_send"] = Util.formatNumber(json["migrate_progress_send"]);
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
                var address = json['address'];
                newData = AppConfig.blankNodeListData(address, 'N/A');
                console.info(e.toString());
            }
            return newData;
        },
        initNodeGrid: function(container, pieConfig, collection, subGridHtml){
            var containerWidth = $(container).parent().width();
			var prefix = AppConfig.node.nodeTablePrefix;
            var timeoutHandle = null;
            var grid = $(container).jqGrid({
					idPrefix : prefix,
                    datatype:'local',
                    hidegrid: false,
                    colNames: AppConfig.nodeColumnNames,
                    colModel: AppConfig.nodeListColumn,
                    height:'auto',
                    loadui : 'disable',
                    loadonce:true,
                    subGrid: true,
                    headertitles : true,
                    sortname: "address",
                    sortorder: "asc",
                    width:containerWidth,
                    subGridRowExpanded: function(subgrid_id, row_id) {
                        var subGridEl = $("#" + subgrid_id);
                        subGridEl.parent().attr("colspan", (+subGridEl.parent().attr("colspan") + 1) );
                        var cellContainer = container+' tr#'+row_id+' td:nth-child('+(3)+') .expand-details' ;
						var modelId = +row_id.substr(prefix.length);
                        $(cellContainer).html('Hide Details');
                        $(cellContainer).prop('title', 'Click to collapse the row');
						var model = collection.findWhere({"row_id": modelId});
                        model.expanded = true;
                        var tableHtmlStr = "";
                        if(typeof(subGridHtml) === 'function') {
                          tableHtmlStr = subGridHtml(model, row_id);
                        } else {
                          tableHtmlStr = GridHelper.create2LevelTable("node","nodeExpanded_"+row_id,"expandDynamic",model.data);
                        }
                        subGridEl.html(tableHtmlStr).slideDown(100);
                    },
                    subGridRowColapsed: function(subgrid_id, row_id) {
                        var cellContainer = container+' tr#'+row_id+' td:nth-child('+(3)+') .expand-details' ;
						var modelId = +row_id.substr(prefix.length);
						var model = collection.findWhere({"row_id":modelId});
                        $(cellContainer).html('View Details');
                        $(cellContainer).prop('title', 'Click to expand the row');
                        model.expanded = false;
                    },
                    gridComplete: function () {
                        return;
                    },
                    onSelectRow: function(row_id){
                        $(container).jqGrid ('toggleSubGridRow', row_id);
                    },
                    loadComplete: function () {
                        $(container).jqGrid('hideCol', 'subgrid');
                    }
                });
            GridHelper.columnHeaderTitleFormatter(grid, AppConfig.nodeListColumn );
			function handler() {
				if(window.AMCGLOBALS.activePage !== "dashboard"){
					window.removeEventListener("resize", handler,true);
					return;
				}
				$(container).setGridWidth(Math.max(window.innerWidth * 0.95, 750));
			}
			window.addEventListener('resize', handler, true);
            return grid;
        }

    };

    return NodeTable;
});
