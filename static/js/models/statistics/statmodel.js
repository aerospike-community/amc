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

define(["underscore", "backbone", "poller", "config/app-config", "helper/util"], function(_, Backbone, Poller, AppConfig, Util){
    var StatModel = Backbone.Model.extend({
        url: function(){
        	if(this.modelType === 'nodes'){
                this.URL =  AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + AppConfig.node.resourceUrl + this.address + '/allstats?type='+this.type;
            }else if(this.modelType === 'namespace'){
                 this.URL =  AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + AppConfig.namespace.resourceUrl + window.AMCGLOBALS.persistent.namespaceName + '/nodes/'+ this.address + '/allstats?type='+this.type;
            }else if(this.modelType === 'sindex'){
                  this.URL =  AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + AppConfig.namespace.resourceUrl + window.AMCGLOBALS.persistent.namespaceName + '/sindexes/' + window.AMCGLOBALS.persistent.indexName +'/nodes/'+ this.address + '/allstats?type='+this.type;
            } else if(this.modelType === 'xdr'){
                 this.URL =  AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + AppConfig.xdr.resourceUrl + window.AMCGLOBALS.persistent.xdrPort + AppConfig.node.resourceUrl + this.address + '/allstats?type='+this.type;
            }
            if(typeof this.URL === 'undefined')
                this.URL =  '';
            return this.URL;
        },

        setParamaters: function(address, clusterID, modelType, statTableID, statList, specialParam){
            this.modelType = modelType;
            this.clusterID = clusterID;
            this.address = address;
            this.statTableID = statTableID;
            this.statList = statList;
            if(modelType === 'xdr')
                this.xdrPort = specialParam;
            else if(modelType === 'namespace')
                this.namespaceName = specialParam;
            else if(modelType === 'sindex'){
                this.namespaceName = specialParam[0];
                this.indexName = specialParam[1];
            }
        },
        initialize :function(modelType){
			this.CID = window.AMCGLOBALS.currentCID;
            this.startEventListeners();
            this.type = 'all';
            this.requestCount = 0;
        },

        startEventListeners :function(){
            var that = this;
            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            }

            $(AppConfig.stat.statTableDiv).on("renderall", {"model" : this}, this.redrawGrid);

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
        },

        redrawGrid: function(event, nodelist){
            var model = event.data.model;
            if(nodelist.indexOf(model.address) !== -1){
                model.colView.lazyRender(event);
            }
        },

        fetchSuccess: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}

            if(response.requestCount >= 2){
                response.type = 'updated';
            } else {
                response.requestCount = response.requestCount + 1;
            }
            
            try{
                var col = response.colView;
				col.render(response, response.attributes);

                var trackingList = response.collection.trackList;
                
                if(trackingList.length > 0){
                    trackingList.forEach(function(stat){
                        response.collection.tracker.updateTracker(response.address, stat, response.get(stat));
                    });
                }

            }catch(e){
                if(window.AMCGLOBALS.activePage === "statistics"){
                    Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, true);
                }
                console.info(e.toString());
            }
			
			if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				this.clusterID = window.AMCGLOBALS.persistent.clusterID;
				 
			}
			
			if(typeof response.attributes.error !== 'undefined' && response.attributes.error.indexOf("Invalid cluster id") != -1){
				delete response.attributes.error;
				Util.clusterIDReset();				
			}
			
        },
        fetchError: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
            response.requestCount = 1;
			response.type = 'all';
            var that = this;
            if(window.AMCGLOBALS.activePage === "statistics"){
                try{
					if(!(!AMCGLOBALS.pageSpecific.GlobalPollingActive && Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, false)) && that.active()){
                        response.colView.renderNetworkError(response);
                    }
                }catch(e){
                    console.info(e.toString());
                }
            }
        }
        
    });

    return StatModel;
});



  