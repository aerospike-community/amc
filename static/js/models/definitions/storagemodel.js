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

define(["underscore", "backbone", "poller", "views/definitions/storageview", "helper/definitions/sindex-table", "config/app-config", "helper/util"], function(_, Backbone, Poller, StorageView, SIndexTable, AppConfig, Util){
    var StorageModel = Backbone.Model.extend({
        initialize: function(){
			this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();
            this.startEventListeners();
        },
        initVariables: function(){
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
            this.isInitialized = false;
            this.views = {};
            this.setsListFull = {};
            this.tableDiv = AppConfig.storage.tableDiv;
			var tableWidth = ($(".table-container.box-container").width() - 70);
            SIndexTable.initGrid($(this.tableDiv), AppConfig.storageDefList, AppConfig.storageDefListColumn, false, tableWidth);
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + '/namespaces/' + window.AMCGLOBALS.persistent.namespaceName + '/storage';
        }, 
        fetchSuccess: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
                model.initSetView(model);
                model.views[0].startEventHandlers(model.storageList);
                this.stop();
				if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
					this.clusterID = window.AMCGLOBALS.persistent.clusterID;
					 
				}  
				
				if(typeof model.attributes.error !== 'undefined' && model.attributes.error.indexOf("Invalid cluster id") != -1){
					delete model.attributes.error;
					Util.clusterIDReset();				
				}
        },

        startEventListeners : function (){
            var that = this;
            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            };

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
        },

        initSetView: function(model){
		
			var modelData = model.attributes;
            
            model.data = {};
			model.storageList = modelData.storage;
			model.devices = modelData.devices;
			
            model.data.storageType = model.listView(model, model.storageList, 'storage-type-container');
			model.data.storageDevice = model.listView(model, model.devices, 'devices-type-container');
			//model.data.storageDevice = model.listView(model, model.storageList, 'devices-type-container');
			model.data.synced = modelData.synced;
			
            model.views[0] = new StorageView({tableDiv:model.tableDiv, indexName:0 ,model: model});
            model.views[0].render(model, model.data, 0);
            
        },
        fetchError: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
			
            try{
                //DISPLAY ERROR
                model.displayNetworkErrorRow(model);
            }catch(e){
                console.info(e.toString());
            }
        },
		listView: function(model, list, className){
			var typeListHtml = '';
			if(_.isEmpty(list)){
				typeListHtml += '----';
			}else{
				typeListHtml = '<div  class='+className+'>';//<span class="storage-type">';
				typeListHtml += '<ol class="type-ol" style="list-style: none">'; 
            
				for(var type in list){
					typeListHtml += '<li title="'+list[type]+'" class="type-li">' + type + '</li>';
				}
			}
            typeListHtml += '</ol></div>';//</span>';
			return typeListHtml;
		
		},
        displayNetworkErrorRow: function(model){
            var tempData = {
                    "storageType": "N/E",
					"storageDevice": "N/E",
                    "synced": "N/E"
            };
            model.views[0] = new StorageView({tableDiv:model.tableDiv, indexName:0 ,model: model});
            model.views[0].renderNetworkError(model, tempData, 0);
            
            
        }
        
        
    });
    
    return StorageModel;
});
