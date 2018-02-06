/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["underscore", "backbone", "poller", "config/app-config", "helper/util", "views/configs/restoreview"], function(_, Backbone, Poller, AppConfig, Util, restoreView){
    var backupModel = Backbone.Model.extend({
        defaults : {
            restoreMessage : '',
            restoreStatus : ''
        },
       
        initialize :function(){
			this.CID = window.AMCGLOBALS.currentCID;
			this.view = new restoreView({model : this});
            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['restore']);
            this.restorePoller = Util.initPoller(this,polOptions);
			this.currentBackupId = null;
			this.polling = false;
			this.prefillData = null;
			this.availableBackupList = [];
			this.availableBackupListFetched = false;
        },

        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.restore.resourceUrl;
        },
		
        fetchSuccess: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
			var that = response;
			var data = response.attributes;
			if(data.status === "failure"){
                that.set('restoreMessage', data.error);
            	delete data.error;
			} else if(data.status === "Success"){
                that.set('restoreMessage','Cluster successfully restored');
            } else if(data.status === "In Progress"){
                that.set('restoreMessage','Restoring. Please wait!');
            }
            that.set("restoreStatus" , data.status)
        },
		
        fetchError: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
			
			var that = this;
            try{
            	!response.polling && !AMCGLOBALS.pageSpecific.GlobalPollingActive && that.stop();
            }catch(e){
                console.info(e.toString());
            }
        },
		
		updatePoller : function(){
			if(this.polling)
				Util.updateModelPoller(this, AppConfig.updateInterval['restore'], true);
			else
				Util.updateModelPoller(this, AppConfig.updateInterval['restore'], false);
		}
       
    });

    return backupModel;
});



  
