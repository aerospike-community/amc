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
    
    var StorageView = Backbone.View.extend({
        initialize: function(){
            this.tableDiv = this.options.tableDiv;
            this.indexName = this.options.indexName;
        },
        render: function(model, newData, rowID){
            newData = this.formatRowData(newData, rowID);
            SIndexTable.updateRowData(this.tableDiv,  newData, rowID);
            
        },
        renderNetworkError: function(model, newData, rowID){
            SIndexTable.updateRowData(this.tableDiv,  newData, rowID);
        },
        startEventHandlers: function(data){
            var synButtonID = 'storageSyncBtn';
            var that = this;
            $('#'+synButtonID+'').click(function(e){
                that.displaySyncedDetails(data);
                $("#syncedDialog").dialog({
                    width: 500,
                    closeOnEscape: true,
                    dialogClass: 'sync-dialog'
                });
           });
        },
        displaySyncedDetails: function(storageData){
            var syncNodeHtml= '';
            $('#syncedDetailsContainer').empty();
            $('#syncedDetailsContainer').show();
            var storageList = [];
            var totalStorages = 0;
            for(var storage in storageData){
                storageList[totalStorages] = {};
                storageList[totalStorages]['storageName']  = storage;
                storageList[totalStorages]['nodeList']  = storageData[storage];
                storageList[totalStorages]['totalNodes']  = _.size(storageData[storage]);
                totalStorages++;
            }
            
            var dominantStorage = _.max(storageList, function(storageList){ return storageList.totalNodes; });
            var inferiorStorage  = _.min(storageList, function(storageList){ return storageList.totalNodes; });
            
            if(dominantStorage.totalNodes === inferiorStorage.totalNodes){
                for(var i in storageList){
                    syncNodeHtml += this.getSyncNodeList(storageList[i].storageName, storageList[i].nodeList, 'blue');
                }
            }else{
                syncNodeHtml += this.getSyncNodeList(inferiorStorage.storageName, inferiorStorage.nodeList, 'red');
                if(totalStorages > 2){
                    var restStorage = _.difference(storageList, dominantStorage, inferiorStorage)
                    for(var i in restStorage){
                        syncNodeHtml += this.getSyncNodeList(restStorage[i].storageName, restStorage[i].nodeList, 'red');
                    }
                }
                syncNodeHtml += this.getSyncNodeList(dominantStorage.storageName, dominantStorage.nodeList, 'green');
                
            }

            $('#syncedDetailsContainer').html(syncNodeHtml)
        },
        getSyncNodeList: function(storageName, nodeList, nodesColor){
            var node;
            var tempStr = '';
            tempStr += '<div>'+
                        '<div class="synced-subheader-container"><span class="synced-subheader">'+storageName+'</span></div>'+
                        '<ol class="synced-list">';
                        for(var nodeI in nodeList){
                            node = nodeList[nodeI];
                            tempStr +='<li class="synced-details-address ui-widget-content '+nodesColor+'">'+
                                '<span class="li-node-addr">'+node+'</span>'+
                            '</li> ';

                        }
            tempStr += '</ol></div>';
            return tempStr;
        },
        formatRowData: function(newData, rowID){
            if(newData['synced'] === true){
                newData['synced'] = 'YES';
            }else{
               var synButtonID = 'storageSyncBtn';
               newData['synced'] = '<div class="not-sync" id="'+synButtonID+'"><u>NO</u></div>';
            }
            return newData;
        },
        
    });
    
    return StorageView;
});




