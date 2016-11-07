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

define(["underscore", "backbone", "poller", "views/definitions/sindexview", "helper/definitions/sindex-table", "config/app-config", "helper/util"], function(_, Backbone, Poller, SIndexView, SIndexTable, AppConfig, Util){
    var SIndexModel = Backbone.Model.extend({
        initialize: function(){
			this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();
            this.startEventListeners(this);
        },
        initVariables: function(){
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
            this.isInitialized = false;
            this.views = {};
            this.indexListFull = {};
			var tableWidth = ($(".table-container.box-container").width() - 70);
            SIndexTable.initGrid($(AppConfig.sindex.tableDiv), AppConfig.secondaryIndexDefList, AppConfig.secondaryIndexDefListColumn, tableWidth);
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + '/namespaces/' + window.AMCGLOBALS.persistent.namespaceName + '/sindexes';
        }, 
        fetchSuccess: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
              
            if(!this.model.isInitialized){
                this.model.initSIndexView(response);
                this.model.isInitialized = true;
            }else{
            
            }
           this.stop();
		
			if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				this.clusterID = window.AMCGLOBALS.persistent.clusterID;
				 
			}  
			
			if(typeof response.attributes.error !== 'undefined' && response.attributes.error.indexOf("Invalid cluster id") != -1){
				delete response.attributes.error;
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

        initSIndexView: function(model){
            var modelData = model.attributes;
            var indexData = modelData.indexes;
            model.indexList = _.pluck(indexData, 'indexname');
            
            for(var i in model.indexList){
                for(var j in indexData){
                    if(indexData[j].indexname === model.indexList[i]){
                        model.indexListFull[model.indexList[i]] = indexData[j];
                        break;
                    }
                }
            }
            
            for(var index in model.indexListFull){
                model.views[index] = new SIndexView({tableDiv:AppConfig.sindex.tableDiv,indexName:index ,model: this});
                model.views[index].render(model, model.indexListFull[index], index);
               
            }
            
        },
        fetchError: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
			
            var that = this;
            try{
                //DISPLAY ERROR
            }catch(e){
                console.info(e.toString());
            }
        },
        
        
        
    });
    
    return SIndexModel;
});
