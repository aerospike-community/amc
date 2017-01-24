/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/edit-config", "helper/jqgrid-helper", "config/view-config", "config/app-config" ], function($, _, Backbone, StatTable, GridHelper, ViewConfig, AppConfig){
    
    var StatView = Backbone.View.extend({
        initialize: function( options ){
            this.el = options.el;
        },
        
        lazyRender: function(event){
            event.data.model.colView.render(event.data.model);
        },

        render: function(model){
            if( !window.AMCGLOBALS.pageSpecific.configGridSet )
                StatTable.startInitGrid([]);

            window.AMCGLOBALS.pageSpecific.configGridSet = true;

            if( this.attrList == null ){
                switch(model.modelType){
                    case "nodes" :
                        this.attrList = "nodeConfigList"; break;
                    case "namespace" :
                        this.attrList = "namespaceConfigList"; break;
                    case "xdr" :
                        this.attrList = "xdrConfigList"; break;
                }

                window.AMCGLOBALS.pageSpecific.lazyRender = window.AMCGLOBALS.pageSpecific.lazyRender || [];
                window.AMCGLOBALS.pageSpecific.lazyRendered = window.AMCGLOBALS.pageSpecific.lazyRendered || [];
                window.AMCGLOBALS.pageSpecific.statListGenerated = ! _.isEmpty( AppConfig[this.attrList] );

                if(!window.AMCGLOBALS.pageSpecific.statListGenerated && model['attributes'].node_status === "on" && (model.modelType !== "xdr" || model['attributes'].xdr_status === "on") ){
                    window.AMCGLOBALS.pageSpecific.statListGenerated = true;
                    AppConfig[this.attrList] = _.keys(model['attributes']);
                }
                
                model.statList = AppConfig[this.attrList];
                if( _.isEmpty( $('#statListTable').jqGrid('getGridParam','data') ) && window.AMCGLOBALS.pageSpecific.statListGenerated ){
                    StatTable.initAndSetGridData(AppConfig[this.attrList], model.modelType);
                    window.$(AppConfig.stat.statTableDiv).trigger("renderall", [window.AMCGLOBALS.pageSpecific.lazyRender]);
                }
            }

            if( !_.isEmpty( _.difference( window.AMCGLOBALS.persistent.selectedNodes,  window.AMCGLOBALS.pageSpecific.lazyRender) ) && !window.AMCGLOBALS.pageSpecific.statListGenerated && (model['attributes'].node_status === "off" || model['attributes'].xdr_status === "off") ){
                window.AMCGLOBALS.pageSpecific.lazyRender.push(model.address);
                
                if( _.isEmpty( _.difference( window.AMCGLOBALS.persistent.selectedNodes,  window.AMCGLOBALS.pageSpecific.lazyRender) ) )
                    window.$(AppConfig.stat.statTableDiv).trigger("renderall", [window.AMCGLOBALS.pageSpecific.lazyRender]);
            } else{
                
                window.AMCGLOBALS.pageSpecific.lazyRendered.push(model.address);

                if( _.isEmpty( _.difference( window.AMCGLOBALS.pageSpecific.lazyRender,  window.AMCGLOBALS.pageSpecific.lazyRendered) ) ){
                    window.AMCGLOBALS.pageSpecific.lazyRender = [];
                    window.AMCGLOBALS.pageSpecific.lazyRendered = [];
                }

                Util.checkVisibilityAndCall(this, function(){
                    if(model['attributes']['node_status'] === "off"){
                        StatTable.updateRowData(model.statTableID,  model.modelType, model.statList, model.address, model['attributes'], 'Node Down');
                    }else{
                        StatTable.updateRowData(model.statTableID,  model.modelType, model.statList, model.address, model['attributes']);
                    }
                }, "horizontal", "#nodeStatListGrid .ui-jqgrid-bdiv");

            }
        },
        renderNetworkError: function(model){
            StatTable.updateRowData(model.statTableID,  model.modelType, model.statList, model.address, model['attributes'], 'N/E');
        },
        
          
    });
    
    return StatView;
});
