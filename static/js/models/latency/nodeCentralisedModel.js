/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["underscore", "backbone", "poller", "config/app-config", "helper/util", "models/latency/nodemodel", "collections/latency/nodes"], function(_, Backbone, Poller, AppConfig, Util, NodeModel, NodeCollection){
    var NodeModel = Backbone.Model.extend({
        initVariables :function(){
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;
			this.startEventListeners();
			this.nodes = [];

			this.nodeCollection = new NodeCollection(); 
			this.nodeCollection.parent = this;
            this.createNewGridCollection(this.nodeCollection, window.AMCGLOBALS.persistent.selectedNodes, window.AMCGLOBALS.persistent.selectedNodes.length);
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + '/latency/' + this.nodes.toString();
        },
        initialize :function(model){
			this.CID = window.AMCGLOBALS.currentCID;
			var that = this;
            this.initVariables();
        },
		
      onTimeZoneChanged: function() {
        this.fetch();
      },
		
        fetchSuccess: function(response){
        	if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
            try{
                response.nodeCollection.each(function(model, index){
                    _.extend(model.attributes, response.attributes[model.address]);
                    model.fetchSuccess(model);
                });
            }catch(e){
                this.start();
                console.info(e.toString());
            }
			
			if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				this.clusterID = window.AMCGLOBALS.persistent.clusterID; 
			}
        },
        
        fetchError: function(model){
            var that = this;
            if(model.CID !== window.AMCGLOBALS.currentCID){
                model.destroy();
            }
            
            try{
                if(!(!AMCGLOBALS.pageSpecific.GlobalPollingActive && that.stop()) && that.active()){
                    model.nodeCollection.each(function(indModel, index){
                        _.extend(indModel.attributes, model.attributes[indModel.address]);
                        indModel.fetchError(indModel);
                    });
                }
            }catch(e){
                console.info(e.toString());
            }
            console.info("err");
        },

      updateWindow: function(timeWindowSize, fixTimeWindowSize) {
        this.nodeCollection.each(function(model) {
          model.updateWindow(timeWindowSize, fixTimeWindowSize);
        });
      },

        startEventListeners : function (){
            var that = this;

            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            }

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
			
			//Binding panel state to pollers
			var container = $(".latency .card_layout:first");
			
			container.off("startPoller", that.startModelPoller).on("startPoller", {model : that}, that.startModelPoller);
			container.off("stopPoller", that.stopModelPoller).on("stopPoller", {model : that}, that.stopModelPoller);

      Util.registerTimeZoneChangeCallback(function() {
        that.onTimeZoneChanged();
      });
        },
		
		startModelPoller: function(event){
			event.data.model.nodeCollection.models.forEach(function(model){
				model.insertSliceHistory(model);
			});
			var polOptions = _.extend({delayed : 10000}, AppConfig.pollerOptions(AppConfig.updateInterval['latency']));
			Util.initPoller(event.data.model, polOptions).start();
		},
		
		stopModelPoller: function(event){
			var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['latency']);
			Util.initPoller(event.data.model, polOptions).stop();
		},

        createNewGridCollection: function(collection, list, totalElements, optionalParameter){
            //Optional Parameter : xdrPort or namespace name
            totalElements = list.length;
            for(var i=0; i < totalElements ;i++){
                Util.createNewModel(this, collection, i, list[i], 2, 'latency', optionalParameter);
            }
        }
        
        
    });

    return NodeModel;
});



  
