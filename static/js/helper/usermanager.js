/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery","helper/servicemanager","helper/notification","config/app-config","helper/AjaxManager"],
	function($,ServiceManager,Notification,AppConfig,AjaxManager){

    var usermanager = {
        showUserHomePage : function(){
        	var scm = ServiceManager.serviceComponentMap;
        	var seedNode = window.AMCGLOBALS.persistent.seedNode;
        	if(ServiceManager.isUserHasAccessToService(scm.DASHBOARD_PAGE.SERVICE_KEY)){
        		window.location.hash = "dashboard/" + (seedNode !== null ? seedNode :"");
        	} else if(ServiceManager.isUserHasAccessToService(scm.STATISTIC_PAGE.SERVICE_KEY)){
        		window.location.hash = "statistics/" + (seedNode !== null ? seedNode :"");
        	} else if(ServiceManager.isUserHasAccessToService(scm.DEFINITION_PAGE.SERVICE_KEY)){
        		window.location.hash = "definitions/" + (seedNode !== null ? seedNode :"");
        	} else if(ServiceManager.isUserHasAccessToService(scm.JOBS_PAGE.SERVICE_KEY)){
        		window.location.hash = "jobs/" + (seedNode !== null ? seedNode :"");
        	} else if(ServiceManager.isUserHasAccessToService(scm.LATENCY_PAGE.SERVICE_KEY)){
        		window.location.hash = "latency/" + (seedNode !== null ? seedNode :"");
        	} else if(ServiceManager.isUserHasAccessToService(scm.MANAGE_PAGE.SERVICE_KEY)){
        		window.location.hash = "admin-console/" + (seedNode !== null ? seedNode :"");
        	} else {
        		Notification.toastNotification("red","You don't have access to any module",false,true);
        	}
        },

        getUserHomePageByRoles : function(roles){
        	var url = window.location.protocol + "//"+window.location.host;
        	if(roles.length === 1 && roles.indexOf("user-admin") !== -1){
        		return url + "/#admin-console";
        	} else {
        		return url + "/#dashboard";
        	}
        },

        getDefaultActivePageByRoles : function(roles){
        	if(roles.length === 1 && roles.indexOf("user-admin") !== -1){
        		return "admin-console";
        	} else {
        		return "dashboard";
        	}
        },

        /*
         * This method will fetch all currently monitoring cluster information in current session
         */
        getCurrentMonitoringCluster : function(successCallback,failureCallback,isSynchronous){
           if(isSynchronous == null || (typeof isSynchronous === "undefined")) {
        	   isSynchronous = false;
           }
    	   AjaxManager.sendRequest(AppConfig.urls.GET_CURRENT_MONITORING_CLUSTESR, {async:isSynchronous}, successCallback,failureCallback);
        }
    };
    return usermanager;
});