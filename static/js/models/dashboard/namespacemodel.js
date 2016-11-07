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
    var NamespaceModel = Backbone.Model.extend({
        idAttribute : "address",
        
        initVariables :function(){
			this.expanded = false;
            this.address = this.get("address");
            this.NE = false;
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;
        },
        initialize :function(){
			this.CID = window.AMCGLOBALS.currentCID;
            try{
                this.initVariables();
                this.startEventListeners();
            }catch(e){
                console.info(e.toString());
            }
        },

        startEventListeners  :function(){
            var that = this;
            
        },

        fetchSuccess: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
             try{ 
			 	if( !_(response.attributes).isEqual(response._previousAttributes) ){
					response._previousAttributes = _.clone(response.attributes);
					var row = response.rowView;
					row.render(response, response.attributes);
			 	}
            }catch(e){
                //this.start();
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
			
            var that = this;
            try{
				var row = response.rowView;
				row.renderNetworkError(response);
            }catch(e){
                console.info(e.toString());
            }
        },
    });

    return NamespaceModel;
});



  