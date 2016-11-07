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

define(["jquery", "underscore", "backbone", "poller", "models/common/MultiCluster", "views/common/MultiClusterView", "config/app-config", "config/view-config", "helper/util"], function($, _, Backbone, Poller, MultiCluster, MultiClusterView, AppConfig, ViewConfig, Util){
    var MultiClusters = Backbone.Collection.extend({
        model: MultiCluster,
        _idAttr: "cluster_id",

        initialize : function(options){
            this.lastResponse = null;
            try {
                // Initialize variables
                this.initVariables();

                // Initialize events on whole collection
                this.initEventListener();

                // Setup polling
                this.updatePoller(options);
            } catch(e) {
                console.info(e.toString());
            }
        },

        initVariables: function(options){
            $(AppConfig.header.multipleClusterListContainer).addClass("active");
            if(!$("#wrap").hasClass("fullScreen")){
                $("#wrap").addClass("fullScreen");
            }
            window.AMCGLOBALS.pageSpecific.multiClusterView = new MultiClusterView({
                el : AppConfig.header.multipleClusterListContainer,
                collection: this
            });
        },

        url: function(){
            return AppConfig.multicluster.multiclusterurls.GET_MULTICLUSTER_VIEW + "/" + window.AMCGLOBALS.persistent.xdrPort; 
        },

        parse: function(resp, options) {
            //console.log("in parse");
            var data = {}, models = [];
            for(var key in resp.data){
                var id = Util.removeDotAndColon(key);
                if (id !== key) {
                    id = "cluster" + id;
                }
                var cluster = resp.data[key];
                cluster["cluster_id"] = id;
                models.push(cluster);
                data[id] = cluster;
                for(var nodeKey in cluster.nodes){
                    var newKey = Util.removeDotAndColon(nodeKey);
                    if(newKey !== nodeKey){
                        cluster.nodes["node" + newKey] = cluster.nodes[nodeKey];
                        delete cluster.nodes[nodeKey];
                    }
                }
                for(var clusterKey in cluster.xdr_info){
                    var newKey = Util.removeDotAndColon(clusterKey);
                    if(newKey !== clusterKey){
                        cluster.xdr_info["cluster" + newKey] = cluster.xdr_info[clusterKey];
                        delete cluster.xdr_info[clusterKey];
                    }
                }
            }
            resp.data = data;
            return models;
        },

        fetchSuccess: function(collection, resp, options){ 
            //console.log("in fetchSuccess");
            /*var data = multiclusterData();
            window.AMCGLOBALS.pageSpecific.multiClusterView.render(data);*/  
            if(resp.status === "success" && resp.data !== null){
                this.lastResponse = resp;
                window.AMCGLOBALS.pageSpecific.multiClusterView.render(resp);
            } else {
                console.log("Status is not success or data is null");
            }
        },
        
        fetchError: function(collection, resp, options){
            //console.log("in fetchError");
        },
        
        updatePoller : function(options){
            if(options.poll){
                this.multiclusterPoller = Util.initPoller( this, _.extend( AppConfig.pollerOptions(AppConfig.multicluster.pollInterval), {update : true}) ).start();
            } else {
                this.multiclusterPoller = Util.initPoller( this, _.extend( AppConfig.pollerOptions(AppConfig.multicluster.pollInterval), {update : true}) ).stop();
            }
        },

        initEventListener: function(){
            var collection = this;   
            function multiclusterViewDestroy(){
                console.log("distroying multicluster view");
                window.$(document).off("view:multiclusterDestroy", multiclusterViewDestroy);
                collection.multiclusterPoller.stop();
                collection.reset();
                
                //$(".multi-cluster").remove();
                if(window.AMCGLOBALS.pageSpecific.multiClusterView !== undefined && window.AMCGLOBALS.pageSpecific.multiClusterView !== null)
                    window.AMCGLOBALS.pageSpecific.multiClusterView.emptyContainer();
                //$("#wrap").removeClass("fullScreen");
                window.AMCGLOBALS.pageSpecific.multiclusters = null;
                window.AMCGLOBALS.pageSpecific.multiClusterView = null;
                $("#rightPanelCloseButton").css('display', 'block');
            } 

            window.$(document).off("view:multiclusterDestroy", multiclusterViewDestroy).on("view:multiclusterDestroy", multiclusterViewDestroy);
        }
    });
    
    return MultiClusters;
});
