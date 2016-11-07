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

define(["underscore", "backbone", "poller", "config/app-config", "views/jobs/nodeview", "helper/util"], function(_, Backbone, Poller, AppConfig, NodeView, Util){
    var NodeModel = Backbone.Model.extend({
        initVariables :function(){
            this.expanded = {};
            this.jobList = {};
            this.jobIDList = [];
            this.modelID = this.get("model_id");
            this.totalNodes = +this.get("total_nodes");
            this.address = this.get("address");
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
            this.subGridEnabled = {};
            this.startEventListeners();
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + AppConfig.job.resourceUrl + this.address;
        },
        initialize :function(){
			this.CID = window.AMCGLOBALS.currentCID;
            try{
                this.initVariables();
//                this.startMonitoringAlerts();
            }catch(e){
                console.info(e.toString());
            }
        },
        fetchSuccess: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
            var nodeStatus = model.attributes['node_status'];
            var build = typeof model.attributes['build'] !== "undefined" ? model.attributes['build'] : "3.6.0";
            if(nodeStatus === 'on'){
                var jobList = model.attributes['jobs'];
                var oldJobIDList = model.jobIDList;
                var newJobIDList = model.setJobIDList(jobList);
                var newJobIDList = [];
                if(!_.isUndefined(jobList)){
                    newJobIDList = model.setJobIDList(jobList);
                }
                
                if(_.isEqual(oldJobIDList, newJobIDList)){
                    for(var jobI in oldJobIDList){
                        var jobID = oldJobIDList[jobI];
                        var rowID = model.modelID + '_' + jobID;
                        jobList[jobID].build = build;
                        model.rowView[jobID].render(model, jobList[jobID]);
                    }
                }else{
                    var removedJobs = _.difference(oldJobIDList, newJobIDList);
                    var newJobs = _.difference(newJobIDList, oldJobIDList);
                    for(var jobI in removedJobs){
                        var jobID = removedJobs[jobI];
                        var rowID = model.modelID + '_' + jobID;
                        model.rowView[jobID].removeRow();
                        model.rowView[jobID] = null;
                        jQuery(AppConfig.node.nodeTableDiv).delRowData(rowID);
                        //remove the row i.e view from the container
                        jQuery(AppConfig.job.nodeTableCompletedJobsDiv).delRowData(rowID);
                    }
                    for(var jobI in newJobs){
                        var jobID = newJobs[jobI];
                        var rowID = model.modelID + '_' + jobID;
                        //jobList[jobID].expanded = false;
                        jobList[jobID].build = build;
                        model.subGridEnabled[rowID] = false;
                        model.rowView[jobID] = new NodeView({'modelID' : model.modelID, 'rowID' : rowID, 'jobID' : jobID});
                        model.rowView[jobID].render(model, jobList[jobID]);
                    }
                    model.jobIDList = newJobIDList;
                    model.jobList = jobList;
                }
            }else{
                var oldJobIDList = model.jobIDList;
                for(var jobI in oldJobIDList){
                    var jobID = oldJobIDList[jobI];
                    var rowID = model.modelID + '_' + jobID;
                    var tempData = AppConfig.blankJobData(model.address, 'N/A');
                    model["jobList"][jobID] = tempData;
                    model["jobList"][jobID].build = build;
                    model.rowView[jobID].renderNetworkError(model, tempData);
                }
            }
			
			if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				this.clusterID = window.AMCGLOBALS.persistent.clusterID;
				 
			}
			
			if(typeof model.attributes.error !== 'undefined' && model.attributes.error.indexOf("Invalid cluster id") != -1){
				delete model.attributes.error;
				Util.clusterIDReset();				
			}
        },
        setJobIDList: function(jobList){
            var jobIDList = [];
            jobIDList = _.map(jobList, function(num, key){ return key; });
            return jobIDList;
        },
        removeDevBuildString:function(build){
            var n = build.indexOf('-');
            build = build.substring(0, n != -1 ? n : build.length);
            return build;
        },
        fetchError: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
			
            var that = this;
            var build = typeof model.attributes['build'] !== "undefined" ? model.attributes['build'] : "3.6.0";
            try{
				if(!(!AMCGLOBALS.pageSpecific.GlobalPollingActive && that.stop()) && this.active()){
					var oldJobIDList = model.jobIDList;
					for(var jobI in oldJobIDList){
						var jobID = oldJobIDList[jobI];
						var rowID = model.modelID + '_' + jobID;
						var tempData = AppConfig.blankJobData(model.address, 'N/E');
						model["jobList"][jobID] = tempData;
                        model["jobList"][jobID].build = build;
						model.rowView[jobID].renderNetworkError(model, tempData);
					}
				}				
            }catch(e){
                console.info(e.toString());
            }
        },

        startEventListeners : function (){
            var that = this;
            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            };

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
        },
        
        
    });

    return NodeModel;
});



  