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
define(["jquery", "underscore", "backbone", "helper/node-table", "helper/jqgrid-helper", "config/view-config", "config/app-config", "helper/toggle", "helper/util","helper/AjaxManager","helper/servicemanager","helper/notification", "helper/modal"], function($, _, Backbone, NodeTable, GridHelper, ViewConfig, AppConfig, Toggle, Util,AjaxManager,ServiceManager,Notification, modal){

    var NodeView = Backbone.View.extend({
        isInitialized: false,
        initialize: function(options){
        	this.el = options.el;
			this.skip = false;
			this.status = 'none';
			this.alertQueue = {};
			this.pieCharts = {
				disk : null,
				memory : null
			};

			this.initEventHandlers();
			
        },

        initEventHandlers: function(){
        	var that = this;

        	this.model.on("remove", function(){
        		var rowID = that.model.get("row_id");
	            if(rowID != null){
	                var rowNextSibiling = $("#" +  AppConfig.node.nodeTablePrefix + rowID).next();
	                if(rowNextSibiling.hasClass("ui-subgrid"))
	                    rowNextSibiling.remove();					
	                $(AppConfig.node.nodeTableDiv).delRowData(AppConfig.node.nodeTablePrefix + rowID);
	            }
        	});
        },

        render: function(model, newData){
            //var modelIndex = data.row_id - 1;
            Util.checkVisibilityAndCall(this, function(){
            	model.data = newData;
				this.status = model.data['node_status'];
				if(!this.skip){
					var rowID = model.attributes['row_id'];
					if(model.data['node_status'] === "off"){
						model.data = AppConfig.blankNodeListData(model.address, 'N/A');
						model.data['node_status'] = 'off';
						NodeTable.updateRowData(AppConfig.node.nodeTableDiv,  model.data, rowID, true, AppConfig.node.nodeTablePrefix);
					}else{
						NodeTable.updateRowData(AppConfig.node.nodeTableDiv,  model.data, rowID, false, AppConfig.node.nodeTablePrefix);
					}
					this.formatRowData(model, AppConfig.node.nodeTablePrefix + rowID);
				}	
            });
        },
		
        renderNetworkError: function(model){
        	Util.checkVisibilityAndCall(this, function(){
	            var rowID = model.attributes['row_id'];
	            model.data = AppConfig.blankNodeListData(model.address, 'N/E');
	            model.data['node_status'] = 'off';
	            NodeTable.updateRowData(AppConfig.node.nodeTableDiv,  model.data, rowID, true, AppConfig.node.nodeTablePrefix);
	            this.formatRowData(model, AppConfig.node.nodeTablePrefix + rowID);
	        });
        },
        renderLoading: function(model){
        	Util.checkVisibilityAndCall(this, function(){
	            var rowID = model.attributes['row_id'];
	            model.data = AppConfig.blankNodeListData(model.address, '--');
	            model.data['node_status'] = 'none';
	            NodeTable.updateRowData(AppConfig.node.nodeTableDiv,  model.data, rowID, true, AppConfig.node.nodeTablePrefix);
	            this.formatRowData(model, AppConfig.node.nodeTablePrefix + rowID);
	        });
        },
        formatRowData: function(model, rowID){
            var address = model.address;
            var status = model.data['node_status'];
            if(status === "on"){
                this.statusButton(AppConfig.node.nodeTableDiv, address, rowID, 'green', 1);
                this.statusInAddress(model, AppConfig.node.nodeTableDiv, rowID, address, 'green-address-text', 2);
                try{
                    var diskArr = model.data['disk-arr'];
                    var memoryArr = model.data['memory-arr'];
                    // var clusterVisibility = "off"; //model.data['cluster_visibility'];
                    this.pieCharts.disk = GridHelper.jqCustomPieFormatter(this.pieCharts.disk, AppConfig.node.nodeTableDiv, rowID, ViewConfig.tablePieConfig, diskArr, 5);
                    this.pieCharts.memory = GridHelper.jqCustomPieFormatter(this.pieCharts.memory, AppConfig.node.nodeTableDiv, rowID, ViewConfig.tablePieConfig, memoryArr, 6);
                    // this.booleanToIcon(AppConfig.node.nodeTableDiv, rowID, clusterVisibility, 5);
                }catch(e){
                    console.info(e.toString());
                }
            }else if(status === "off"){
                this.statusButton(AppConfig.node.nodeTableDiv, address, rowID, 'red', 1);
                this.statusInAddress(model, AppConfig.node.nodeTableDiv, rowID, address, 'red-address-text', 2);
            }else{
                this.statusButton(AppConfig.node.nodeTableDiv, address, rowID, 'grey', 1);
                this.statusInAddress(model, AppConfig.node.nodeTableDiv, rowID, address, 'grey-address-text', 2);
            }
            
            if(model.expanded === true){
                var expandContainer = AppConfig.node.nodeTableDiv.substr(1)+'_'+ rowID;
                var tableHtmlStr = NodeTable.nodePropsHtml(model, rowID);
                $("#" + expandContainer).html(tableHtmlStr); 
            }
        },
        booleanToIcon :function(container, rowID, data, colIndex){
            var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;
            var htmlStr ='';
            if(data === true){
                htmlStr = '<div class="img-dot-green16x16 green-visibility-icon"></div>';
            }else if(data === false){
                htmlStr = '<div class="img-dot-red16x16 red-visibility-icon"></div>';
            }else{
                htmlStr = data;
            }
            $(cellContainer).html(htmlStr);
        },
        statusButton :function(container, nodeAddress, rowID, iconClassName, colIndex){
			var that = this;
            var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;
            var textAlign = "left";
			var status = "";
			
			if(iconClassName === "green"){
				status = "on";
				textAlign = "left";
			}else if(iconClassName === "red"){
				status = "off";
				textAlign = "right";
			}
			
            var htmlStr = '';
			var hasNodeOnOFFService = ServiceManager.isUserHasAccessToService(ServiceManager.serviceComponentMap.DASHBOARD_PAGE.DASHBOARD_NODE_ON_OFF.SERVICE_KEY);
			if(status === 'on'){
                if(window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE === AppConfig.amc_type[0]){
                    htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node visibility-button-container" style="width: 30px;" title="This feature available in enterprise version">';
                    htmlStr += '<span class="text-status-visibility" style="color:darkgray;"> ' + status + '</span><div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node"></div></div>';
                } else {
                	if(!ServiceManager.isSecurityEnable() || (ServiceManager.isSecurityEnable() && hasNodeOnOFFService)){
                		htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node visibility-button-container" style="width: 30px">';
                       	htmlStr += '<span class="text-status-visibility"> ' + status + '</span><div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node "></div></div>';
                	} else {
                		htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node visibility-button-container" style="width: 30px">';
                        htmlStr += '<span class="text-status-visibility" style="color:darkgray;"> ' + status + '</span><div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node "></div></div>';
                	}
                }
                
			} else{
				if(status === 'off')
					htmlStr += '<div class="icon-cancel-circle remove-node-icon" name="' + nodeAddress + '" title="Remove node from AMC"></div>';
                
                if(window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE === AppConfig.amc_type[0]){  
                    htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node visibility-button-container" style="width: 30px" title="This feature available in enterprise version">';
                    htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node "></div><span class="text-status-visibility" style="color:darkgray;">'+status+'</span></div>';
                } else {
                	if(!ServiceManager.isSecurityEnable() || (ServiceManager.isSecurityEnable() && hasNodeOnOFFService)){
                		htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node visibility-button-container" style="width: 30px">';
                        htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node "></div><span class="text-status-visibility">'+status+'</span>' +
                          '</div>';
                	} else {
                		htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node visibility-button-container" style="width: 30px">';
                        htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility node "></div><span class="text-status-visibility" style="color:darkgray;">'+status+'</span></div>';
                	}
                    
                }
                
			}
			
			htmlStr += "<div class='node status-alert-container' name='" + nodeAddress + "'></div>";

            $(cellContainer).html(htmlStr);
            var button = $(".remove-node-icon[name='"+nodeAddress+"']");
			button.parent().parent().children(".node.status-alert-container").css("z-index",-1);
			button.parent().parent().children(".node.status-alert-container").off("click");
      if(status === 'off') {
        that.bindToggleButton(button, nodeAddress, status, that, container, rowID, colIndex);
      }
						
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
        },

        bindToggleButton : function(button, nodeAddress, status, view, container, rowID, colIndex){
            var that = this;
            var hasNodeOnOFFService = ServiceManager.isUserHasAccessToService(ServiceManager.serviceComponentMap.DASHBOARD_PAGE.DASHBOARD_NODE_ON_OFF.SERVICE_KEY);
            button.off("click").on("click",function(x){
              x.stopPropagation();
              if(window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE === AppConfig.amc_type[0]){
                Notification.toastNotification('information',"This feature available in enterprise version",3000);
                return;
              } else if(ServiceManager.isSecurityEnable() && !hasNodeOnOFFService){
                Notification.toastNotification("red", "You don't have access to ON/OFF node", 3000);
                return;
              }

              modal.confirmModal('Stop Tracking', 'Stop collecting statistics for the node ' + nodeAddress, function success() {
                var url = AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + '/nodes/' + 
                  nodeAddress + '/switch_off';
                AjaxManager.sendRequest(url, {type: AjaxManager.POST}, success, failure);

                function success() {
                  Notification.toastNotification('green', 'Successfully stopped tracking node ' + nodeAddress, 3000);
                }
                function failure() {
                  Notification.toastNotification('red', 'Unable to stop tracking node ' + nodeAddress, 3000);
                }
              });
            }); 
        },

    });
   
    return NodeView;
});




