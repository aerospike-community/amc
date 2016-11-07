/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/xdr-table", "helper/jqgrid-helper", "config/view-config", "config/app-config", "helper/toggle","helper/servicemanager","helper/notification"], function($, _, Backbone, XdrTable, GridHelper, ViewConfig, AppConfig, Toggle,ServiceManager,Notification){
    
    var XdrView = Backbone.View.extend({
        isInitialized: false,
        initialize: function(){
            this.el = this.options.el;
            this.nodeStatus = 'none';
            this.status = 'none';
            this.skip = false;
            this.alertQueue = {};

            this.initEventHandlers();
        },

        initEventHandlers: function(){
            var that = this;

            this.model.on("remove", function(){
                var rowID = that.model.get("row_id");
                if(rowID != null){
                    var rowNextSibiling = $("#" + rowID).next();
                    if(rowNextSibiling.hasClass("ui-subgrid"))
                        rowNextSibiling.remove();                   
                    $(AppConfig.xdr.xdrTableDiv).delRowData(rowID);
                }
            });
        },

        render: function(model, newData){
            Util.checkVisibilityAndCall(this, function(){
                model.data = newData;
                var rowID = model.attributes['row_id'];
                this.nodeStatus = model.data['node_status'];
                this.status = model.data['xdr_status'];

                if(!this.skip){
                    if(model.data['node_status'] === "off" && model.data['xdr_status'] === "off" ){
                        model.data = AppConfig.blankXdrListData(model.address, 'off', "off", 'N/A');
                        XdrTable.updateRowData(AppConfig.xdr.xdrTableDiv,  model.data, rowID);
                    }else if(model.data['node_status'] === "on" && model.data['xdr_status'] === "off" ){
                        model.data = AppConfig.blankXdrListData(model.address, 'on', "off", 'N/A');
                        XdrTable.updateRowData(AppConfig.xdr.xdrTableDiv,  model.data, rowID);
                    }else{
                        XdrTable.updateRowData(AppConfig.xdr.xdrTableDiv,  model.data, rowID);
                    }
                    this.formatRowData(model, rowID);
                }
            });
        },
        renderNetworkError: function(model){
            Util.checkVisibilityAndCall(this, function(){
                model.data = model.attributes;
                var rowID = model.attributes['row_id'];
                model.data = AppConfig.blankXdrListData(model.address, 'N/E', "off", 'N/E');
                model.data['node_status'] = 'off'; 
                XdrTable.updateRowData(AppConfig.xdr.xdrTableDiv,  model.data, rowID);
                this.formatRowData(model, rowID, "N/E");
            });
        },
        renderLoading: function(model){
            Util.checkVisibilityAndCall(this, function(){
                model.data = model.attributes;
                var rowID = model.attributes['row_id'];
                model.data = AppConfig.blankXdrListData(model.address, '--', model.data['xdr_status'], '--');
                model.data['node_status'] = 'none'; 
                XdrTable.updateRowData(AppConfig.xdr.xdrTableDiv,  model.data, rowID);
                this.formatRowData(model, rowID, "N/E");
            });
        },
        formatRowData: function(model, rowID){
            var address = model.address;
            var status = model.data['node_status'];
            //console.info(model.data);
            if(status === "on"){
                this.statusInAddress(model, AppConfig.xdr.xdrTableDiv, rowID, address, 'green-text', 1);
            }else if(status === "off"){
                this.statusInAddress(model, AppConfig.xdr.xdrTableDiv, rowID, address, 'red-text', 1);
            }else{
                this.statusInAddress(model, AppConfig.xdr.xdrTableDiv, rowID, address, 'grey-text', 1);
            }

            var xdrStatus = model.data['xdr_status'];
            if(xdrStatus === "on"){
                this.statusInIcon(AppConfig.xdr.xdrTableDiv, address, rowID, 'green', 0);
            }else if(xdrStatus === "off" || xdrStatus === "N/A"){
                this.statusInIcon(AppConfig.xdr.xdrTableDiv, address, rowID, 'red', 0);
            }else{
                this.statusInIcon(AppConfig.xdr.xdrTableDiv, address, rowID, 'grey', 0);
            }
        },
        statusInAddress : function(model, container, rowID, data, AddressClassName, colIndex){
            var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;
            var htmlStr = '<div class="'+AddressClassName+'">'+data+'</div>';
            $(cellContainer).html(htmlStr);
        },
        statusInIcon : function(container, nodeAddress, rowID, iconClassName, colIndex){
            var that = this;
            var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;

            var textAlign = "left";
            
            if(that.status === 'on'){
                textAlign = 'left';
            } else{
                textAlign = 'right';
            }

            var hasXDRONOFFService = ServiceManager.isUserHasAccessToService(ServiceManager.serviceComponentMap.DASHBOARD_PAGE.DASHBOARD_XDR_ON_OFF.SERVICE_KEY);
            var htmlStr = "";
            if(!ServiceManager.isSecurityEnable() || (ServiceManager.isSecurityEnable() && hasXDRONOFFService)) {
                htmlStr = '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility xdr visibility-button-container">';
                if(that.status === 'on'){
                    htmlStr += '<span class="text-status-visibility"> ' + that.status + '</span><div name="' + nodeAddress + '" class="'+iconClassName+'-visibility xdr visibility-button-slider"></div></div>';
                }else{
                    htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility xdr visibility-button-slider"></div><span class="text-status-visibility">'+that.status+'</span></div>';
                }
                
            } else {
                htmlStr = '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility xdr visibility-button-container" style="background-color:gray;">';
                if(that.status === 'on'){
                    htmlStr += '<span class="text-status-visibility"> ' + that.status + '</span><div name="' + nodeAddress + '" class="'+iconClassName+'-visibility xdr visibility-button-slider" style="background-color:gray;"></div></div>';
                }else{
                    htmlStr += '<div name="' + nodeAddress + '" class="'+iconClassName+'-visibility xdr visibility-button-slider"></div><span class="text-status-visibility" style="color:darkgray;">'+that.status+'</span></div>';
                }
                
            }
         
            htmlStr += "<div class='xdr status-alert-container' name='" + nodeAddress + "'></div>";

            $(cellContainer).html(htmlStr);

            var button = $(".xdr.visibility-button-slider[name='"+nodeAddress+"']");
            button.parent().parent().children(".xdr.status-alert-container").css("z-index",-1);
            button.parent().parent().children(".xdr.status-alert-container").off("click");
            that.bindToggleButton(button, nodeAddress, that.status, that, container, rowID, colIndex);
        },

        bindToggleButton : function(button, nodeAddress, status, view, container, rowID, colIndex){

            var that = this;
            var hasXDRONOFFService = ServiceManager.isUserHasAccessToService(ServiceManager.serviceComponentMap.DASHBOARD_PAGE.DASHBOARD_XDR_ON_OFF.SERVICE_KEY);
            button.off("click");
            
             if(button.prop("class").indexOf("draggable") != -1){
                try{
                    button.draggable("destroy",1);
                } catch(e){ }
            }
             
            if(!ServiceManager.isSecurityEnable() || (ServiceManager.isSecurityEnable() && hasXDRONOFFService)) {
                button.draggable({ 
                    containment: "parent", axis: "x",
                    snap : ".visibility-button-container[name='" + nodeAddress + "']",
                    start : function(){
                        view.skip = true;
                    },
                    stop: function(x) {
                        offset = (button.offset().left) - (button.parent().offset().left);
                        if((status === 'on' && offset < 12) || (status === 'off' && offset >= 12)){
                            button.parent().trigger("click");
                        }
                    }
                });
            }
           
            
            button.parent().off("click").on("click",function(x){
                x.stopPropagation();
                if(ServiceManager.isSecurityEnable() && !hasXDRONOFFService ){
                    Notification.toastNotification("red", "You don't have access to ON/OFF XDR", 3000);
                    return;
                }
                view.skip = true;
                button.parent().parent().children(".xdr.status-alert-container").css("z-index",1001);
                button.parent().parent().children(".xdr.status-alert-container").on("click",function(e){
                    e.stopPropagation();
                });
                button.draggable("destroy",1);
                
                if(that.nodeStatus === "on"){
                    Toggle.toggle(button, nodeAddress, status, view, 'xdr');
                } else {
                    $("div.xdr.status-alert-container[name='" + nodeAddress + "']").noty({text : "Node " + nodeAddress + " is off", type : "alert", timeout: "5000", closeWith: []});
                    Toggle.toggleButton(button, nodeAddress, 'off');
                    setTimeout(function(){ view.skip = false; }, 5000);
                }

                function tryAndBind(callback){
                    if(view.skip){
                        setTimeout(function(){ callback(callback);}, 500);
                    } else{
                        var iconClassName = 'red';
                        if(status === 'on')
                            iconClassName = 'green';
                                                
                        try{
                            button.draggable("destroy",1);
                            button.off("click");
                        } catch(e){ }
                        
                        that.statusInIcon(container, nodeAddress, rowID, iconClassName, colIndex);
                        
                   }
                }

                tryAndBind(tryAndBind);
                
            }); 
            
            
        }
    });
    
    return XdrView;
});




