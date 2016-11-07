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

define(["jquery", "underscore", "backbone", "helper/namespace-table", "helper/jqgrid-helper", "config/view-config", "config/app-config" ], function($, _, Backbone, NamespaceTable, GridHelper, ViewConfig, AppConfig){
    
    var NamespaceView = Backbone.View.extend({
        isInitialized: false,
        writesMonitorInitialized : false,
        initialize: function(){
            this.el = this.options.el;
            this.prefix = window.AMCGLOBALS.pageSpecific.selectedNamespace + AppConfig.namespace.nodeWiseNamespaceTablePrefix;
            this.pieCharts = {
				/*disk : null,
				memory : null*/
                minAvail : null
			};

            this.initEventHandlers();
        },

        initEventHandlers: function(){
            var that = this;

            this.model.on("remove", function(){
                var rowID = that.model.get("row_id");
                if(rowID != null){
                    var rowNextSibiling = $("#" +  AMCGLOBALS.pageSpecific.selectedNamespace + AppConfig.namespace.nodeWiseNamespaceTablePrefix + rowID).next();
                    if(rowNextSibiling.hasClass("ui-subgrid"))
                        rowNextSibiling.remove();                   
                    $(that.model.collection.containerDiv).delRowData(AMCGLOBALS.pageSpecific.selectedNamespace + AppConfig.namespace.nodeWiseNamespaceTablePrefix + rowID);
                }    
            });
        },

        render: function(model, newData){
            Util.checkVisibilityAndCall(this, function(){
                model.NE = false;
                model.data = newData;
                var rowID = model.attributes['row_id'];
                var nodeStatus = model.data['node_status'];
                model.data['node'] = model.address;
                if(nodeStatus==='off'){
                    model.data = AppConfig.blankNamespaceListData('', model.address,'N/A');
                    if(newData.hasOwnProperty("objects-num") || newData.hasOwnProperty("objects")){
                        model.data["objects-num"] = "N/A";
                    }else {
                        model.data["master-objects"] = model.data["prole-objects"] = "N/A";
                    }
                    model.data['node_status'] = 'off';
                    NamespaceTable.updateRowData(this.container, model.data, rowID, true, this.prefix);
                    this.formatRowData(model, this.prefix + rowID, model.address);
                }else{
                    NamespaceTable.updateRowData(this.container, model.data, rowID, false, this.prefix);
                    this.formatRowData(model, this.prefix + rowID, model.address);
                }
            });
        },
        renderNetworkError: function(model){
            Util.checkVisibilityAndCall(this, function(){
                try{
                    model.NE = true;
                    var rowID = model.attributes['row_id'];
                    model.data = AppConfig.blankNamespaceListData('', model.address, 'N/E');
                    model.data['node_status'] = 'off';
                    NamespaceTable.updateRowData(this.container, model.data, rowID, true, this.prefix);
                    this.formatRowData(model, this.prefix + rowID, model.address);
                  
                }catch(e){
                    console.info(e.toString());
                }
            });
        },
        renderLoading: function(model){
            Util.checkVisibilityAndCall(this, function(){
                try{
                    model.NE = true;
                    var rowID = model.attributes['row_id'];
                    model.data = AppConfig.blankNamespaceListData('', model.address, '--');
                    model.data['node_status'] = 'none';
                    NamespaceTable.updateRowData(this.container, model.data, rowID, true, this.prefix);
                    this.formatRowData(model, this.prefix + rowID, model.address);
                  
                }catch(e){
                    console.info(e.toString());
                }
            });
        },
        formatRowData: function(model, rowID, address){
                var nodeStatus = model.data["node_status"];
                if(nodeStatus === 'on'){
                    var diskArr = model.data['disk-arr'];
                    var minAvail = ["N/A", "N/A"];
                    var minAvailTitle = "N/A";
                    var memoryArr = model.data['memory-arr'];
                    var diskTickLabels = model.data['disk-tick-labels'];
                    var diskUsedPct = model.data['disk-used-pct'];
                    var memoryTickLabels = model.data['memory-tick-labels'];
                    var memoryUsedPct = model.data['memory-used-pct'];
                    var availablePct = model.data["available_pct"];

                    var diskUsed = Util.bytesToSize(model.data.disk["total-bytes-disk"]);
                    var memoryUsed = Util.bytesToSize(model.data.memory["total-bytes-memory"]);

                    if(availablePct === "n/s"){
                        availablePct = "N/A";
                    }
                    if(typeof model.data['least_available_pct'] !== 'undefined' && model.data['least_available_pct'] !== null ){
                        minAvail[0] = 100 - model.data['least_available_pct'];
                        minAvail[1] = model.data['least_available_pct'];
                        minAvailTitle = "Minimum Available " + model.data['least_available_pct'] + "%";
                    }

                    //this.pieCharts.disk = GridHelper.jqCustomPieFormatter(this.pieCharts.disk, this.container, rowID, ViewConfig.tablePieConfig, diskArr, 7);
                    this.pieCharts.minAvail = GridHelper.jqCustomPieFormatter(this.pieCharts.minAvail, this.container, rowID, ViewConfig.tablePieConfig, minAvail, 6, true);
                    
                    var container = $("#namepaceClusterWideListTable"+ ' .ui-subgrid'+ ' tr#'+rowID+' td:nth-child('+(7)+')');
                    container.find('div.table_pie_chart_legend.used').text("").attr("title","");
                    container.find('div.table_pie_chart_legend.free').text(minAvail[1] + "%").attr("title", minAvailTitle);
                    container.children("div:first").attr("title", minAvailTitle);

                    //this.pieCharts.memory = GridHelper.jqCustomPieFormatter(this.pieCharts.memory, this.container, rowID, ViewConfig.tablePieConfig, memoryArr, 9);
                    
                    if(!isNaN(diskUsedPct))
                        GridHelper.jqCustomBulletChartFormatter(this.container, rowID, ViewConfig.tablePieConfig, diskTickLabels, diskUsedPct, availablePct, 7, "disk", diskUsed);
                        
                    if(!isNaN(memoryUsedPct))
                        GridHelper.jqCustomBulletChartFormatter(this.container, rowID, ViewConfig.tablePieConfig, memoryTickLabels, memoryUsedPct, "n/s", 8, "memory", memoryUsed);

                }
                
                var textClassName = '';
                if(nodeStatus === "on"){
                    textClassName = 'green-text';
                }else if(nodeStatus === "off"){
                    textClassName = 'red-text';
                }else{
                    textClassName = 'grey-text';
                    
                }    
                this.statusInAddress(model, this.container, rowID, address, textClassName, 1);
            
                //this.nameColumnFormatter(model, this.container, rowID, address, 1);
                
                if(model.expanded === true){
                    var expandContainer = this.container.substr(1)+'_'+rowID;
                    var tableHtmlStr = GridHelper.create2LevelTable("namespace","nodeExpanded_"+rowID, "expandDynamic",model.data);
                    $("#" + expandContainer).html(tableHtmlStr); 
                }
            
        },
        nameColumnFormatter: function(model, container, rowID, nodeAddr, colIndex){
            var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;
            var nameClassName = '';
            
            var htmlStr = '<div class="'+nameClassName+'">'+nodeAddr+'</div>';
            if(model.expanded === true){
                htmlStr += '<div class="expand-details" title="Click to collapse the row">Hide Details</div>';
            }else{
                htmlStr += '<div class="expand-details" title="Click to expand the row">View Details</div>';
            }
            $(cellContainer).html(htmlStr);
        },
        statusInAddress : function(model, container, rowID, data, AddressClassName, colIndex){
            var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;
            var htmlStr ='';
            htmlStr += '<div class="'+AddressClassName+'">'+data+'</div>';
            if(model.expanded === true){
                htmlStr += '<div class="expand-details" title="Click to collapse the row">Hide Details</div>';
            }else{
                htmlStr += '<div class="expand-details" title="Click to expand the row">View Details</div>';
            }
            $(cellContainer).html(htmlStr);
        }  
    });
    
    
    return NamespaceView;
});



