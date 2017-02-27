/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/util", "models/latency/nodemodel", 
        "config/app-config", "config/view-config", "helper/job-table", "helper/AjaxManager"], 
function($, _, Backbone, Util, NodeModel, AppConfig, ViewConfig, JobTable, AjaxManager){
    var NodeCollection = Backbone.Collection.extend({
        model: NodeModel,
        initVariables :function(){
            this.clusterSizeAlertShown = false;
            this.clusterIntegrityAlertShown = false;
            this.parent = {};
            this.latencyHistory = {}; // map of node address to latency history
            this.historyFetched = false;
            this.latencyFetchError = false;
        },
        initialize : function(){
            try{
                this.bind('add', this.onModelAdded, this);
                this.bind('remove', this.onModelRemoved, this);
                this.initVariables();
                this._fetchLatencyHistory();
            }catch(e){
                console.log(e);
            }
        },

        _fetchLatencyHistory: function() {
          var that = this;
          var url = AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + '/nodes/';
          url += window.AMCGLOBALS.persistent.nodeList.join(',');
          url += '/latency_history';

          AjaxManager.sendRequest(url, {}, 
            function success(history) {
              that.historyFetched = true;
              that.latencyHistory = history;
              that._initNodes();
            }, function error() {
              that.historyFetched = true;
              that.latencyFetchError = true;
              that._initNodes();
            }
          );
        },

        _initNodes: function() {
          var that = this;
          this.each(function(model) {
            that._initNode(model);
          });
        },

        // initialize node based on fetch status
        _initNode: function(model) {
          var address = model.address;
          var history = this.latencyHistory[address];
          try {
            if(this.latencyFetchError) {
              model.initLatencyHistoryOnError();
            } else if(history) {
              model.initLatencyHistory(history);
            } else {
              console.log('INFO: History not yet fetched. Not initializing node ' + address);
            }
          } catch(e) {
            console.log(e);
          }
        },

        addModel: function(modelID, address, clusterID, totalNodes){
            var node = new NodeModel({model_id:modelID, address: address, cluster_id:clusterID, total_nodes:totalNodes});
            var history = this.latencyHistory[address];
            var that = this;
            var url;

            this.add(node);

            if(this.historyFetched) {
              if(history) {
                this._initNode(node);
              } else {
                url = AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + '/latency_history/' + address;
                AjaxManager.sendRequest(url, {},
                  function success(data) {
                    that.latencyHistory[address] = data;
                    that._initNode(node);
                  },
                  function failure() {
                    node.initLatencyHistoryOnError();
                  }
                );
              }
            }
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




