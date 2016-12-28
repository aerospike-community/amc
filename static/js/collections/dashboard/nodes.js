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

define(["jquery", "underscore", "backbone", "helper/util", "models/dashboard/nodemodel", "views/dashboard/nodeview", "config/app-config", "config/view-config", "helper/node-table"], function($, _, Backbone, Util, NodeModel, NodeView, AppConfig, ViewConfig,NodeTable){
    var NodeCollection = Backbone.Collection.extend({
        model: NodeModel,
        _idAttr: "address",

        initialize : function(options){
            try{
                this.bind('add', this.onModelAdded, this);
                this.bind('remove', this.onModelRemoved, this);
                this.initVariables();
                
                // Initialize Views specific common functions
                NodeTable.initNodeGrid(AppConfig.node.nodeTableDiv, ViewConfig.nodePieConfig, this, NodeTable.nodePropsHtml);
                Util.initAddNewNode("#addNewNodeButton");

                // Initialize events on whole collection
                this.initEventListener();

                // Setup polling
                this.updatePoller(options);
                
            }catch(e){
                console.info(e.toString());
            }
        },

        initVariables :function(){
            this.CID = window.AMCGLOBALS.currentCID;
            this.clusterSizeAlertShown = false;
            this.clusterIntegrityAlertShown = false;
            this.rowID = 0;
        },

        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.node.resourceUrl + window.AMCGLOBALS.persistent.selectedNodes.toString();
        },

        onModelAdded: function(model, collection, options){
            collection.viewSortRequired = true;
            model.set("row_id", collection.rowID++);
            model.rowView = new NodeView({model: model, el : "#" + AppConfig.node.nodeTablePrefix + model.get("row_id")});
        },

        onModelRemoved: function(model, collection, options){
            model.rowView && model.rowView.remove();
        },

        parse: function(resp, options) {
            //function parses 'resp' to copy node address key as an address attribute of the same object
            //This address works as ID for the models thus helps in mapping to pre-existing models
            //Each of these node objects are then mapped to an array, making Backbone.collection identify them as different models

            var models = [];
            for(var node in resp){
                if(window.AMCGLOBALS.persistent.selectedNodes.indexOf(node) !== -1 ){
                    resp[node].address = node;
                    models.push(resp[node]);
                }
            }
            return models;
        },

        fetchSuccess: function(collection, resp, options){
            
            if(collection.CID !== window.AMCGLOBALS.currentCID){
                this.stop();
                collection.reset();
                return;
            }

            if(collection.viewSortRequired === true){
                collection.sortView(collection);
                collection.viewSortRequired = false;
            }

            window.AMCGLOBALS.pageSpecific.show_migrate_pct = false;

            for(var i=0; i<collection.models.length; i++){
                if(collection.models[i].get("node_status") !== "off"){
                    var version = Util.versionAfphaNumericCheck(collection.models[i].get("build"));
                    if(Util.versionCompare(version, AppConfig.version3point7) >= 0){
                        break;
                    }
                }
            }

            if(i != collection.models.length){
                window.AMCGLOBALS.pageSpecific.show_migrate_pct = true;
            }
            
            //Distribute Poll success callback to each model
            collection.models.forEach(function(model){
                try{
                    if(!!model.attributes["connectionStatus"] && model.attributes["connectionStatus"] === "error"){
                        model.set("connectionStatus", "online");                //trigger
                    } else {
                        model.attributes["connectionStatus"] = "online";        //silent
                    }
                    model.fetchSuccess(model);
                } catch(e) {
                    console.error("update failure for fetchSuccess in node model : " + (model.address || "Not Available"));
                    console.log(e);
                }
            });
        },
        
        fetchError: function(collection, resp, options){

            if(collection.CID !== window.AMCGLOBALS.currentCID){
                this.stop();
                collection.reset();
                return;
            }

            if(collection.viewSortRequired === true){
                collection.sortView(collection);
                collection.viewSortRequired = false;
            }

            //Distribute Poll failure callback to each model
            if(!(!AMCGLOBALS.pageSpecific.GlobalPollingActive && this.stop()) && this.active()){
                response.nodeCollection.each(function(model, index){
                    try{
                        model.set("connectionStatus", "error");
                        model.fetchError(model);
                    } catch(e) {
                        console.error("update failure for fetchError in node model : " + (model.address || "Not Available"));
                        console.log(e);
                    }
                });
            }
        },

        sortView: function(collection){
            collection.models.forEach(function(model){
                var location = collection.models.indexOf(model);
                if(location === 0){
                    model.set("viewPosition", "first");
                } else{
                    model.set("viewPosition", collection.models[location - 1].get("row_id"));
                }
            });
        },
        
        comparator: function(model1, model2){
            return model1.get("address") < model2.get("address") ? -1 : 1;
        },

        updatePoller : function(options){
            if(options.poll){
                this.poller = Util.initPoller( this, _.extend( AppConfig.pollerOptions(AppConfig.updateInterval['nodes']), {update : true}) ).start();
            } else{
                this.poller = Util.initPoller( this, _.extend( AppConfig.pollerOptions(AppConfig.updateInterval['nodes']), {update : true}) ).stop();
            }
        },
        
        findWhere: function(args){
            return _.find(this.models, function(model){
                        for(var key in args){
                            if((args[key]).toString() === (model.get(key)).toString())
                                return true;
                        }
                        return false;
                    });
        },

        /* Events affecting whole collection */

        initEventListener: function(){
            var collection = this;
            var container = window.$("#nodeContainer .card_layout");

            //  Pause/Resume Pollers when Panel is closed/open
            container.off("startPoller", this.startCollectionPoller).on("startPoller", {collection : this}, this.startCollectionPoller);
            container.off("stopPoller", this.stopCollectionPoller).on("stopPoller", {collection : this}, this.stopCollectionPoller);

            function viewDestroy(){
                window.$(document).off("view:Destroy", viewDestroy);
                collection.poller.stop();
                collection.reset();
            }

            window.$(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
        },

        startCollectionPoller: function(event){
            !!event.data.collection.poller && event.data.collection.poller.start();
        },
        
        stopCollectionPoller: function(event){
            !!event.data.collection.poller && event.data.collection.poller.stop();
        },

    });
    return NodeCollection;
});




