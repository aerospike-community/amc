/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["underscore", "backbone", "views/common/alertview", "config/app-config", "helper/util"], function(_, Backbone, AlertView, AppConfig, Util){
   var AlertModel = Backbone.Model.extend({
        initialize :function(){
            this.initVariables();
        },

		initVariables: function(){
			var that = this;
		    this.clusterID = window.AMCGLOBALS.persistent.clusterID;
            this.lastAlertID = 0;
            this.attributes = [];
            $(document).off("view:DestroyAlert").on("view:DestroyAlert",function(){
                that.destroy();
            });
        },

        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + AppConfig.alerts.resourceUrl +'?last_id='+ this.lastAlertID;
        },
        
        fetchSuccess: function(response){
            
			if(response.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				response.clusterID = window.AMCGLOBALS.persistent.clusterID;
				 
			}
			
			if(typeof response.attributes.error !== 'undefined' && response.attributes.error.indexOf("Invalid cluster id") != -1){
				delete response.attributes.error;
				Util.clusterIDReset();
			}
        },
        fetchError: function(response){
            var that = this;
            try{
            	if(that.xhr && that.xhr.status === 401) {
            		Util.showUserSessionInvalidateError();
            		return;
            	}
            	!AMCGLOBALS.pageSpecific.GlobalPollingActive && that.stop();
            }catch(e){
                console.info(e.toString());
            }
        }
    });
    return AlertModel;
});
