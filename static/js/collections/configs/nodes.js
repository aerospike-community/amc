/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/util", "models/configs/statmodel", "views/configs/statview", "config/app-config", "config/view-config", "helper/edit-config"], function($, _, Backbone, Util, StatModel, StatView, AppConfig, ViewConfig, StatTable){
    var NodeCollection = Backbone.Collection.extend({
        model: StatModel,
        initialize : function(){
        },
        initializeGrid: function(){
            // StatTable.startInitGrid(AppConfig.nodeConfigList);
        },
        clearAndInitGridData: function(){
            $(AppConfig.stat.statTableDiv).jqGrid('clearGridData',true);
            //StatTable.initAndSetGridData(AppConfig.nodeConfigList);
           // $(AppConfig.stat.statTableDiv).trigger("reloadGrid");
        },
        addModel: function(address, clusterID, tobeUsed){
            var node = new StatModel();
            node.colView = new StatView({el : ("[id='statListTable_" + address + "']")});
            this.add(node);
            node.setParamaters(address, clusterID, 'nodes', AppConfig.stat.statTableDiv, AppConfig.nodeConfigList, tobeUsed);
            return node;
        }
    });
    return NodeCollection;
});


