/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/

define(["jquery","config/app-config"],function($,AppConfig){
	var SessionManager = {
		putItemIntoSession : function(key, value) {
			try{
				sessionStorage.setItem(key,value);
				return value;
			} catch(e){
				alert('Your web browser does not support storing settings locally. In Safari, the most common cause of this is using "Private Browsing Mode". Some settings may not save or some features may not work properly for you.');
			}
		},
		
		getItemFromSession : function(key) {
			return sessionStorage.getItem(key);
		},
		
		removeItemFromSession : function(key) {
			var value = localStorage.getItem(key);
			if(value !== undefined || value !== null) {
				sessionStorage.removeItem(key);
				return value;
			}
			return null;
		},
		
		cleanupLocalUserSession : function(){
			this._cleanupusersession_();
		},
		
		_cleanupusersession_ : function(){
			this.removeItemFromSession(AppConfig.sessionKeys.username);
			this.removeItemFromSession(AppConfig.sessionKeys.isSecurityEnable);
			this.removeItemFromSession(AppConfig.sessionKeys.userClusterId);
		}
	}
	
	return SessionManager;
});