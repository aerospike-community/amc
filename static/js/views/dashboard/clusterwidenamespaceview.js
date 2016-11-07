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

define(["jquery", "underscore", "backbone", "helper/namespace-clusterwide-table", "helper/jqgrid-helper", "config/view-config", "config/app-config" ], function($, _, Backbone, NamespaceTable, GridHelper, ViewConfig, AppConfig){
    
    var NamespaceView = Backbone.View.extend({
        isInitialized: false,
        writesMonitorInitialized : false,
        initialize: function(){
            this.el = this.options.el;
            this.pieCharts = {
				disk : null,
				memory : null,
				minAvail : null
			};

            this.initEventHandlers();
        },

        initEventHandlers: function(){
            var that = this;

            this.model.on("remove", function(){
                var rowID = that.model.get("row_id");
                if(rowID != null){
                    var rowNextSibiling = $("#" + AppConfig.namespace.namespaceClusterWideTablePrefix + rowID).next();
                    if(rowNextSibiling.hasClass("ui-subgrid"))
                        rowNextSibiling.remove();                   
                    $(AppConfig.namespace.namespaceClusterWideTableDiv).delRowData(AppConfig.namespace.namespaceClusterWideTablePrefix + rowID);
                }
            });
        },

        render: function(model, newData){
            Util.checkVisibilityAndCall(this, function(){
                model.NE = false;
                model.data = newData;
                var rowID = model.attributes['row_id'];
                var nodeStatus = model.data['node_status'];
                if(typeof nodeStatus !== 'undefined' && nodeStatus=== 'off' ){
                    model.data = AppConfig.blankNamespaceListData(model.name, '', 'N/A');
                    NamespaceTable.updateRowData(model.tableContainer, model.data, rowID, true, AppConfig.namespace.namespaceClusterWideTablePrefix);
                    this.formatRowData(model, AppConfig.namespace.namespaceClusterWideTablePrefix + rowID, true);
                }else{
                    NamespaceTable.updateRowData(model.tableContainer, model.data, rowID, false, AppConfig.namespace.namespaceClusterWideTablePrefix);
                    this.formatRowData(model, AppConfig.namespace.namespaceClusterWideTablePrefix + rowID, false);
                }
            });            
        },
        renderNetworkError: function(model){
            Util.checkVisibilityAndCall(this, function(){
                try{
                    model.NE = true;
                    var rowID = model.attributes['row_id'];
                    model.data = AppConfig.blankNamespaceListData(model.name, '','N/E');
                    model.data['node_status'] = 'off';
                    NamespaceTable.updateRowData(model.tableContainer, model.data, rowID, true, AppConfig.namespace.namespaceClusterWideTablePrefix);
                    this.formatRowData(model, AppConfig.namespace.namespaceClusterWideTablePrefix + rowID, true);

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
                    model.data = AppConfig.blankNamespaceListData(model.name, '','--');
                    model.data['node_status'] = 'none';
                    NamespaceTable.updateRowData(model.tableContainer, model.data, rowID, true, AppConfig.namespace.namespaceClusterWideTablePrefix);
                    this.formatRowData(model, AppConfig.namespace.namespaceClusterWideTablePrefix + rowID, true);

                }catch(e){
                    console.info(e.toString());
                }
            });
        },
        formatRowData: function(model, rowID, isError){
                var namespaceName = model.data['name'];
                var diskArr = model.data['disk-arr'];
                var memoryArr = model.data['memory-arr'];
                var minAvail = ["N/A", "N/A"];
                var minAvailTitle = "N/A";
                if(isError === false){
                    if(typeof model.data['least_available_pct'] !== 'undefined' && model.data['least_available_pct'].value !== null ){
                        minAvail[0] = 100 - model.data['least_available_pct'].value;
                        minAvail[1] = model.data['least_available_pct'].value;
                        minAvailTitle = "Minimum Available " + model.data['least_available_pct'].value + "% on node [ " + model.data['least_available_pct'].node + " ]";
                    }

                    this.pieCharts.minAvail = GridHelper.jqCustomPieFormatter(this.pieCharts.minAvail, model.tableContainer, rowID, ViewConfig.tablePieConfig, minAvail, 6, true);

                    var container = $(model.tableContainer+' tr#'+rowID+' td:nth-child('+(6+1)+')');
                    container.find('div.table_pie_chart_legend.used').text("").attr("title","");
                    container.find('div.table_pie_chart_legend.free').text(minAvail[1] + "%").attr("title", minAvailTitle);
                    container.children("div:first").attr("title", minAvailTitle);

                    this.pieCharts.disk = GridHelper.jqCustomPieFormatter(this.pieCharts.disk, model.tableContainer, rowID, ViewConfig.tablePieConfig, diskArr, 7);
                    this.pieCharts.memory = GridHelper.jqCustomPieFormatter(this.pieCharts.memory, model.tableContainer, rowID, ViewConfig.tablePieConfig, memoryArr, 8);
                }
                this.nameColumnFormatter(model, model.tableContainer, rowID, model.data.name, 1);
        },
        nameColumnFormatter: function(model, container, rowID, data, colIndex){
            var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;
            var nameClassName = '';
            var htmlStr = '<div class="'+nameClassName+'">'+data+'</div>';
            htmlStr += '<div class="expand-details" title="Click to view per node details of the namespace">Per-node Details</div>';
            $(cellContainer).html(htmlStr);
        }
    });
    
    
    return NamespaceView;
});



