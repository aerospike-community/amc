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
    var StatTable = {   
        updateRowData: function(container, statList, address, modelData, errorStr){
			var that = this;
            try{
                var gridData = $(container).jqGrid('getGridParam','data');
                if(typeof errorStr === 'undefined' || errorStr === 'all' || errorStr ==='updated'){
                    this.checkAndAddStats(container, modelData, statList, gridData, function(){
						that.updateColumnClasses(container, address, 'red-text', 'green-text');
						that.updateGridColumnDataSucc(gridData, address, modelData);
                        
                        if(typeof errorStr === 'undefined' || errorStr === 'all'){
                            $(container).jqGrid('setGridParam',{data: gridData}).trigger('reloadGrid');
                        } else {
                            
                            var rowIDS = $(container).jqGrid('getDataIDs');
                                for (var i=0;i<rowIDS.length;i++) {
                                	try{
                                        var rowID = rowIDS[i];
                                        var oldRowData = jQuery(container).jqGrid ('getRowData', rowID);
                                        
                                        var columnData = oldRowData[address];
                                        
                                        if(columnData.indexOf("<span") !== -1){
                                            columnData = columnData.substring(columnData.indexOf(">")+1,columnData.indexOf("</span>"));
                                        }
           
                                        if(columnData == modelData[rowID].toString()){
                                            $(container).setCell(rowID,address, modelData[rowID],{'font-weight': 'normal','color': 'black'});
                                        } else {
                                             $(container).setCell(rowID,address, "<span style='background-color:rgba(27, 91, 105, 0.84);padding:3px;padding-left:5px;padding-right:5px;'>"+modelData[rowID]+"</span>",{'font-weight': 'bold','color': '#fffff'});
                                       }
                                        
                                    }catch(e){
                                        console.log(e);
                                    } 
                             }    
                            
                            
                        }
                  });
                }else if(errorStr === 'Node Down'){
                    this.updateColumnClasses(container, address, 'green-text', 'red-text');
                    this.updateGridColumnDataErr(gridData, address, 'N/A');
                    that.updateErrorRowData(container,address,'N/A');
                }else if(errorStr === 'N/E'){
                    this.updateColumnClasses(container, address, 'green-text', 'red-text');
                    this.updateGridColumnDataErr(gridData, address, errorStr);
                    that.updateErrorRowData(container,address,errorStr);
                }else{//N/A
                    this.updateColumnClasses(container, address, 'red-text', 'green-text');
                    this.updateGridColumnDataErr(gridData, address, errorStr);
                    that.updateErrorRowData(container,address,errorStr);
                }
                var grid = jQuery(container);
                that.setRowTitle(grid);
            }catch(e){
                console.info(e);
            }   
        },
        setRowTitle : function(grid){
            if(window.AMCGLOBALS.persistent.showAttributesFor === "xdr"){
                var rowIds = grid.jqGrid('getDataIDs');
                for (var i=0; i < rowIds.length; i++) {
                    var rowId=rowIds[i];
                    var rowData = grid.jqGrid('getRowData',rowId);
                    for(var node in rowData){
                        if(rowData[node] == "N/A"){
                            colName = node;
                            grid.jqGrid('setCell', rowId, colName,'','', {'title': AppConfig.xdr.xdrNotConfiguredMsg + window.AMCGLOBALS.persistent.xdrPort});
                        }
                    }
                }
            }
        },
        updateErrorRowData : function(container, address, errordata){
            var rowIDS = $(container).jqGrid('getDataIDs');
              for (var i=0;i<rowIDS.length;i++) {
                  try{
                      $(container).setCell(rowIDS[i],address, errordata);
                  }catch(e){
                      console.log(e);
                  } 
              } 
      },
        
        updateColumnClasses: function(container, address, classToRemove, classToAdd){
            
            //COLOR CODE NODE SELECTION
//            var idStr = "#checkbox-"+Util.removeDotAndColon(address);
//            $(idStr).removeClass(classToRemove);
//            $(idStr).addClass(classToAdd);

            //COLOR CODE COLUMN HEADERS
            if(classToAdd === 'green-text'){
                $(container).setLabel(address, '', {color:'#006600'});//classToAdd);
            
            }else{
                $(container).setLabel(address, '', {color:'#f11b1b'});//classToAdd);
            
            }
        },
        checkAndAddStats: function(container, modelData, statList, gridData, callback){
             
                var data = _.map(modelData, function(num, key){ return key; });
                var newStats = _.difference(data, statList);
				var missingStats = [];

				for(var i in newStats){
                    var gridLocalData = _.pluck(jQuery(container).jqGrid('getGridParam','data'), 'stat');

                    if( gridLocalData.indexOf(newStats[i]) == -1)
						missingStats.push(newStats[i]);
						statList[statList.length] = newStats[i];
				}				

				function setData(stats, index){
					for(var i = index; i < index + 10 && i < stats.length; i++){
						var data = {};
						data.stat = stats[i];
						jQuery(container).addRowData(stats[i], data);
					}
					
					index = index + 10;
					
					if(index < stats.length){
						setTimeout(function(){
								setData(stats, index)
							}, 100);
					}
					callback();
				}

				setData(missingStats, 0);
        },
        updateGridColumnDataSucc: function(gridData, address, data){
            for(var i in gridData){
//                var statName = AppConfig.nodeStatsList[i];
                var statName = gridData[i]['stat'];
                
                if(typeof data[statName] === 'undefined'){
//                    console.info(statName);
                    data[statName] = 'N/A';
                }
                gridData[i][address] = data[statName];
            }
        },
        updateGridColumnDataErr: function(gridData, address, errorStr){
            for(var i in gridData){
                    gridData[i][address] = errorStr;
            }
        },
        initNodeGridLocalData: function(container, columnNames, columnModel, localData){
//            $('#nodeStatListGrid').hide();
            var containerWidth = window.innerWidth * 0.95;
            var grid = jQuery(container).jqGrid({
                    datatype:'local',
                    data: localData,
                    hidegrid: false,
                    colNames: columnNames,
                    colModel: columnModel,
                    height:'auto',
                    loadui : 'disable',
                    loadonce: true,
                    shrinkToFit: false,
                    subGrid: false,
                    headertitles : true,
                    rowNum: 10,
                    rowList:[10,20,50,100,200,300],
                    sortname: "stat",
                    sortorder: "asc", 
                    rownumbers: false,
                    pager: '#pager1',
                    pagerpos:'center',
                    recordpos:'left',
                    pgbuttons:true,
                    toppager: false,
                    width:containerWidth,
                    gridview: true,
                    loadComplete: function() {
						
                        var rowIDS = $(container).jqGrid('getDataIDs');
                        //var totalDetailsFound = 0;
                        for (var i=0;i<rowIDS.length;i++) {
                            try{
                                var rowID = rowIDS[i];
                                var statCol = $('.frozen-bdiv').find('#'+rowID+' > td:eq('+1+')');
                                var details = VarDetails.allStats[rowID];
                                if(typeof details !== 'undefined'){
                                    statCol.attr('title',details);
                                    //totalDetailsFound++;
                                }
                            }catch(e){
                                console.log(e);
                            } 
                        }
                        //console.info(totalDetailsFound+"/"+rowIDS.length);

                    },
                    onSelectRow: function(rowID, status, e){
                        var rowData = $(container).getRowData(rowID);
                        delete rowData['stat'];
                        for(var node in rowData){
                        	if(!_.contains(window.AMCGLOBALS.persistent.selectedNodes, node)){
                        		delete rowData[node];
                        	}
                        }
                        window.$(document).trigger("statClick", [rowID, rowData]);
                    }
            });
            this.colHeaderFormatter(container, columnModel);
            jQuery(container).jqGrid('setFrozenColumns');
            this.adjustFrozenColumn();
            
//            setTimeout(function(){
//                $('#nodeStatListGrid').slideDown(300);
//            },1000); 
			function handler() {
				if(window.AMCGLOBALS.activePage !== "statistics"){
					window.removeEventListener("resize", handler,true);
					return;
				}
				$(container).setGridWidth(Math.max(window.innerWidth * 0.95, 300));
			}
			window.addEventListener('resize', handler, true);
            return grid;
        },
        colHeaderFormatter :function(container, columnModels){
            for(var col in columnModels){
                var name = columnModels[col].name;
                if(name === 'stat'){
                    jQuery(container).jqGrid ('setLabel',name, 'Attribute Name','','');
                }else{
                    jQuery(container).jqGrid ('setLabel',name, '','no-cursor-pointer','');
                }
            }
            jQuery(container).trigger("reloadGrid");
         },
        searchInGrid: function(container, searchFieldStr, searchOp, searchStr){
            var grid = jQuery(container);
            var searchList = searchStr.split(',');
            var filterList = [];
            var j = 0;
            for(var i in searchList){
                searchList[i] = $.trim(searchList[i])
                if(searchList[i] !== ""){
                    var filter = {};
                    var filter = {
                        "field": searchFieldStr,
                        "op": searchOp,
                        "data": searchList[i]  
                    }
                    filterList[j++] = filter;
                }
            }
            $.extend(grid.jqGrid("getGridParam", "postData"), {
                    filters: JSON.stringify({
                        groupOp: "OR",
                        rules: filterList,
                        groups: []
                    })
            });
            grid.jqGrid("setGridParam", {search: true})
            .trigger('reloadGrid', [{current: true, page: 1}]);
            
        },
        adjustFrozenColumn: function(){
            var myDiv = $('.frozen-bdiv');
            var topStr = myDiv[0].style.top;
            var len = topStr.length;
            var topInt = +topStr.substr(0,len-2);
            topInt += 2;
            topStr = topInt + "px";
            $('.frozen-bdiv')[0].style.top = topStr;
        },
        startInitGrid: function(statList){
                var statStr = [];
                statStr[0] = "stat";
                var colModel = [];
                colModel[0] = this.createStatHeaderColModelObject(statStr[0], statStr[0], 'left', 150);
                var tempColModel = [];
                for(var i in window.AMCGLOBALS.persistent.nodeList){
                    tempColModel[i] = this.createColModelObject(window.AMCGLOBALS.persistent.nodeList[i], window.AMCGLOBALS.persistent.nodeList[i], 'center', 150);
                }
                colModel = colModel.concat(tempColModel);
                var colName = statStr.concat(window.AMCGLOBALS.persistent.nodeList);
                this.initNodeGridLocalData(AppConfig.stat.statTableDiv, colName, colModel, []);
            
            $(AppConfig.stat.statTableDiv).trigger("reloadGrid");
        },
        initEmptyGridData: function(statList){
            var myGridData = [];
            for(var i in statList){
                var data = {};
                data.stat = statList[i];
                myGridData[i] = data;
            }    
            return myGridData;
        },
        initAndSetGridData: function(statList){
            var gridData = this.initEmptyGridData(statList);
            $(AppConfig.stat.statTableDiv).jqGrid('setGridParam', {data: gridData}).trigger('reloadGrid');
        },
        createColModelObject: function(colName, colIndex, alignment, width){
            var tempColModel;
            tempColModel = {};
            tempColModel['name'] = colName;
//            tempColModel['index'] = colIndex;
            if(_.contains(window.AMCGLOBALS.persistent.selectedNodes, colName)){
                tempColModel['hidden'] = false;
            }else{
                tempColModel['hidden'] = true;
            }
            tempColModel['align'] = alignment;
            tempColModel['width'] = width;
            tempColModel['resizable'] = false;
            tempColModel['sortable'] = false;
            
            return tempColModel;
        },
        createStatHeaderColModelObject: function(colName, colIndex, alignment, width){
        
            var tempColModel;
            tempColModel = {};
            tempColModel['name'] = colName;
//            tempColModel['index'] = colIndex;
            
            tempColModel['align'] = alignment;
            tempColModel['width'] = width;
            tempColModel['frozen'] = true;
            tempColModel['key'] = true;
            tempColModel['search'] = true;
            tempColModel['sortable'] = true;
            tempColModel['sorttype'] = 'text';
            tempColModel['stype'] = 'text';
            tempColModel['resizable'] = false;
            tempColModel['firstsortorder'] = "asc";
            return tempColModel;
        }
    };
    
    return StatTable;
});
