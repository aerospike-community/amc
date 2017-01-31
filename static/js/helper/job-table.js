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
    var JobTable = {   
        nodeTableIds: [],

        updatePages: function(container, current, total) {
          var text = 'Page ' + current;
          if(total) {
            text += '/' + total;
          }
          $(container + ' .page-index').html(text);
        },

        createOrUpdateRow: function(container, data, rowID, model, isError){
            data = JobTable.getNodeListData(model, rowID, data, isError);
            try{
                if(JobTable.getRowIndex(container, rowID) === '-1'){
                    data.expanded = false;window.counterI = 0;
                    jQuery(container).addRowData(rowID, data);
                    jQuery(container).trigger("reloadGrid",[{page:1}]);
                    
                }
            }catch(e){
                console.info(e.toString());
            }
        },

        updateRow: function(container, data, rowID){
            try{
                    jQuery(container).setRowData(rowID, data);
            }catch(e){
                console.info(e.toString());
            }
            
        },
        getRowIndex: function(container, rowID){
            var myData = jQuery(container).jqGrid('getGridParam','data');
            var isPresent = false;
            for(var rowI in myData){
                var rowData = myData[rowI];
                if(rowID === rowData.id){
                    isPresent = true;
                    break;
                }
            }
            if(!isPresent){
                rowI = '-1';
            }
            return  rowI;
        },
        getNodeListData: function(model, rowID, data, isError){
            var modifiedData = data;
            if(isError){
                modifiedData["address"] = JobTable.statusInAddressHtmlStr(model.subGridEnabled[rowID], data["address"], 'red-address-text');
                return modifiedData;
            }
            var versionCheck = Util.versionCompare(data.build,"3.6.0");
            modifiedData["net_io_bytes_formatted"] = versionCheck >= 0 ? Util.bytesToSize(data["net-io-bytes"]) : Util.bytesToSize(data["net_io_bytes"]);
            modifiedData["run_time"] = versionCheck >= 0 ? Util.msecToTime(data["run-time"]) : Util.msecToTime(data["run_time"]) ;
            modifiedData["mem_arr"] = [versionCheck >= 0 ? data['mem-usage'] : data['mem_usage'], (data.node['memory']['total-bytes-memory']-(versionCheck >= 0 ? data['mem-usage'] : data['mem_usage']))];
            modifiedData["address"] = JobTable.statusInAddressHtmlStr(model.subGridEnabled[rowID], data["address"], 'green-address-text');
            
            return modifiedData;
        },
        statusInAddressHtmlStr : function(expanded, data, AddressClassName){
            var htmlStr ='';
            htmlStr += '<div class="'+AddressClassName+'">'+data+'</div>';
//            window.console.info(expanded);
            if(expanded === true){
                htmlStr += '<div class="expand-details" title="Click to collapse the row">Hide Details</div>';
            }else{
                htmlStr += '<div class="expand-details" title="Click to expand the row">View Details</div>';
            }
            return htmlStr;
        },

        showLoader: function(container) {
          $('<div class="job-loader"/>').css({
            position: "absolute",
            width: "100%",
            height: "100%",
            left: 0,
            top: 0,
            zIndex: 1000000,  // to be on the safe side
            background: "url(/images/loading.gif) no-repeat 50% 50%"
          }).appendTo($(container));
        },

        stopLoader: function(container) {
          $(container + ' .job-loader').remove();
        },
                
        initNodeGrid: function(container, pieConfig, models, pager, rowNum, jobStatus){
		
			var parentContainer = $(container).parent();
		
            //$(container).jqGrid('GridDestroy');
            var containerWidth = (Math.max(window.innerWidth * 0.95, 750));
            var grid = jQuery(container).jqGrid({
                    datatype:'local',
                    search: false,
                    hidegrid: false,
                    colNames: AppConfig.jobsList,
                    colModel: AppConfig.jobsListColumn,
                    height: 'auto',
                    loadui : 'disable',
                    loadonce: true,
                    subGrid: true,
                    headertitles : true,
                    rowNum: rowNum,
                    rownumbers: false,
                    recordpos:'left',
                    pgbuttons:true,
                    toppager: false,
                    width:containerWidth,
                    subGridRowExpanded: function(subgrid_id, row_id) {
                        var cellContainer = container+' tr#'+row_id+' td:nth-child('+(2)+') .expand-details';
                        $(cellContainer).html('Hide Details');
            
                        var rowIdBreakPt = row_id.indexOf('_');
                        var modelI = row_id.substr(0, rowIdBreakPt); 
                        var jobID = row_id.slice(row_id.lastIndexOf('_')+1);
                        var data = _.find(models[modelI]['attributes']['jobs'], function(job) {
                          if(job.trid+'' === jobID) {
                            return true;
                          }
                        });
                        models[modelI].subGridEnabled[row_id] = true;
                        
                        var tableHtmlStr = "";
                        if(Util.versionCompare(data.build,"3.6.0") >= 0){
                            tableHtmlStr = GridHelper.create2LevelTable("job","nodeExpanded_"+row_id,"expandDynamic",data);
                        }else{
                            tableHtmlStr = GridHelper.create2LevelTable("jobOldVersion","nodeExpanded_"+row_id,"expandDynamic",data);
                        }
                        $("#" + subgrid_id).html(tableHtmlStr);
                       
                    },
                    subGridRowColapsed: function(subgrid_id, row_id) {
                        var cellContainer = container+' tr#'+row_id+' td:nth-child('+(2)+') .expand-details' ;
                        $(cellContainer).html('View Details');
                        var rowIdBreakPt = row_id.indexOf('_');
                        var modelI = row_id.substr(0, rowIdBreakPt); 
                        models[modelI].subGridEnabled[row_id] = false;
                    },
                    gridComplete: function () {
                        
                    },
                    onSelectRow: function(row_id){ 
                        $(container).jqGrid ('toggleSubGridRow', row_id);
                        
                    },
                    loadComplete: function () {
                        $(container).jqGrid('hideCol', 'subgrid');
                    },
                    onSortCol: function(index, columnIndex, sortOrder) {
                      var i, model;
                      for(i = 0; i < models.length; i++) {
                        model = models[i];
                        if(model.status === jobStatus) {
                          model.sortTable(index, sortOrder);
                        }
                      }
                      return 'stop';
                    },
                });
            GridHelper.columnHeaderTitleFormatter(grid, AppConfig.nodeListColumn );
            var searchOptions = {
                searchOnEnter: false,
                defaultSearch: "cn",
                stringResult: true,
                autosearch: true
            };
            $(pager).html('<div style="text-align: center; margin: 10px 10px 0 45%; height: 20px">' +
                            '<a class="page-prev" style="float: left;color: #337ab7;cursor: pointer;margin: 0 5px 0 5px;"> Prev </a>' +
                            '<span class="page-index" style="float: left"> Page 1 </span>' +
                            '<a class="page-next" style="float: left;color: #337ab7;cursor: pointer;margin: 0 5px 0 5px;"> Next </a>' +
                          '</div>');

            jQuery(container).jqGrid('filterToolbar', searchOptions);
            parentContainer.find(".ui-search-toolbar").hide();

			function handler() {
				if(window.AMCGLOBALS.activePage !== "jobs"){
					window.removeEventListener("resize", handler,true);
					return;
				}
				$(container).setGridWidth(Math.max(window.innerWidth * 0.95, 750));
			}
			window.addEventListener('resize', handler, true);
            return grid;
        },
        statusInAddress : function(model, rowID, address, AddressClassName){
            var htmlStr ='';
            htmlStr += '<div class="'+AddressClassName+'">'+address+'</div>';
            
             var isExpanded = model.expanded[rowID];
            if(!_.isUndefined(isExpanded)){
                if(isExpanded === true){
                    htmlStr += '<div class="expand-details" title="Click to collapse the row">Hide Details</div>';
                }else{
                    htmlStr += '<div class="expand-details" title="Click to expand the row">View Details</div>';
                }
            }else{
                 htmlStr += '<div class="expand-details" title="Click to expand the row">View Details</div>';
            }
            return htmlStr;
//            $(cellContainer).html(htmlStr);
        }  
        
    };
    
    return JobTable;
});
