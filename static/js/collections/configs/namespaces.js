/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/util", "models/configs/statmodel", "views/configs/statview", "config/app-config", "config/view-config", "helper/edit-config"], function($, _, Backbone, Util, StatModel, StatView, AppConfig, ViewConfig, StatTable){
    var NamespaceCollection = Backbone.Collection.extend({
        model: StatModel,
        initVariables :function(){
        },
        initialize : function(){
            this.statTableID = AppConfig.stat.statTableDiv;
            this.statList = AppConfig.namespaceConfigList;
        },
        initializeGrid: function(){
            // StatTable.startInitGrid(AppConfig.namespaceConfigList);
        },
        clearAndInitGridData: function(){
            $(AppConfig.stat.statTableDiv).jqGrid('clearGridData');
            // StatTable.initAndSetGridData(AppConfig.namespaceConfigList);
            // $(AppConfig.stat.statTableDiv).trigger("reloadGrid");
        },
        addModel: function(address, clusterID, namespaceName){
            var namespace = new StatModel();
            namespace.setParamaters(address, clusterID, 'namespace', AppConfig.stat.statTableDiv, AppConfig.namespaceConfigList, namespaceName);
            namespace.colView = new StatView({el : ("[id='statListTable_" + address + "']")});
            this.add(namespace);
            return namespace;
        }
    });
    return NamespaceCollection;
});


