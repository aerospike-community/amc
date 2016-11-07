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

define(["jquery", "underscore", "backbone", "helper/definitions/sindex-table", "helper/jqgrid-helper", "config/view-config", "config/app-config" ], function($, _, Backbone, SIndexTable, GridHelper, ViewConfig, AppConfig){
    
    var SIndexView = Backbone.View.extend({
        initialize: function(){
            this.tableDiv = this.options.tableDiv;
            this.indexName = this.options.indexName;
        },
        render: function(model, newData, rowID){
            newData = this.formatRowData(newData, rowID);
            SIndexTable.updateRowData(this.tableDiv,  newData, rowID);
            
        },
        renderNetworkError: function(model){
        },
        formatRowData: function(newData, rowID){
            if(newData['sync_state'] !== 'synced'){
                newData['sync_state'] = 'YES';
            }else{
               var synButtonID = 'sIndexTable_'+rowID;
               newData['sync_state'] = '<div class="not-sync" id="'+synButtonID+'"><u>NO</u></div>'
               //ADD EVENT LISTENER 'NO'
               $('#'+synButtonID).click(function(e){
                $("#syncedDialog").dialog({
                    dialogClass: 'sync-dialog'
                });
            });
            }
            
            return newData;
        },
        
    });
    
    return SIndexView;
});




