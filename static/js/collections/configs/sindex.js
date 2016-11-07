/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/util", "models/configs/statmodel", "views/configs/statview", "config/app-config", "config/view-config", "helper/edit-config"], function($, _, Backbone, Util, StatModel, StatView, AppConfig, ViewConfig, StatTable){
    var SIndexesCollection = Backbone.Collection.extend({
        model: StatModel,
        initialize : function(){
//            this.statTableID = AppConfig.stat.statTableDiv;
//            this.statList = AppConfig.namespaceConfigList;
        },
        initializeGrid: function(){
            // StatTable.startInitGrid(AppConfig.sIndexStatsList);
        },
        clearAndInitGridData: function(){
            $(AppConfig.stat.statTableDiv).jqGrid('clearGridData');
            // StatTable.initAndSetGridData(AppConfig.sIndexStatsList);
            // $(AppConfig.stat.statTableDiv).trigger("reloadGrid");
        },
        addModel: function(address, clusterID, tobeUsed){
            var sIndex = new StatModel();
            sIndex.colView = new StatView({el : ("[id='statListTable_" + address + "']")});
            sIndex.setParamaters(address, clusterID, 'sindex', AppConfig.stat.statTableDiv, AppConfig.sIndexStatsList, tobeUsed);
            this.add(sIndex);
            return sIndex;
        }
    });
    return SIndexesCollection;
});


