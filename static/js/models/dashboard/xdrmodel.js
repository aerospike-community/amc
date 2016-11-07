/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["underscore", "backbone", "poller", "config/app-config", "helper/util"], function(_, Backbone, Poller, AppConfig, Util){
    var XdrModel = Backbone.Model.extend({
        idAttribute : "address",
        
        initVariables :function(){
            this.totalNodes = +this.get("total_nodes");
            this.address = this.get("address");
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

        startEventListeners : function (){
            var that = this;
        },
        
        fetchSuccess: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
			
            try{
                if(typeof(response.attributes["error"]) !== "undefined")
                    return;
                var row = response.rowView;
                row.render(response, response.attributes);
            }catch(e){
                console.info(e);
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
			 try{
	                var row = response.rowView;
	                row.renderNetworkError(response);
	            }catch(e){
	                console.info(e.toString());
	          }
        }
    });

    return XdrModel;
});



  
