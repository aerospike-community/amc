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

define(["jquery", "underscore", "backbone", "helper/util", "models/statistics/statmodel", "views/statistics/statview", "config/app-config", "config/view-config", "helper/stat-table"], function($, _, Backbone, Util, StatModel, StatView, AppConfig, ViewConfig, StatTable){
    var NodeCollection = Backbone.Collection.extend({
        model: StatModel,
        initialize : function(){
        },
        initializeGrid: function(){
            // StatTable.startInitGrid(AppConfig.nodeStatsList);
        },
        clearAndInitGridData: function(){
            $(AppConfig.stat.statTableDiv).jqGrid('clearGridData');
            // StatTable.initAndSetGridData(AppConfig.nodeStatsList);
            // $(AppConfig.stat.statTableDiv).trigger("reloadGrid");
        },
        addModel: function(address, clusterID, tobeUsed){
            var node = new StatModel();
            node.colView = new StatView({model: node, el : ("[id='statListTable_" + address + "']")});
            this.add(node);
            node.setParamaters(address, clusterID, 'nodes', AppConfig.stat.statTableDiv, AppConfig.nodeStatsList, tobeUsed);
            return node;
        }
    });
    return NodeCollection;
});


