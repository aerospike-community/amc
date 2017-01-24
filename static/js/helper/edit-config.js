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

define(["jquery", "underscore", "backbone", "d3", "helper/jqgrid-helper", "helper/util", "config/app-config", "config/var-details","helper/AjaxManager"], function($, _, Backbone, D3, GridHelper, Util, AppConfig, VarDetails,AjaxManager){

    var STATIC_CONFIGS = {
      namespace : ['storage-engine', 'device', 'file', 'filesize', 'data-in-memory', 'defrag-startup-minimum', 'write-block-size', 
                  'scheduler-mode', 'cold-start-empty', 'partition-tree-locks', 'partition-tree-sprigs', 'replication-factor',
                  'single-bin', 'data-in-index', 'cold-start-evict-ttl', 'si', 'set'],
      node      : ['enable-xdr', 'xdr-digestlog-path', 'xdr-client-threads', 'xdr-errorlog-path', 
                  'xdr-local-node-port', 'xdr-info-port', 'xdr-pidfile', 'address', 'node_status'],
      xdr       : ['xdr_status', 'enable-xdr', 'xdr-digestlog-path', 'xdr-client-threads', 
                  'xdr-errorlog-path', 'xdr-local-node-port', 'xdr-info-port', 'xdr-pidfile'],
    };

    function isStaticConfig(context, config) {
      var list = [];
      var found;

      if(context === 'nodes') {
        list = STATIC_CONFIGS.node;
      } else if(context === 'namespace') {
        list = STATIC_CONFIGS.namespace;
      } else if(context === 'xdr') {
        list = STATIC_CONFIGS.xdr;
      }

      found = _.find(list, function(c) { return c === config;});
      found = found || false; // _.find returns undefined when no value passes the test
      return found;
    }

    var StatTable = {   
        updateRowData: function(container, context, statList, address, modelData, errorStr){
            var that = this;
            try{
                var gridData = $(container).jqGrid('getGridParam','data');
                if(typeof errorStr === 'undefined'){
                    this.checkAndAddStats(container, context, modelData, statList, gridData, function(){
						that.updateColumnClasses(container, address, 'red-text', 'green-text');
						that.updateGridColumnDataSucc(gridData, address, modelData);
						$(container).jqGrid('setGridParam', {data: gridData}).trigger('reloadGrid');
					});
                }else if(errorStr === 'Node Down'){
                    this.updateColumnClasses(container, address, 'green-text', 'red-text');
                    this.updateGridColumnDataErr(gridData, address, 'N/A');
					$(container).jqGrid('setGridParam', {data: gridData}).trigger('reloadGrid');
                }else if(errorStr === 'N/E'){
                    this.updateColumnClasses(container, address, 'green-text', 'red-text');
                    this.updateGridColumnDataErr(gridData, address, errorStr);
					$(container).jqGrid('setGridParam', {data: gridData}).trigger('reloadGrid');
                }else{//N/A
                    this.updateColumnClasses(container, address, 'red-text', 'green-text');
                    this.updateGridColumnDataErr(gridData, address, errorStr);
					$(container).jqGrid('setGridParam', {data: gridData}).trigger('reloadGrid');
                }
                var grid = jQuery(container);
                that.setRowTitle(grid);
            }catch(e){
                console.info(e.toString());
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
        checkAndAddStats: function(container, context, modelData, statList, gridData, callback){
             
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
          var disabled = false;
					for(var i = index; i < index + 10 && i < stats.length; i++){
						if(!StatTable.isDisabled(newStats[i])){
							var data = {};
							data.stat = newStats[i];
              disabled = isStaticConfig(context, data.stat);
              if(disabled){
                  data.updateConfig = "<input class='updateBox' name='"+ data.stat +"' type='text' value='' disabled='disabled'></input>";
              } else{
                  data.updateConfig = "<input class='updateBox' name='"+ data.stat +"' type='text' value='New Value'></input>";
              }
              jQuery(container).addRowData(newStats[i], data);
						}
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
            var containerWidth = jQuery(container).parent().width();
            window.AMCGLOBALS.config = {};
            window.AMCGLOBALS.config.validValues = {};
            window.AMCGLOBALS.config.invalidValues = {};
            
            var grid = jQuery(container).jqGrid({
                    datatype:'local',
                    data: localData,
                    hidegrid: false,
                    colNames: columnNames,
                    colModel: columnModel,
                    height:'auto',
                    loadui : 'disable',
                    loadonce: false,
                    shrinkToFit: false,
                    subGrid: false,
                    headertitles : true,
                    rowNum: (innerWidth <= 755 ? 5 : 10),
                    rowList:(innerWidth <= 755 ? [] : [10, 20,50,100,200]),
                    sortname: "stat",
                    sortorder: "asc", 
                    rownumbers: (innerWidth > 755),
                    pager: '#pager1',
                    pagerpos:(innerWidth <= 755 ? 'left' : 'center'),
                    recordpos:'left',
                    pgbuttons:true,
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
                                console.log(e.toString());
                            } 
                        }
                        var inputBox = $("table tr td .updateBox");                        
                        inputBox.off("click,blur");                        
                        inputBox.on("click",StatTable.inputBoxInFocus);
                        inputBox.on("blur",StatTable.inputBoxOutOfFocus);                        
                        //console.info(totalDetailsFound+"/"+rowIDS.length);
                      
                        StatTable.populateCacheValues(window.AMCGLOBALS.config.validValues);
                        StatTable.populateCacheValues(window.AMCGLOBALS.config.invalidValues);
						$(container).setGridWidth(Math.max(jQuery(".tab-content:visible").width(), 550));
                    },
                    onPaging : function(pgButton){
                        StatTable.cacheValues(StatTable.getValidConfigUpdates(),window.AMCGLOBALS.config.validValues);
                        StatTable.cacheValues(StatTable.getInvalidConfigUpdates(),window.AMCGLOBALS.config.invalidValues);
                    }
                   
            });
            this.colHeaderFormatter(container, columnModel);
            jQuery(container).jqGrid('setFrozenColumns');
            // this.adjustFrozenColumn();
            
//            setTimeout(function(){
//                $('#nodeStatListGrid').slideDown(300);
//            },1000); 
            function handler() {
				if(window.AMCGLOBALS.activePage !== "admin-console"){
					window.removeEventListener("resize", handler,true);
					return;
				}
				$(container).setGridWidth(Math.max(jQuery(".tab-content:visible").width(), 550));
			}
			window.addEventListener('resize', handler, true);
			
            return grid;
        },
        
        cacheValues : function(objectToCache,destinationObject){
             try{
                if(objectToCache){
                    _.extend(destinationObject,objectToCache);
                }
            } catch(error){
                console.log(error);
            }
        },
        
        populateCacheValues : function(cacheObject){
            try{
                if(cacheObject){
                    for(var key in cacheObject){
                        var element = $('input[name='+key+']');
                        element.val(cacheObject[key]);
                        element.trigger("blur");
                    }
                }
            } catch(error){
                console.log(error);
            }
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
            topInt += 6;
            topStr = topInt + "px";
            $('.frozen-bdiv')[0].style.top = topStr;
        },
        startInitGrid: function(statList){
                $("#applyConfigBtn").attr("disabled","true");
                var statStr = [];
                statStr[0] = "stat";
                var colModel = [];
                colModel[0] = this.createStatHeaderColModelObject(statStr[0], statStr[0], 'left', 140);
                
                statStr[1] = "Value";
                colModel[1] = {name : "updateConfig", align : "center", width : 120, resizable : false, sortable : false, frozen : true};
                
                var tempColModel = [];
                for(var i in window.AMCGLOBALS.persistent.nodeList){
                    tempColModel[i] = this.createColModelObject(window.AMCGLOBALS.persistent.nodeList[i], window.AMCGLOBALS.persistent.nodeList[i], 'center', 170);
                }
                colModel = colModel.concat(tempColModel);
                var colName = statStr.concat(window.AMCGLOBALS.persistent.nodeList);
 
                this.initNodeGridLocalData(AppConfig.stat.statTableDiv, colName, colModel, []);
            
            
            $(AppConfig.stat.statTableDiv).trigger("reloadGrid");
            
        },
        initEmptyGridData: function(statList, context){
            var myGridData = [];
            var counter=0;
            var disabled = false;
            for(var i in statList){
                var data = {};
                
                if(!StatTable.isDisabled(statList[i])){
                    data.stat = statList[i];
                    disabled = isStaticConfig(context, data.stat);
                    if(disabled){
                        data.updateConfig = "<input class='updateBox' name='"+ data.stat +"' type='text' value='' disabled='disabled'></input>";
                    } else{
                        data.updateConfig = "<input class='updateBox' name='"+ data.stat +"' type='text' value='New Value'></input>";
                    }
                    myGridData[counter++] = data;
                }

            }    
            return myGridData;
        },
        initAndSetGridData: function(statList, context){
            var gridData = this.initEmptyGridData(statList, context);
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
        },
        
        inputBoxInFocus : function(target){
            var elem = $(target.currentTarget);
            if($.trim(elem.val()) === 'New Value')
                elem.val("");
            
            if(window.AMCGLOBALS.persistent.showAttributesFor !== "namespace" || (window.AMCGLOBALS.persistent.namespaceName !== null))
                $('#applyConfigBtn').removeAttr("disabled");
        },

        validateInputValue : function(value,datatype,range){
            return true;
        },
        
        inputBoxOutOfFocus : function(target){
            var elem = $(target.currentTarget);
            var that = StatTable;
            if($.trim(elem.val()) === "" || elem.val() === "New Value"){
                elem.removeClass("invalidValue");
                elem.removeClass("validValue");                      
                elem.val("New Value");
            } else{
                if(that.validateInputValue("", "","") == true){
                    elem.removeClass("invalidValue");
                    elem.addClass("validValue");                                    
                } else{
                    elem.removeClass("validValue");                
                    elem.addClass("invalidValue");                                    
                }
            }
            
            if(($(".updateBox.validValue").length > 0) && (window.AMCGLOBALS.persistent.showAttributesFor !== "namespace" || (window.AMCGLOBALS.persistent.namespaceName !== null))){
                $('#applyConfigBtn').removeAttr("disabled");
            } else{
                $('#applyConfigBtn').attr("disabled","true");
            }
        },
       
        
        getValidConfigUpdates : function(){
            var validConfigs = {};
            var validElements = $(".updateBox.validValue");
            window.cont = validElements;
            for(var i=0;i<validElements.length;i++){
                validConfigs[validElements[i].attributes.name.value] = validElements[i].value;
            }            
            return validConfigs;
        },
        
        getInvalidConfigUpdates : function(){
            var invalidConfigs = {};
            var invalidElements = $(".updateBox.invalidValue");
             for(var i=0;i<invalidElements.length;i++){
                invalidConfigs[invalidElements[i].attributes.name.value] = invalidElements[i].value;
            }
            
            return invalidConfigs;
        },
        
        updateConfig : function(){
            this.updateConfirmationDialogue();
        },
        
        updateConfirmationDialogue : function(){
            var that = this;
            var applicableNodes = window.AMCGLOBALS.persistent.selectedNodes;
            var validValues = _.extend(window.AMCGLOBALS.config.validValues,this.getValidConfigUpdates());
            var invalidValues = _.extend(window.AMCGLOBALS.config.invalidValues, this.getInvalidConfigUpdates());
          
            var validValuesList = "";
            var invalidValuesList = "<ul>";            
            $('.popupApplicableNodes.popupHeader').html('Please confirm the following configuration changes :');

            validValuesList += "<table class='confirmAttrList'><thead><tr><th class='attributeCol'>Attribute Name</th><th class='valuesCol'>Value</th></tr></thead><tbody>";  
            for(var prop in validValues){
                validValuesList += "<tr><td class='attributeCol'>" + prop + "</td><td class='valuesCol'>" + validValues[prop] + "</td></tr>";
            }
            validValuesList += "</tbody></table>";
            
            $('.popupValidValues.popupList').html(validValuesList);
            
            invalidValuesList = "<table class='confirmAttrList invalidAttr'><thead><tr><th class='attributeCol'>Attribute Name</th></tr></thead><tbody>";  
            for(var prop in invalidValues){
                $(".popupInvalidValues").css("display","block");
                invalidValuesList += "<tr><td class='attributeCol'>" + prop + "</td></tr>";
            }
            invalidValuesList += "</tbody></table>";
            
            $('.popupinvalidValues.popupList').html(invalidValuesList);            
            
            var confirmDialog = $("#configUpdateConfirm").dialog({
                                    dialogClass: "no-dialog-title",
                                    modal: true,
                                    width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                                    closeOnEscape: true,
                                    resizable: false
                                });
            
            $('.update-popup').slimScroll({
                    height: '250px',
					alwaysVisible: true,
            });
            
            $('#updateConfigSubmit').off('click').on('click',function(){
                //clear cache value
                window.AMCGLOBALS.config.validValues = {};
                window.AMCGLOBALS.config.invalidValues = {};
                
                $("#configUpdateConfirm").dialog('close');
                that.applyConfigUpdate(validValues);
            });
            
            $('#updateConfigCancel').off('click').on('click',function(){
                $("#configUpdateConfirm").dialog('close');
            });
        },
        
        applyConfigUpdate : function(validValues){
            $('#applyConfigBtn').attr("disabled","true");
            var that = this;
            var resourceUrl = that.getResourceURL();
           
            $("#configApplyingChanges").dialog({
                                    dialogClass: "no-dialog-title",
                                    modal: true,
                                  	width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                                    height: 150,
                                    closeOnEscape: false,
                                    resizable: false
                                });
                                
            AjaxManager.sendRequest(resourceUrl,{type: AjaxManager.POST, data : validValues},function(response){
            	$("#configApplyingChanges").dialog("close");
                that.showConfigUpdateDiv(response,validValues);
            }, function(response){
            	var failMsg = "Network Error";
                if(response.status == 401)
                    failMsg = "Unauthorized. Login to Continue.";
                $("#configApplyingChanges").dialog("close");    
                notyAlert = noty({text : failMsg, layout : "center", type : "red" ,closeWith: ['click'], timeout : 5000});
            });
        },
        
        getResourceURL : function(){
            var resourceUrl = AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID;

            switch(window.AMCGLOBALS.persistent.showAttributesFor){
                case "namespace" : resourceUrl += AppConfig.namespace.resourceUrl + window.AMCGLOBALS.persistent.namespaceName; break;
                case "xdr" : resourceUrl += AppConfig.xdr.resourceUrl + window.AMCGLOBALS.persistent.xdrPort; break;
            }
           
            resourceUrl += AppConfig.node.resourceUrl + window.AMCGLOBALS.persistent.selectedNodes.toString() + "/setconfig";

            return resourceUrl;
        },
        getNodeDownHtmlStr: function(nodeList, nodeColor){
            var node;
            var tempStr = '';
            tempStr += '<ol class="node-status-list">';
                        for(var nodeI in nodeList){
                            node = nodeList[nodeI];
                            tempStr +='<li class="node-status-details-address '+nodeColor+'">'+
                                '<span class="li-node-addr">'+node+'</span>'+
                            '</li> ';
                        }
            tempStr += '</ol>';
            return tempStr;
        },
        showConfigUpdateDiv : function(data,validValues){
            var alertNodeDown = false;
            var alertXDROff = false;
            var alertAttrFail = false;
            var nodesDown = [];
            var xdrOff = [];
            var attrNodeMap = {};
            var unsetAttrDiv = "";
            var divModalNodesDown = "";
            var divModalXDROff = "";
            var divModalAttrFail = "";
            var divModal = "";
                       
            for(var node in data){
                if(data[node].node_status === "off"){
                    nodesDown.push(node);
                } else if(data[node].xdr_status === "off"){
                    xdrOff.push(node);
                } else if(typeof data[node].unset_parameters !=='undefined' && data[node].unset_parameters.length > 0){
                    for(var parameter in data[node].unset_parameters){
                        if(typeof attrNodeMap[data[node].unset_parameters[parameter]] === 'undefined')
                            attrNodeMap[data[node].unset_parameters[parameter]] = [];
                        attrNodeMap[data[node].unset_parameters[parameter]].push(node);
                    }
                }
            }
            
            if(nodesDown.length > 0){
                divModalNodesDown += "<div class='updateResponseOff'>Following node(s) are down: ";
                
                /*for(var i=0; i<nodesDown.length ; i++){
                    divModalNodesDown += "<li>" + nodesDown[i] + "</li>";
                }*/
                divModalNodesDown += StatTable.getNodeDownHtmlStr(nodesDown,'red');
                
                divModalNodesDown += "</div>";
                
                alertNodeDown = true;
            }
            
            if(window.AMCGLOBALS.persistent.showAttributesFor === 'xdr' && xdrOff.length > 0){
                divModalXDROff += "<div class='updateResponseOff'>Following node(s) have XDR off: <ul>";
                
                for(var i=0; i<xdrOff.length ; i++){
                    divModalXDROff += "<li>" + xdrOff[i] + "</li>";
                }
                
                divModalXDROff += "</ul></div>";
                
                alertXDROff = true;
            }
            
            divModalAttrFail += "<div class='updateResponseOff'>Error in setting the following attributes :<br><br>";
            divModalAttrFail += "<table class='updateResponseAttributeFailure'><thead><tr><th class='attributeCol'>Attribute Name</th><th class='nodesCol'>Nodes which reported an error</th></tr></thead><tbody>";
            
            for(var attr in attrNodeMap){
                alertAttrFail = true;
                divModalAttrFail += "<tr>";
                divModalAttrFail += "<td class='attributeCol'>" + attr+ "</td>";
                divModalAttrFail += "<td class='nodesCol'>" + (attrNodeMap[attr].toString()).replace(/\,/g,", "); + "</td>";
                divModalAttrFail += "</tr>";                
            }
            
            divModalAttrFail += "</tbody></table></div>";
            
                        
            if(alertNodeDown)
                divModal += divModalNodesDown;
            
             if(alertXDROff)
                divModal += divModalXDROff;
            
            if(alertAttrFail)
                divModal += divModalAttrFail;

            if(alertNodeDown || alertAttrFail || alertXDROff){
				if((window.AMCGLOBALS.persistent.selectedNodes.length > nodesDown.length || xdrOff.length < window.AMCGLOBALS.persistent.selectedNodes.length) 
                && this.anyChangeApplied(data,validValues)){
					divModal += "<div class='updateResponseOff' style='color: #008B00; font-weight: bold;'>All other changes have been applied successfully.</div>"
				} else{
					divModal += "<div class='updateResponseOff' style='color: #F00; font-weight: bold;'>No changes have been applied.</div>"
				}
			
                $('#updateResponseBody').html(divModal);
                
                $('#updateResponseBody').slimScroll({
                    height: '250px',
					alwaysVisible: true,
                });
                
                $("#configUpdateResponse").dialog({
                    dialogClass: "no-dialog-title",
                    modal: true,
                    width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                    maxHeight: 450,
                    closeOnEscape: true,
                    resizable: false
                });
            
                $('#updateResponseSubmit').off('click');
                $('#updateResponseSubmit').on('click',function(){
                    $("#configUpdateResponse").dialog('destroy');
                    setTimeout(function(){ Util.startVisibleColPolling(window.AMCGLOBALS.activePageModel); }, 500);
                });
           } else{
                 divModal += "<div class='updateResponseOff' style='color: #008B00; font-weight: bold;'>All changes have been applied successfully.</div>";
                 $('#updateResponseBody').html(divModal);
                 
                 this.destroySlimScroll('#updateResponseBody');
                 
                 $("#configUpdateResponse").dialog({
                    dialogClass: "no-dialog-title",
                    modal: true,
                    width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                    maxHeight: 180,
                    closeOnEscape: true,
                    resizable: false
                });
            
                $('#updateResponseSubmit').off('click');
                $('#updateResponseSubmit').on('click',function(){
                    $("#configUpdateResponse").dialog('destroy');
                    setTimeout(function(){ Util.startVisibleColPolling(window.AMCGLOBALS.activePageModel); }, 500);
                });
                //setTimeout(function(){ Util.startVisibleColPolling(clusterModel); }, 1000);
                //notyAlert = noty({text : "Changes successfully Applied", layout : "center", type : "green" ,closeWith: ['click'], timeout : 5000});
           }
        },
        
        isDisabled: function(attr){
            return _.contains(AppConfig.configDisabledList, attr);
        },
        
        anyChangeApplied : function(data, validValues){
            var validKeys = _.keys(validValues);
            var change = false;
            var temp;
            var unset = null;
            for(var i in data){
                if(data[i].node_status === 'on' && typeof data[i].unset_parameters !== 'undefined'){
                    temp = _.difference(validKeys,data[i].unset_parameters);
                    if(temp.length > 0){
                        change = true;
                        break;
                    }
                }
                
            }

            return change;
        },
        
        destroySlimScroll : function(objectSelector){
			var obj = $(objectSelector);
             if(obj.length > 0 && obj.parent().length > 0 && typeof obj.parent().attr('class') !== 'undefined' && obj.parent().attr('class').indexOf('slimScrollDiv') != -1){
                 $(objectSelector).parent().replaceWith($(objectSelector)); 
                 $(objectSelector).attr('style','');
             }
        }
        
        
    };
    
    return StatTable;
});
