/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["underscore", "backbone", "poller", "config/app-config", "helper/util", "helper/edit-config"], function(_, Backbone, Poller, AppConfig, Util, EditConfig){
    var NamespaceModel = Backbone.Model.extend({
        url: function(){
            if(this.modelType === 'nodes'){
                this.URL =  AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.node.resourceUrl + this.address + '/allconfig';
            }else if(this.modelType === 'namespace'){
                 this.URL =  AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.namespace.resourceUrl + window.AMCGLOBALS.persistent.namespaceName + '/nodes/'+ this.address + '/allconfig';
            }else if(this.modelType === 'xdr'){
                 this.URL =  AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.xdr.resourceUrl + window.AMCGLOBALS.persistent.xdrPort + AppConfig.node.resourceUrl + this.address + '/allconfig';
            }else if(this.modelType === 'sindex'){
                  this.URL =  AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.namespace.resourceUrl + window.AMCGLOBALS.persistent.namespaceName + '/sindexes/' + window.AMCGLOBALS.persistent.indexName +'/nodes/'+ this.address + '/allconfig';
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
            this.rendered = false;
        },

        startEventListeners : function (){
            var that = this;

            this.lazyRender = function(){
				if(!that.rendered){
					that.rendered = true;
                	that.colView.render(that, that.attributes);
				}
            }

            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            }

            $(AppConfig.stat.statTableDiv).on("renderall", {"model" : this}, this.redrawGrid);

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);

            window.$("#statContainer").off("createGrid", that.lazyRender).on("createGrid", that.lazyRender);
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

            var that=this;
			console.log("in");
            if( $("#statContainer").is(":visible") ){
                response.colView.render(response, response.attributes);
                console.log("rendered");
            } else{
                that.rendered = false;
            }

            window.AMCGLOBALS.pageSpecific.nodeDataPolled += 1;
            Util.stopStatPoller(response);
            /*
            if(window.AMCGLOBALS.pageSpecific.nodeDataPolled >= window.AMCGLOBALS.persistent.selectedNodes.length)
                EditConfig.initInputForm();*/
			if(response.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				response.clusterID = window.AMCGLOBALS.persistent.clusterID;
				 
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
                response.setTimeOut = setTimeout(function(){
                    var col = response.colView;
                    col.renderNetworkError(response);
                    Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, true);
                 },AppConfig.retryDelayTime);
             }catch(e){
                    console.info(e.toString());
             }
        }
        
    });

    return NamespaceModel;
});



  
