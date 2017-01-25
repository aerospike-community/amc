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

define(["underscore", "backbone", "poller", "views/definitions/setsview", "helper/definitions/sindex-table", "config/app-config", "helper/util"], function(_, Backbone, Poller, SetsView, SIndexTable, AppConfig, Util){
    var SetsModel = Backbone.Model.extend({
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
            this.tableDiv = AppConfig.sets.tableDiv;
			var tableWidth = ($(".table-container.box-container").width() - 70);
            SIndexTable.initGrid($(this.tableDiv), AppConfig.setsDefList, AppConfig.setsDefListColumn, true, tableWidth);
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + '/namespaces/' + window.AMCGLOBALS.persistent.namespaceName + '/sets';
        }, 
        fetchSuccess: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
                    model.initSetView(model);
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
            var setsData = modelData.sets;
            model.setsList = _.pluck(setsData, 'set_name');
            if(_.isEmpty(model.setsList)){
                model.views[0] = new SetsView({tableDiv:model.tableDiv, indexName:0 ,model: model});
            }else{
            
                for(var i in model.setsList){
                    for(var j in setsData){
                        if(setsData[j]['set_name'] === model.setsList[i]){
                            model.setsListFull[model.setsList[i]] = setsData[j];
                            break;
                        }
                    }
                }
                for(var set in model.setsListFull){
                    model.views[set] = new SetsView({tableDiv:model.tableDiv, indexName:set ,model: model});
                    model.views[set].render(model, model.setsListFull[set], set);

                }
            }
            
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
        displayNetworkErrorRow: function(model){
            model.views[0] = new SetsView({tableDiv:model.tableDiv, indexName:0 ,model: model});
        }
        
        
        
    });
    
    return SetsModel;
});
