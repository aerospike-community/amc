/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "backbone", "config/view-config", "config/app-config", "helper/util"], function($, Backbone, ViewConfig, AppConfig, Util) {

    var AlertView = Backbone.View.extend({
        isInitialized: false,
        url: null,
        alertTypeMatch: {
            'red': 'error',
            'yellow': 'warn',
            'green': 'normal'
        },
        initialize: function() {
            var that = this;
            this.el = this.options.el;
            this.alertCounts = 0;
            this.shownAlerts = Util.getCookie("shownAlerts");
            this.initAlertSettings();
            this.initDesktopNotification();
            if("Notification" in window){
                this.notificationQ = [];
            }

            this.model.off('change').on('change', function(model) {
            	that.showAlerts(model, model.attributes);	
            });
            this.model.off('destroy').on('destroy', function(model) {
            	console.log("model destroy");
            	$("#alertNotifyList").empty();
            	$("#alertNotifyList").append('<li class="alert-notify-no-alerts">No Alerts</li>');
            	var alertNotifyCountEl = $("span.alert-notify-count");  
            	alertNotifyCountEl.html("0").css("display", "none");
            });
            
        },
        initDesktopNotification: function(){
            window.AMCGLOBALS.persistent.desktopNotification = {};
            if("Notification" in window){
                if(window.Notification.permission === "granted"){
                    var userSetting = Util.getCookie("desktopNotification") || "denied";

                    if(userSetting !== "denied" && userSetting !== "disabled"){
                        $("#desktopNotification").prop("checked",true);
                        $("#mirrorBrowserType input").removeAttr("disabled");
                        window.AMCGLOBALS.persistent.desktopNotification.permission = "granted";
                        window.AMCGLOBALS.persistent.desktopNotification.type = "Red";
                        
                        if(userSetting === "All"){
                            window.AMCGLOBALS.persistent.desktopNotification.type = "All";
                            $("#mirrorBrowserType input[value='All']").prop("checked", true);
                        }
                    }
                } else{
                    window.AMCGLOBALS.persistent.desktopNotification.permission = "denied";
                    window.AMCGLOBALS.persistent.desktopNotification.type = "All";
                    if(window.Notification.permission === "denied"){
                        $("#alertSettingsContainer .keyValueBinder:first input").attr("disabled","disabled");
                        $("#alertSettingsContainer label[for='desktopNotification']").text("Desktop Notification (Denied By User)");
                    }
                }
            } else{
                window.AMCGLOBALS.persistent.desktopNotification.permission = "NA";
                window.AMCGLOBALS.persistent.desktopNotification.type = "NA";
                $("#alertSettingsButton").hide();
            }
        },
        initAlertSettings: function() {
            var that = this;

            $("#AlertDropdownButton").off("click").on("click", function() {
                var container = $("#alert-notify-list-container");

                if (container.css("display") === 'none') {
                    var shownAlerts = Util.getCookie("shownAlerts") || "";

                    var liList = $('.alert-notify-li');
                    for (var i = 0; i < liList.length; i++) {
                        if (shownAlerts.indexOf($(liList[i]).attr('name')) == -1)
                            shownAlerts += ($(liList[i]).attr('name')) + ";";
                    }
                    Util.setCookie("shownAlerts", shownAlerts, 30, "/");
                    $('.alert-notify-li').addClass("alert-notify-shown");
                    $("#AlertDropdownButton .alert-notify-count").html("").css("display", "none");
                }
                $(".alertSettingSection").hide();
                //$("#alertSettingsContainer").hide();
                //$("#alertOnClientTimezoneContainer").hide();
                container.slideToggle(200);
            });

            $(document).off("mouseup:alerts").on("mouseup:alerts", function(tEvent, e) {
                var container = $("#AlertDropdownButton").add("#alert-notify-list-container").add(".ui-widget-overlay");
                if ((container.find(e.target)).length === 0 && !container.is(e.target)) {
                    if ($("div#alert-notify-list-container").css("display") === "block") {
                        $("div#alert-notify-list-container").fadeOut(200);
                    }
                }
            });

            /** Settings **/

            $("#alertSettingsButton").off("click").on("click", function() {
                $(".alertSettingSection").slideToggle(200,  function(){
            		 if ($(this).css("display") === "block"){
                         $("#alertSettingsButton").css("border-radius", "0");
                     } else {
                          $("#alertSettingsButton").css("border-radius", "0 0 7px 7px");
                     }
             	});
            
            });

            $("#desktopNotification").off("click").on("click", function() {
                if ($(this).prop("checked")) {
                    if (window.Notification.permission === "default") {
                        window.Notification.requestPermission(function(permission) {
                            window.Notification.permission = permission;
                            if (permission !== "granted") {
                                window.AMCGLOBALS.persistent.desktopNotification.permission = "denied";
                                Util.setCookie("desktopNotification", window.AMCGLOBALS.persistent.desktopNotification.permission, 30, "/");
                                $(this).prop("checked", false);
                                $("#mirrorBrowserType input").attr("disabled", "disabled");

                                if(permission === "denied"){
                                    $("#alertSettingsContainer .keyValueBinder:first input").prop("checked", false).attr("disabled","disabled");
                                    $("#alertSettingsContainer label[for='desktopNotification']").text("Desktop Notification (Denied By User)");
                                } else{
                                    $("#alertSettingsContainer .keyValueBinder:first input").prop("checked", false);
                                }
                            } else {
                                $("#mirrorBrowserType input").removeAttr("disabled");
                                window.AMCGLOBALS.persistent.desktopNotification.permission = "granted";
                                window.AMCGLOBALS.persistent.desktopNotification.type = $("#mirrorBrowserType input:checked").val();
                                Util.setCookie("desktopNotification", window.AMCGLOBALS.persistent.desktopNotification.type, 30, "/");
                            }
                        });
                    } else if(window.Notification.permission === "granted"){
                        $("#mirrorBrowserType input").removeAttr("disabled");
                        window.AMCGLOBALS.persistent.desktopNotification.permission = "granted";
                        window.AMCGLOBALS.persistent.desktopNotification.type = $("#mirrorBrowserType input:checked").val();
                        Util.setCookie("desktopNotification", window.AMCGLOBALS.persistent.desktopNotification.type, 30, "/");
                    }
                } else {
                    window.AMCGLOBALS.persistent.desktopNotification.permission = "disabled";
                    Util.setCookie("desktopNotification", window.AMCGLOBALS.persistent.desktopNotification.permission, 30, "/");
                    $("#mirrorBrowserType input").attr("disabled", "disabled");
                }
            });

            $("#mirrorBrowserType input").off("click").on("click", function() {
                if ($(this).prop("checked")) {
                    window.AMCGLOBALS.persistent.desktopNotification.type = $(this).val();
                    if (window.AMCGLOBALS.persistent.desktopNotification.permission === "granted") {
                        Util.setCookie("desktopNotification", window.AMCGLOBALS.persistent.desktopNotification.type, 30, "/");
                    }
                }
            });
           
        },
        
        showAlerts: function(model, incomingAlerts) {
            var that = this;

            var newAlerts = [];
            var lastAlertID = 0;
            for (var i = 0; i < incomingAlerts.length; i++) {
                lastAlertID = Math.max(lastAlertID, +incomingAlerts[i][0]);
                if (incomingAlerts[i][4] === 'alert')
                    newAlerts.push(incomingAlerts[i]);
            }

            var totalAlerts = _.size(newAlerts);

            if (totalAlerts > 0) {
                $("#alert-notify-list-container ul li.alert-notify-no-alerts").remove();
                var startIndex = totalAlerts - AppConfig.maxNumberOfAlerts;
                startIndex = 0;
                //model.lastAlertID = newAlerts[totalAlerts-1][0];
                
                if(model.lastAlertID > 0 && !document.hasFocus()){
                    that.desktopNotification(newAlerts);
                }

                for (; startIndex < totalAlerts && newAlerts[startIndex][4] !== "notification"; startIndex++) {
                    var alert = newAlerts[startIndex];
                    this.addAlert(this.el, alert[5], alert[2], this.alertTypeMatch[alert[3]], alert[0], alert[1]);
                }

                var allAlertsLi = ($('.alert-notify-li')).length;
                var shownAlertsLi = ($('.alert-notify-shown')).length;
                var newAlertsLi = allAlertsLi - shownAlertsLi;
                var alertNotifyCountEl = $("span.alert-notify-count");
                if (newAlertsLi !== 0 && $('#alert-notify-list-container').css('display') !== 'block') {
                    alertNotifyCountEl.css("display", "inline-block");
                    alertNotifyCountEl.html(newAlertsLi);
                } else {
                    alertNotifyCountEl.html("0").css("display", "none");
                }

                if ($('#alert-notify-list-container').css('display') !== 'block') {
                    if (typeof that.alertNoty === 'undefined') {
                        if (newAlertsLi > 0 && this.alertCounts > 0) {
                            this.alertNoty = noty({
                                text: newAlerts[totalAlerts - 1][2],
                                type: newAlerts[totalAlerts - 1][3],
                                timeout: "5000"
                            });
                        } else {
                            this.alertCounts += 1;
                        }
                    } else {
                        if (newAlertsLi > 0) {
                            if ($("#" + this.alertNoty.options.id).parent()) {
                                $("#" + this.alertNoty.options.id).parent().remove();
                            }

                            this.alertNoty = noty({
                                text: newAlerts[totalAlerts - 1][2],
                                type: newAlerts[totalAlerts - 1][3],
                                timeout: "5000"
                            });
                        }
                    }

                } else {
                    if (typeof that.alertNoty !== 'undefined') {
                        if ($("#" + this.alertNoty.options.id).parent()) {
                            $("#" + this.alertNoty.options.id).parent().remove();
                        }
                    }

                    var shownAlerts = Util.getCookie("shownAlerts") || "";

                    var liList = $('.alert-notify-li');
                    for (var i = 0; i < liList.length; i++) {
                        if (shownAlerts.indexOf($(liList[i]).attr('name')) == -1)
                            shownAlerts += ($(liList[i]).attr('name')) + ";";
                    }
                    Util.setCookie("shownAlerts", shownAlerts, 30, "/");
                }

                model.attributes = [];
            } 

            model.lastAlertID = Math.max(lastAlertID, model.lastAlertID);
        },
        desktopNotification: function(newAlerts) {
            /* Replicating for desktop notification here */
            if (("Notification" in window) && window.AMCGLOBALS.persistent.desktopNotification.permission === "granted") {
                var startCleaner = false;
                var FF = !(window.mozInnerScreenX == null);
                var red = 0;

                for(var counter = 0; counter < newAlerts.length; counter++){
                    var type = "Notification";
                    if (newAlerts[counter][3] === "yellow") {
                        type = "Warning";
                    } else if (newAlerts[counter][3] === "red") {
                        type = "Alert";
                        red++;
                    }

                    var desktopNotification;

                    if(!FF && (window.AMCGLOBALS.persistent.desktopNotification.type === "All" || type === "Alert")){

                        desktopNotification = new Notification("AMC : " + type, {
                            body: (newAlerts[counter][2]).replace(/\<[\/a-zA-Z]*\>/g, "").replace(/\s+/g, " "),
                            icon: "/static/images/AMC_alert_" + newAlerts[counter][3] + ".png",
                            tag: "AMC_alert_" + newAlerts[counter][0]
                        });

                    } else if(FF && counter === newAlerts.length - 1 && 
                                (window.AMCGLOBALS.persistent.desktopNotification.type === "All" || (type === "Alert" && red > 0))){
                                        
                        var bodyText = "You have " + newAlerts.length + " new Alerts";
                        var iconType = "yellow";

                        if( red > 0 ){
                            bodyText = "You have " + red + " red Alert" +(red > 1 ? "s" : "")+ ", which needs immediate attention.";
                            iconType = "red";
                        }

                        desktopNotification = new Notification("AMC : Notifications", {
                            body: bodyText,
                            icon: "/static/images/AMC_alert_" + iconType + ".png",
                        });
                    }

                    if(typeof desktopNotification !== "undefined"){
                        desktopNotification.onclick = function() {
                            window.focus();
                            if(!$("#AlertDropdownButton").hasClass("active")){
                                $("#headerButtons .button.active").removeClass("active").trigger("click");
                                $("#AlertDropdownButton").addClass("active").trigger("click");
                            }
                        };

                        this.notificationQ.push(desktopNotification);
                        startCleaner = true;
                    }
                }

                if(startCleaner){
                    this.startNotificationQCleaner();
                }
            }
        },

        startNotificationQCleaner: function(){
            var that = this;
            if(this.notificationQ.length === 0){
                return;
            }

            var timeout = that.notificationQ.length > 3 ? 3000 : 6000;
            for(var i=0 ; i < that.notificationQ.length; i++){
                setTimeout(function(){
                	var notification = that.notificationQ.pop();
                	notification && notification.close();
                }, timeout);
            }
                        
        },

        addAlert: function(container, timeStamp, alertMsg, alertType, clusterId, alertId) {
            try {
                this.checkMaxNotifyAlert("#alert-notify-list-container ul");
                var alertNotifyHtmlStr = this.alertNotifyLi(timeStamp, alertMsg, alertType, clusterId, alertId);
                $(alertNotifyHtmlStr).hide().prependTo("#alert-notify-list-container ul").slideDown(500);
            } catch (e) {
                console.info('Error in displaying alert');
            }
        },
        alertLi: function(timeStamp, msgStr, alertClass) {


            var alertHtml = '<li class="alert">' +
                '<span class="' + alertClass + ' alert-status-icon"></span>' +
                '<strong>' + timeStamp + '</strong> : ' +
                msgStr +
                '</li>';
            return alertHtml;
        },
        alertNotifyLi: function(timeStamp, msgStr, alertClass, clusterId, alertId) {
        	var alertClassName = "img-dot-green12x12";
        	if(alertClass === 'error') {
        		alertClassName = "img-dot-red12x12";
        	} else if(alertClass === 'warn'){
        		alertClassName = "img-dot-yellow12x12";
        	}
            var shown = "";
            if ((this.shownAlerts !== null && this.shownAlerts.indexOf(clusterId + ":" + alertId) !== -1) || $('#alert-notify-list-container').css('display') === 'block')
                shown = "alert-notify-shown";
            
            
            var alertHtml = '<li class="alert alert-notify-li ' + shown + '" name="' + clusterId + ':' + alertId + '">' +
                '<span class="' + alertClassName + ' alert-status-icon alert-notify-li-icon"></span>' +
                '<span class="alert-notify-li-message">' +
                '<span class="alert-notify-li-msgstr">' + msgStr + '</span>' +
                '<span class="alert-notify-li-timestamp">' + this.getUTCDate(timeStamp) + '</span>' +
                '</span>' +
                '&nbsp;<span class="remove-inline-alert" title="Remove this alert"></span>'+
                '</li>';
            return alertHtml;
        },
        checkMaxAlert: function(container) {
            var totalAlerts = _.size($(container + ' li'));
            if (totalAlerts >= AppConfig.maxNumberOfAlerts) {
                var lastLI = $(container + ' li:last');
                lastLI.remove();
            }
        },
        checkMaxNotifyAlert: function(container) {
            var totalAlerts = _.size($(container + ' li.alert-notify-li'));
            if (totalAlerts >= AppConfig.maxNumberOfAlerts) {
                var lastLI = $(container + ' li.alert-notify-li:last');
                lastLI.remove();
            }
        },
               
        getUTCDate : function(timestamp){
           	var offset = new Date().getTimezoneOffset();
            var localNow =  new Date(timestamp);
            localNow.setMinutes(localNow.getMinutes() + offset);
              
            var date = localNow.getDate();
            var month = localNow.getMonth()+1;
            var hours = localNow.getHours();
            var minutes = localNow.getMinutes();
            var seconds = localNow.getSeconds();
            
            var monthMM = ((month < 10)? "0" : "" ) + month;
            var dd = ((date < 10)? "0" : "" ) + date;
            var hh = ((hours < 10)? "0" : "" ) + hours;
            var mm = ((minutes < 10)? "0" : "" ) + minutes;
            var ss = ((seconds < 10)? "0" : "" ) + seconds;
                      
            return localNow.getFullYear() + "/"+(monthMM) + "/"+dd + " " + hh + ":" + mm + ":" +ss + " GMT";
        }
               
    });

    return AlertView;
});
