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

define(["jquery", "underscore", "backbone", "helper/stat-table", "helper/jqgrid-helper", "config/view-config", "config/app-config" ], function($, _, Backbone, StatTable, GridHelper, ViewConfig, AppConfig){
    
    var StatView = Backbone.View.extend({
        initialize: function( options ){
            this.el = options.el;
            this.initEventHandler();
        },

        initEventHandler: function(){
            var that = this;

            $("#statContainer").find(".title-bar").off("click", that.triggerRedraw).on("click", that.triggerRedraw);
        },

        triggerRedraw: function(event){
            if($("#statContainer").find(".title-bar").hasClass("closed")){
                window.$("#" + AMCGLOBALS.persistent.showAttributesFor + "CheckBox").trigger("change");
            }
        },

        lazyRender: function(event){
            event.data.model.colView.render(event.data.model);
        },
        
        render: function(model){

            if( this.attrList == null ){
                switch(model.modelType){
                    case "nodes" :
                        this.attrList = "nodeStatsList"; break;
                    case "namespace" :
                        this.attrList = "namespaceStatsList"; break;
                    case "sindex" :
                        this.attrList = "sIndexStatsList"; break;
                    case "xdr" :
                        this.attrList = "xdrStatsList"; break;
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
                    StatTable.initAndSetGridData(AppConfig[this.attrList]);
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
                    model.unset('system_sindex_data_memory_used',{silent : true});
                    if(model['attributes']['node_status'] === "off"){
                        StatTable.updateRowData(model.statTableID,  model.statList, model.address, model['attributes'], 'Node Down');
                    }else{
                        StatTable.updateRowData(model.statTableID,  model.statList, model.address, model['attributes'],model.type);
                    }
                }, "horizontal", "#nodeStatListGrid .ui-jqgrid-bdiv");
            }
        },
        renderNetworkError: function(model){
            StatTable.updateRowData(model.statTableID,  model.statList, model.address, model['attributes'], 'N/E');
        },
    });
    
    return StatView;
});
