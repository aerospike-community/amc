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
    var XdrTable = {
        nodeTableIds: [],
        updateRowData: function(container, data, rowID){
                data = XdrTable.getNodeListData(data);
                try{
                    if(!jQuery(container).getInd(rowID)){
                        jQuery(container).addRowData(rowID, data);
                    }else{
                        jQuery(container).setRowData(rowID, data);
                    }
                    var grid = jQuery(container);
                    this.setRowTitle(grid);
                }catch(e){
                    console.info(e.toString());
                }
               //NodeTable.nodeTableIds = GridHelper.maintainExpandedState(container, NodeTable.nodeTableIds);
               //$(container).trigger("reloadGrid");
        },
        setRowTitle : function(grid){
            var rowIds = grid.jqGrid('getDataIDs');
            for (var i=0; i < rowIds.length; i++) {
                var rowId=rowIds[i];
                var rowData = grid.jqGrid('getRowData',rowId);
                if(rowData["xdr_status"] === "off" && rowData["esmt-bytes-shipped"] === "N/A"){
                    var columnList = AppConfig.xdrListColumn;
                    for(var j=2; j < columnList.length;j++){
                        colName = columnList[j].name;
                        grid.jqGrid('setCell', rowId, colName,'','', {'title': AppConfig.xdr.xdrNotConfiguredMsg + window.AMCGLOBALS.persistent.xdrPort});
                    }
                }
            }
        },
        getNodeListData: function(data){
			data['esmt-bytes-shipped'] = GridHelper.formatExpandRow(data['esmt-bytes-shipped'], "size");
            data['xdr_timelag'] = GridHelper.formatExpandRow(data['xdr_timelag'], "sec");
            data['stat_recs_outstanding'] = GridHelper.formatExpandRow(data['stat_recs_outstanding'], "number");
            data['stat_recs_shipped'] = GridHelper.formatExpandRow(data['stat_recs_shipped'], "number");
            data['stat_recs_relogged'] = GridHelper.formatExpandRow(data['stat_recs_relogged'], "number");
            data['cur_throughput'] = GridHelper.formatExpandRow(data['cur_throughput'], "number");
            return data;
        },
        initNodeGrid: function(container, pieConfig, collection){
            var containerWidth = window.innerWidth * 0.95;
            //$(container).jqGrid('GridDestroy');
            var grid = jQuery(container).jqGrid({
                    datatype:'local',
                    //data: nodeListData,
                    hidegrid: false,
                    colNames: AppConfig.xdrColumnNames,
                    colModel: AppConfig.xdrListColumn,
                    height:'auto',
                    loadui : 'disable',
                    loadonce:true,
                    //ExpandColClick: true,
                    subGrid: false,
                    headertitles : true,
                    //sortname: "address",
                    //sortorder: "asc",
                    //cmTemplate: {sortable:false},
                    width:containerWidth,
                    loadComplete: function () {
                        $(container).jqGrid('hideCol', 'subgrid');
                    }
                });
            GridHelper.columnHeaderTitleFormatter(grid, AppConfig.xdrListColumn );
			window.addEventListener('resize', function() {
				$(container).setGridWidth(Math.max(window.innerWidth * 0.95, 750));
			}, true);
            return grid;
        }

    };

    return XdrTable;
});
