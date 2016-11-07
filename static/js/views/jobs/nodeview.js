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

define(["jquery", "underscore", "backbone", "helper/job-table", "helper/jqgrid-helper", "config/view-config", "config/app-config" ], function($, _, Backbone, JobTable, GridHelper, ViewConfig, AppConfig){

    var NodeView = Backbone.View.extend({
        isInitialized: false,
        initialize: function(){
            this.rowID = this.options.rowID;
            this.modelID = this.options.modelID;
            this.jobID = this.options.jobID;
        },
        removeRow: function(){
            var selRow = $('#'+this.rowID),
                nextRow = selRow.next();

            if (nextRow.hasClass('ui-subgrid')) {
                nextRow.remove();
            }

            $(AppConfig.node.nodeTableDiv).delRowData(this.rowID);
            $(AppConfig.job.nodeTableCompletedJobsDiv).delRowData(this.rowID);

            var jobs = $("#nodeListTable tr").not(".jqgfirstrow");
            var completedJobs = $("#nodeListTableCompletedJobs tr").not(".jqgfirstrow");

            if( jobs.length === 0 ){
                $("#nodeListTable").addClass("no-jobs");
            }

            if( completedJobs.length === 0 ){
                $("#nodeListTable").addClass("no-jobs");
            }

            this.remove();
        },
        render: function(model, newData){
            if(newData.status.startsWith('done')){
                $(AppConfig.node.nodeTableDiv).jqGrid('delRowData', this.rowID);
                this.createJobListRow(AppConfig.job.nodeTableCompletedJobsDiv,  newData, this.rowID, this.jobID, model, false);
            }else{
                this.createJobListRow(AppConfig.node.nodeTableDiv,  newData, this.rowID, this.jobID, model, false);
            }

            model.data = newData;
        },
        renderNetworkError: function(model , newData){
            this.createJobListRow(AppConfig.node.nodeTableDiv, newData, this.rowID, this.jobID, model, true);
            this.createJobListRow(AppConfig.job.nodeTableCompletedJobsDiv, newData, this.rowID, this.jobID, model, true);
            model.data = newData;
        },
        createJobListRow: function(container, data, rowID, jobID, model, isError){
            $(container).removeClass("no-jobs");
            JobTable.createOrUpdateRow(container, data, rowID, model, isError);
            JobTable.updateRow(container, data, rowID);
            if(!isError){
                data['mem_pie_chart'] = GridHelper.jqCustomPieFormatter(null, container, rowID, ViewConfig.tablePieConfig, data['mem_arr'], 5);
            }

            if(model.subGridEnabled[rowID] === true){
                var expandContainer = container.substr(1)+'_'+ rowID;
                var tableHtmlStr = "";
                if(Util.versionCompare(data.build,"3.6.0") >= 0){
                    tableHtmlStr = GridHelper.create2LevelTable("job","nodeExpanded_"+ rowID, "expandDynamic", data);
                }else{
                    tableHtmlStr = GridHelper.create2LevelTable("jobOldVersion","nodeExpanded_"+ rowID, "expandDynamic", data);
                }
                $("#" + expandContainer).html(tableHtmlStr);
            }
        }


    });

    return NodeView;
});




