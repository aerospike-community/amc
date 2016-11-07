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

define(["jquery", "underscore", "backbone", "d3", "helper/jqgrid-helper", "helper/util", "config/app-config"], function($, _, Backbone, D3, GridHelper, Util, AppConfig){
    var NamespaceTable = {   
        namespaceTableIds: [],
        updateRowData: function(container, data, rowID, isError, prefix){

					var prefixedId = (prefix || '') + rowID;

                    NamespaceTable.checkAndUpdateColvisibility(container, data);

                    if(typeof isError === 'undefined' || isError === false){
                        data = NamespaceTable.getNamespaceListData(data);
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
                    
//                        $("#"+rowID, container).css('display', '');
                    }catch(e){
                        console.info(e.toString());
                    }
        },
        checkAndUpdateColvisibility: function(container, data){
            var colModel = $(container).jqGrid('getGridParam','colModel');
            var triggerResize = false;

            if(typeof data["objects-num"] !== 'undefined' && data["objects-num"] !== "--" && data["objects-num"] !== "NaN" && colModel[2].hidden && data["objects-num"] !== "N/E"){
                jQuery(container).showCol("objects-num");
                triggerResize = true;
            }
            if(typeof data["master-objects"] !== "undefined" && data["master-objects"] !== "--" && data["master-objects"] !== "NaN" && colModel[3].hidden && data["objects-num"] !== "N/E"){
                jQuery(container).showCol("master-objects");
                triggerResize = true;
            }
            if(typeof data["prole-objects"] !== "undefined" && data["prole-objects"] !== "--" && data["prole-objects"] !== "NaN" && colModel[4].hidden && data["prole-objects"] !== "N/E"){
                jQuery(container).showCol("prole-objects");
                triggerResize = true;
            }

            if(triggerResize){
                document.dispatchEvent(new CustomEvent("resize"));
            }
        },
        getNamespaceListData: function(json){
                var newData = json;
                try{
                    newData["expired-objects-num"] = Util.formatNumber(json["expired-objects"]);
                    newData["evicted-objects-num"] = Util.formatNumber(json["evicted-objects"]);
                    var stopWrites = json["stop-writes-pct"];
                    NamespaceTable.setBulletChartData('disk', newData, json["disk-pct"], 'free-pct-disk', 'high-water-disk-pct', stopWrites);
                    NamespaceTable.setBulletChartData('memory', newData, json["memory-pct"], 'free-pct-memory', 'high-water-memory-pct', stopWrites);
                    
                    newData['min-avail'] = "Minimum Available : N/A";
                    if(typeof json['least_available_pct'] !== 'undefined' && json['least_available_pct'] !== null){
                        newData['min-avail'] = "Minimum Available " + json['least_available_pct'] + "%";
                    }
                    
                    newData["memory-arr"] = NamespaceTable.getPieChartData(json['memory'], 'used-bytes-memory', 'total-bytes-memory');
                    newData["memory-arr-str"] = 'Total Memory : '+Util.bytesToSize(json['memory']['total-bytes-memory']);
                    newData["disk-arr"] = NamespaceTable.getPieChartData(json['disk'], 'used-bytes-disk', 'total-bytes-disk');
                    newData["disk-arr-str"] = 'Total Disk : '+Util.bytesToSize(json['disk']['total-bytes-disk']);
                    if(typeof json["objects"] !== 'undefined')
                        newData["objects-num"] = Util.formatNumber(Math.round(json["objects"]));

                }catch(e){
                    //var name = json.name;
                    //newData = AppConfig.blankNamespaceListData(name, 'N/A');
                    console.info(e.toString());
                }
            return newData;
        },
        initNamespaceGrid: function(container, collection){
            var containerWidth = window.innerWidth * 0.75;
			var prefix = window.AMCGLOBALS.pageSpecific.selectedNamespace + AppConfig.namespace.nodeWiseNamespaceTablePrefix;
            var grid = jQuery(container).jqGrid({
                    //data: namespaceListData,
                    idPrefix : prefix,
                    colNames: AppConfig.namespaceColumnNames,
                    colModel: AppConfig.namespaceListColumn,
                    datatype:'local',
                    loadonce:true,
                    height:'auto',
                    hidegrid: false,
                    ExpandColClick: true,
                    loadui : 'disable',
                    subGrid: true,
                    subGridOptions: { openicon: "ui-helper-hidden" },
                    headertitles : true,
                    width:containerWidth,
                    subGridRowExpanded: function(subgrid_id, row_id) {
                        var subGridEl = $("#" + subgrid_id);
                        subGridEl.parent().attr("colspan", (+subGridEl.parent().attr("colspan") + 1) );
                        var cellContainer = container+' tr#'+row_id+' td:nth-child('+(2)+') .expand-details' ;
						var modelRowId = row_id.substr(prefix.length);
						var model = collection.findWhere({row_id : modelRowId});
                        $(cellContainer).html('Hide Details');
                        $(cellContainer).prop('title', 'Click to collapse the row');
                        model.expanded = true;
                        
                        var tableHtmlStr = "";
                        tableHtmlStr = GridHelper.create2LevelTable("namespace","nodeExpanded_"+row_id,"expandDynamic",model["attributes"]);
                        subGridEl.html(tableHtmlStr).slideDown(100);
                        
                    },
                    subGridRowColapsed: function(subgrid_id, row_id) {
                        var cellContainer = container+' tr#'+row_id+' td:nth-child('+(2)+') .expand-details' ;
						var modelRowId = row_id.substr(prefix.length);
						var model = collection.findWhere({row_id : modelRowId});
                        $(cellContainer).html('View Details');
                        $(cellContainer).prop('title', 'Click to expand the row');
                        model.expanded = false;
                    },
                    gridComplete: function () {
						$(container).setGridWidth(Math.max((window.innerWidth > 950 ? (window.innerWidth * 0.90) : (window.innerWidth * 0.85)) , 700));
                        for (var j = 0; j < NamespaceTable.namespaceTableIds.length; j = j + 1) {
                            $(container).jqGrid('expandSubGridRow', NamespaceTable.namespaceTableIds[j]);
                        }
                    },
                    onSelectRow: function(rowId){ 
                        //$(container).expandSubGridRow(rowId);
                        $(container).jqGrid ('toggleSubGridRow', rowId);
                    },
                    loadComplete: function () {
                        jQuery(container).hideCol(["objects-num", "master-objects", "prole-objects", "subgrid"]);
                       // GridHelper.jqPieFormatter(container, pieConfig,7);
                    }
                });
            GridHelper.columnHeaderTitleFormatter(grid, AppConfig.namespaceListColumn );
			function handler() {
				if(window.AMCGLOBALS.activePage !== "dashboard"){
					window.removeEventListener("resize", handler,true);
					return;
				}
				$(container).setGridWidth(Math.max((window.innerWidth > 950 ? (window.innerWidth * 0.90) : (window.innerWidth * 0.85)) , 700));
			}
			window.addEventListener('resize', handler, true);
            return grid;
        },
        setBulletChartData: function(propName, newData, data, freePctVarName, hwmVarName, stopWrites){
            var bulletChartData;
            
            var usedDiskPct = (!isNaN(data[freePctVarName]) ? (100 - data[freePctVarName]) : data[freePctVarName]);
            var hwmDisk = data[hwmVarName];
            usedDiskPct += '';
            if(isNaN(usedDiskPct)){
                bulletChartData = 'N/A';
            }else{
                if(propName === 'disk'){
                    bulletChartData = usedDiskPct+'% , '+hwmDisk+ '%'; 
                } else {
                    bulletChartData = usedDiskPct+'% , '+hwmDisk+'% , '+stopWrites+'%';
                }
            }
            
            var tickLabelData =[
                            //[20,'LWM'],
                            [hwmDisk,'HWM'],
                            [stopWrites,'SW']
                            //[70,'']
           ];
           var usedData = [usedDiskPct];
           
            if(propName === 'disk'){
                newData['disk-pct-bullet'] = bulletChartData;
                newData['disk-tick-labels'] = tickLabelData;
                newData['disk-used-pct'] = usedData;
                 
            }else if(propName === 'memory'){
                newData["memory-pct-bullet"] = bulletChartData;
                newData['memory-tick-labels'] = tickLabelData;
                newData['memory-used-pct'] = usedData;
            }
            
            return bulletChartData;

        },
        getPieChartData: function(data, usedVarName, totalVarName){

            var used = data[usedVarName];
            var total = data[totalVarName];
            var free = 0;
            if( total === "n/s" || total === 'n/a'){
                total = 0;
                used = 0;
            }else{
                free = total - used;
            }
            var pieChartData = [used, free];
            return pieChartData;
        }
               
    };
    
    return NamespaceTable;
});