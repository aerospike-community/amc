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

define(["jquery", "underscore", "backbone", "helper/util", "models/jobs/nodemodel", "views/jobs/nodeview", "config/app-config", "config/view-config", "helper/job-table"], function($, _, Backbone, Util, NodeModel, NodeView, AppConfig, ViewConfig, JobTable){
    var PAGE_SIZE = 20;
    var NodeCollection = Backbone.Collection.extend({
        model: NodeModel,
        initVariables :function(){
            this.clusterSizeAlertShown = false;
            this.clusterIntegrityAlertShown = false;
        },
        initialize : function(){
            try{
                this.initVariables();
                JobTable.initNodeGrid(AppConfig.node.nodeTableDiv, ViewConfig.nodePieConfig, this.models, AppConfig.job.runningJobPager, PAGE_SIZE, 'inprogress');
                JobTable.initNodeGrid(AppConfig.job.nodeTableCompletedJobsDiv, ViewConfig.nodePieConfig, this.models, AppConfig.job.completedJobPager, PAGE_SIZE, 'completed');
            }catch(e){
                console.info(e.toString());
            }
        },
        addModel: function(modelID, clusterID, status, container){
            var node = new NodeModel({model_id:modelID, cluster_id:clusterID, status: status, container: container, page_size: PAGE_SIZE});
            node.rowView = {};
            this.add(node);
        }
        
    });
    return NodeCollection;
});




