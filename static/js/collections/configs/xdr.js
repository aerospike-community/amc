/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/util", "models/configs/statmodel", "views/configs/statview", "config/app-config", "config/view-config", "helper/edit-config"], function($, _, Backbone, Util, StatModel, StatView, AppConfig, ViewConfig, StatTable){
    var XDRCollection = Backbone.Collection.extend({
        model: StatModel,
        initialize : function(){
            this.statTableID = AppConfig.stat.statTableDiv;
            this.statList = AppConfig.xdrConfigList;
        },
        initializeGrid: function(){
            // StatTable.startInitGrid(AppConfig.xdrConfigList);
        },
        clearAndInitGridData: function(){
            $(AppConfig.stat.statTableDiv).jqGrid('clearGridData');
            // StatTable.initAndSetGridData(AppConfig.xdrConfigList);
            // $(AppConfig.stat.statTableDiv).trigger("reloadGrid");
        },
        addModel: function(address, clusterID, xdrPort){
            var xdr = new StatModel();
            xdr.setParamaters(address, clusterID, 'xdr', AppConfig.stat.statTableDiv, AppConfig.xdrConfigList, xdrPort);
            xdr.colView = new StatView({el : ("[id='statListTable_" + address + "']")});
            this.add(xdr);
            return xdr;
        }
    });
    return XDRCollection;
});


