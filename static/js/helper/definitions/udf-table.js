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
                }catch(e){
                    console.info(e.toString());
                }
               //NodeTable.nodeTableIds = GridHelper.maintainExpandedState(container, NodeTable.nodeTableIds);
               //$(container).trigger("reloadGrid");
        },
        getNodeListData: function(data){
            data['esmt-bytes-shipped'] = GridHelper.formatExpandRow(data['esmt-bytes-shipped'], "size");
            data['timediff_lastship_cur_secs'] = GridHelper.formatExpandRow(data['timediff_lastship_cur_secs'], "sec");
            data['xdr_timelag'] = GridHelper.formatExpandRow(data['xdr_timelag'], "sec");
            data['stat_recs_outstanding'] = GridHelper.formatExpandRow(data['stat_recs_outstanding'], "number");
            data['stat_recs_shipped'] = GridHelper.formatExpandRow(data['stat_recs_shipped'], "number");
            data['stat_recs_relogged'] = GridHelper.formatExpandRow(data['stat_recs_relogged'], "number");
            data['cur_throughput'] = GridHelper.formatExpandRow(data['cur_throughput'], "number");
            return data;
        },
        initNodeGrid: function(container, pieConfig, models){
            //$(container).jqGrid('GridDestroy');
            var containerWidth = Math.max(window.innerWidth * 0.93, 750);
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
			function handler() {
				if(window.AMCGLOBALS.activePage !== "definitions"){
					window.removeEventListener("resize", handler,true);
					return;
				}
				$(container.selector).setGridWidth(Math.max(window.innerWidth * 0.93, 750));
			}
			window.addEventListener('resize', handler, true);
            return grid;
        }

    };

    return XdrTable;
});
