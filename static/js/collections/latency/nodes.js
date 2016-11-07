/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/util", "models/latency/nodemodel", "config/app-config", "config/view-config", "helper/job-table"], function($, _, Backbone, Util, NodeModel, AppConfig, ViewConfig, JobTable){
    var NodeCollection = Backbone.Collection.extend({
        model: NodeModel,
        initVariables :function(){
            this.clusterSizeAlertShown = false;
            this.clusterIntegrityAlertShown = false;
            this.parent = {};
        },
        initialize : function(){
            try{
                this.bind('add', this.onModelAdded, this);
                this.bind('remove', this.onModelRemoved, this);
                this.initVariables();
                //JobTable.initNodeGrid(AppConfig.node.nodeTableDiv, ViewConfig.nodePieConfig, this.models);
            }catch(e){
                console.info(e.toString());
            }
        },
        addModel: function(modelID, address, clusterID, totalNodes){
            var node = new NodeModel({model_id:modelID, address: address, cluster_id:clusterID, total_nodes:totalNodes});
            this.add(node);
        },
        onModelAdded: function(model, collection, options){
            this.parent.nodes.push(model.address);
            Util.updateModelPoller(this.parent, AppConfig.updateInterval['nodes'], true);
        },
        onModelRemoved: function(model, collection, options){
            if(this.parent.nodes != null){
                this.parent.nodes.splice(this.parent.nodes.indexOf(model.address),1);
            }
            $(AppConfig.node.nodeTableDiv).jqGrid('delRowData',/*AppConfig.node.nodeTablePrefix + */model.get("row_id"));
        }
        
    });
    return NodeCollection;
});




