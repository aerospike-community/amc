/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["underscore", "backbone", "poller", "config/app-config", "helper/util", "views/configs/backupview"], function(_, Backbone, Poller, AppConfig, Util, BackupView){
    var backupModel = Backbone.Model.extend({
       
       defaults : {
            renderStatus : ''
       },
        
        initialize :function(){
			this.CID = window.AMCGLOBALS.currentCID;
			this.view = new BackupView({model : this});
            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['backup']);
            this.backupPoller = Util.initPoller(this,polOptions);
			this.currentBackupId = null;
			this.polling = false;
			this.waitForInitiationResponse = false;
			this.firstResponseReceived = false;
        },
        
         url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.backup.resourceUrl;
        },

        fetchSuccess: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
			var that = response;
			
			if(typeof response.attributes.error !== 'undefined'){
				if(response.attributes.error === "Ansible Not Found"){
					Util.disableAnsibleFunctionalities();
					this.stop();
					return;
				}else{
					delete response.attributes.error;
				}
			}

			try{
				if(that.currentBackupId != null && _.isEmpty(response.attributes) && that.firstResponseReceived){
                    that.set('renderStatus','Unknown Error');
					that.currentBackupId = null;
				} else if(!that.waitForInitiationResponse && !that.firstResponseReceived){
					if(typeof response.attributes[that.currentBackupId] !== 'undefined')
						that.firstResponseReceived = true;
				}
				for(var backupID in response.attributes){
                    if(response.defaults && !response.defaults.hasOwnProperty(backupID)){
                        var container = $("#clusterBackupProgress ul").find("li#" + backupID).find(".backup-progress");
                        if(response.attributes[backupID].progress.status === "Success" && !that.waitForInitiationResponse){
                            if(backupID === that.currentBackupId){
                                response.set("renderStatus","success");
                                that.currentBackupId = null;
                            }
                            delete response.attributes[backupID];
                            response.view.updateProgress(container, "Success", "100%");
                        } else if(response.attributes[backupID].progress.status === "Failure" && !that.waitForInitiationResponse){
                            if(backupID === that.currentBackupId){
                                that.set('renderStatus',response.attributes[backupID].progress.error);
                                that.currentBackupId = null;
                            }

                            delete response.attributes[backupID];
                            response.view.updateProgress(container, "Failure", "0%");
                        }
                    }
					
				}
				
                for(var key in response.defaults){
					delete response.attributes[key];
				}
                response.view.render(response.attributes);
               	
				for(var key in response.attributes){
					delete response.attributes[key];
				}
                
			} catch(e){
				console.log(e);
			}
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
				Util.updateModelPoller(this, AppConfig.updateInterval['backup'], true);
			else
				Util.updateModelPoller(this, AppConfig.updateInterval['backup'], false);
		}
       
    });

    return backupModel;
});



  
