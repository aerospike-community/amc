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

define(["underscore", "backbone", "poller", "config/app-config", "views/jobs/nodeview", "helper/util", "helper/job-table"], 
function(_, Backbone, Poller, AppConfig, NodeView, Util, JobTable){
    var NodeModel = Backbone.Model.extend({
        initVariables :function(){
            this.expanded = {};
            this.jobList = {};
            this.jobIds = [];
            this.modelID = this.get("model_id");
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
            this.subGridEnabled = {};
            this.status = this.get("status");
            this.offset = 0;
            this.pageSize = this.get('page_size');
            this.limit = this.PageSize;
            this.container = this.get("container");
            this.offNodes = {};
            this.prevNodes = [];
            this.totalJobs = 0;  
            this.sortBy = '';
            this.sortOrder = '';

            if(this.status === 'completed') {
              this.pagerID = '#completedJobPager';
            } else {
              this.pagerID = '#runningJobPager';
            }

            this.startEventListeners();
        },
        url: function(){
            var clusterID = window.AMCGLOBALS.persistent.clusterID;
            var nodes = window.AMCGLOBALS.persistent.selectedNodes;
            var url = AppConfig.baseUrl + clusterID + '/nodes/' + nodes.join(',') + '/jobs?';
            if(! _.isEqual(nodes, this.prevNodes)) {
              this.offset = 0;
              this.limit = this.pageSize;
            }
            this.prevNodes = nodes;
            url += 'offset=' + this.offset;
            url += '&limit=' + this.limit;
            url += '&status=' + this.status;
            if(this.sortBy) {
              url += '&sort_by=' + this.sortBy;
              if(this.sortOrder) {
                url += '&sort_order=' + this.sortOrder;
              }
            }
            return url;
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

      toJobID: function(job) {
        var jobID;
        jobID = job['_address'] + '_' + job.trid;
        jobID = jobID.replace(':', '_').replace(/\./g, '');
        return jobID;
      },

      toRowID: function(job) {
        return this.modelID + '_' + this.toJobID(job);
      },

      fetchSuccess: function(model){
        if(model.CID !== window.AMCGLOBALS.currentCID){
          model.destroy();
        }
        var i;
        var job, jobs, build, jobID;
        var rowID;
        var oldJobs = model.jobIds;
        var jobIds = [];
        var jobList = {};
        jobs = model.attributes.jobs;
        
        _.each(jobs, function(job) {
          if(!job['_address']) {
            job['_address'] = job.address;
          } else {
            job.address = job['_address'];
          }
          jobIds.push(model.toJobID(job));
        });

        _.each(oldJobs, function(jobID) {
          var present = _.find(jobIds, function(id) {
            if(id === jobID) {
              return true;
            }
          });
          if(!present) {
            model.rowView[jobID].removeRow();
          }
        });

        for(i = 0; i < jobs.length; i++) {
          job = jobs[i];
          jobID = model.toJobID(job);
          rowID = model.toRowID(job);
          node = job.node;
          build = node.build || '3.6.0';
          jobList[jobID] = job;

          if(node.node_status === 'on'){
            var anOldJob;
            anOldJob = _.find(oldJobs, function(id) {
              if(id === job.trid) {
                return true;
              }
            });

            model.offNodes[job.address] = false;
            if(anOldJob) {
              model.jobList[jobID].build = build;
              model.rowView[jobID].render(model.container, job, model);
            } else {
              jobList[jobID].build = build;
              model.subGridEnabled[rowID] = false;
              model.rowView[jobID] = new NodeView({'modelID' : model.modelID, 'rowID' : rowID, 'jobID' : jobID});
              model.rowView[jobID].render(model.container, job, model);
            }
          } else {
            var tempData = AppConfig.blankJobData(job.address, 'N/A');
            if(!model.offNodes[job.address]) {
              model.offNodes[job.address] = true;
              model["jobList"][jobID] = tempData;
              model["jobList"][jobID].build = build;
              model.rowView[jobID].renderNetworkError(model.container, model, tempData);
            }
          }
        }

        model.jobIds = jobIds;
        model.jobList = jobList;

        if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
          this.clusterID = window.AMCGLOBALS.persistent.clusterID;

        }

        if(typeof model.attributes.error !== 'undefined' && model.attributes.error.indexOf("Invalid cluster id") != -1){
          delete model.attributes.error;
          Util.clusterIDReset();				
        }

        model.totalJobs = model.attributes.job_count;
        model.updatePages();
        JobTable.stopLoader(model.container);
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
        fetchError: function(model) {
          if(model.CID !== window.AMCGLOBALS.currentCID){
            model.destroy();
          }

          var that = this;
          var build = typeof model.attributes['build'] !== "undefined" ? model.attributes['build'] : "3.6.0";
          try{
            if(!(!AMCGLOBALS.pageSpecific.GlobalPollingActive && that.stop()) && that.active()){
              var oldJobIDList = model.jobIds;
              _.each(model.jobList, function(job) {
                var jobID = model.toJobID(job);
                var rowID = model.toRowID(jobID);
                var tempData = AppConfig.blankJobData(model.address, 'N/E');
                model["jobList"][jobID] = tempData;
                model["jobList"][jobID].build = build;
                model.rowView[jobID].renderNetworkError(model.container, model, tempData);
              });
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

            $(this.pagerID + ' .page-next').off('click').on('click', function(evt) {
              if(that.offset + that.limit < that.totalJobs) {
                that.offset += that.limit;
                that.fetchJobs();
              }
            });

            $(this.pagerID + ' .page-prev').off('click').on('click', function(evt) {
              if(that.offset >= that.limit) {
                that.offset -= that.limit;
                that.fetchJobs();
              }
            });
        },

      fetchJobs: function() {
        JobTable.showLoader(this.container);
        this.fetch();
      },

      sortTable: function(sortBy, sortOrder) {
        if(sortBy) {
          sortBy = sortBy.replace(/_/g, '-');
          if(sortBy === 'mem-pie-chart') {
              sortBy = 'mem-usage';
          }

          this.sortBy = sortBy;
          this.sortOrder = sortOrder;
          this.fetchJobs();
        }
      },

        updatePages: function() {
          var current = Math.floor(this.offset / this.limit) + 1;
          var total = Math.floor(this.totalJobs / this.limit);
          if(total === 0) {
            total = 1;
          }
          JobTable.updatePages(this.pagerID, current, total);
        },
        
    });

    return NodeModel;
});



  
