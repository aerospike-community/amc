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
        rowClasses : {
        	actionPending : 'row-action-pending'
        },

        updateRowData: function(container, data, rowID, cssActions){
                try{
                    if(!jQuery(container).getInd(rowID)){
                        jQuery(container).addRowData(rowID, data);
                    }else{
                        jQuery(container).setRowData(rowID, data);
                    }

                    $("#" + rowID).removeClass( _.values(XdrTable.rowClasses).toString().replace(","," ") );
					
					if(cssActions != null){
						var cssProps = "";
						for(var i in cssActions){
							cssProps += XdrTable.rowClasses[cssActions[i]] + " ";
						}

						$("#" + rowID).addClass(cssProps.trim());
					}

                }catch(e){
                    console.info(e.toString());
                }
        },
        initNodeGridLocalData: function(container, columnNames, columnModel, localData, tableWidth) {
           
            var grid = jQuery(container).jqGrid({
                colNames: columnNames,
                colModel: columnModel,
                datatype: 'local',
                data: localData,
                loadonce: true,
                height: 'auto',
                hidegrid: false,
//                    ExpandColClick: true,
                loadui: 'disable',
//                    subGrid: true,
                headertitles: true,
                width: Math.max(window.innerWidth * 0.93, 750),
                ignoreCase: true,
                loadComplete: function() {

                }
            });
            var searchOptions = {
                searchOnEnter: false,
                defaultSearch: "cn",
                stringResult: true
            };
            jQuery(container).jqGrid('filterToolbar', searchOptions);
			window.addEventListener('resize', function() {
				$(container).setGridWidth(Math.max(window.innerWidth * 0.93, 750));
			}, true);
            return grid;
        },
        initGrid: function(container, columnNames, columnModel, enableSearchToolBar, tableWidth ,model) {
            
			var parentContainer = container.parent();
			var isSort = false;
            var grid = jQuery(container).jqGrid({
                colNames: columnNames,
                colModel: columnModel,
                datatype: 'local',
                loadonce: true,
                height: 'auto',
                hidegrid: false,
//                    ExpandColClick: true,
                loadui: 'disable',
//                    subGrid: true,
                headertitles: true,
                width: Math.max(window.innerWidth * 0.93, 750),
                ignoreCase: true,
                onSortCol : function(){
                    isSort = true;
                },
                loadComplete: function() {
                    if( columnNames.indexOf("Index Name") !== -1 ){
                        $("#addNewIndex").show();
                        $("#namespaceTableContainer").show(200);
                    } else if(columnNames.indexOf("UDF File Name") !== -1 ){
                        $("#addNewUDF").show();
                        $("#udfTableContainer").show(200);
                    }

                    /*Binding remove events after sorting*/
                    if(isSort){
                        if(columnNames.indexOf("Index Name") !== -1){
                            model.initDropIndexListener(AppConfig.sindex.tableDiv);
                        }else{
                            model.initRemoveUDFListener(AppConfig.udf.tableDiv);
                        }
                        
                        isSort = false;
                    }
                },
            });
            if(enableSearchToolBar === true){
                var searchOptions = {
                    searchOnEnter: false,
                    defaultSearch: "cn",
                    stringResult: true
                };
                jQuery(container).jqGrid('filterToolbar', searchOptions);

                parentContainer.find("div.toggleSearchHeader").show();
                parentContainer.find("div.toggleSearchHeader input")
                    .off("change")
                    .on("change",function(e){
                        e.stopPropagation();
                        if($(this).prop("checked")){
                            parentContainer.find(".ui-search-toolbar").show();
                        } else{
                            parentContainer.find(".ui-search-toolbar").hide();
                        }
                    });
            }
			function handler() {
				if(window.AMCGLOBALS.activePage !== "definitions"){
					window.removeEventListener("resize", handler,true);
					return;
				}
				$(container.selector).setGridWidth(Math.max(window.innerWidth * 0.93, 750));
			}
			window.addEventListener('resize', handler, true);
            return grid;
        },
        
    };
    
    return XdrTable;
});
