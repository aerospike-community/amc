/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery","underscore","config/app-config","helper/AjaxManager","helper/notification","helper/sessionmanager"], 
	function($,_,AppConfig,AjaxManager,Notification,SessionManager){
	
	var servicemanager = {
    		
    	getUserRoles : function(clusterId){
    		var roleList = window.AMCGLOBALS.persistent.roleList;
    		if(typeof window.AMCGLOBALS.persistent.roleList === "undefined" || window.AMCGLOBALS.persistent.roleList.length === 0){
    			AjaxManager.sendRequest(AppConfig.baseUrl + clusterId+AppConfig.urls.USER_ROLES, {type : AjaxManager.GET, async : false },
    					function (response) { 
		    				roleList = response.rolelist;
		    		    },
		    		    function (response){
			    		    console.log(response);
					    	roleList = [];
			            });
    	   		}
    		return roleList;
	    },
	    
	    isSecurityEnable : function(){
	    	var value = SessionManager.getItemFromSession(AppConfig.sessionKeys.isSecurityEnable);
	    	if(value === null || typeof value === "undefined" || value == "false") {
	    		return false;
	    	} else {
	    		return true;
	    	}
	    },
	
 		setLoggedInUserRoles : function(roleList){
 			var serviceList = [];
 			if(!roleList || roleList.length === 0 ){
 				window.AMCGLOBALS.persistent.roleList = [];
 			} else {
 				window.AMCGLOBALS.persistent.roleList = roleList;
 				serviceList = this._getUniqueServicesForRoles(roleList);
			}

 			this._setLoggedInUserServices(serviceList);
 			
 	    },
 	    
 	    
 	    isUserHasAccessToService : function(serviceCode) {
 	    	if(!(typeof window.AMCGLOBALS.persistent.serviceList === "undefined")){
 	    		if(window.AMCGLOBALS.persistent.serviceList.indexOf(serviceCode) !== -1) {
 	 	    		return true;
 	 	    	} 
 	    	}
 	    	return false;
 	    },
 	    
 	    isUserHasModuleAccess : function(moduleName) {
 	    	var obj = this._getModuleObject_(moduleName);
 	    	if(obj != null) {
 	    		return this.isUserHasAccessToService(obj.SERVICE_KEY);
 	    	}
 	    	return false;
 	    },
 	    
 	   showAccessibleModules : function(){
          var serviceList = window.AMCGLOBALS.persistent.serviceList;	 
          if(serviceList && serviceList.length > 0){
	    		var scm = this.serviceComponentMap;
	    		for(var serviceCode in serviceList) {
					switch(serviceList[serviceCode]) {
						case scm.DASHBOARD_PAGE.SERVICE_KEY : 
							this.showComponent($(scm.DASHBOARD_PAGE.ELEMENT).parent());
							break;

						case scm.STATISTIC_PAGE.SERVICE_KEY : 
							this.showComponent($(scm.STATISTIC_PAGE.ELEMENT).parent());
							break;

						case scm.DEFINITION_PAGE.SERVICE_KEY : 
							this.showComponent($(scm.DEFINITION_PAGE.ELEMENT).parent());
							break;

						case scm.JOBS_PAGE.SERVICE_KEY : 
							this.showComponent($(scm.JOBS_PAGE.ELEMENT).parent());
							break;

						case scm.LATENCY_PAGE.SERVICE_KEY : 
							this.showComponent($(scm.LATENCY_PAGE.ELEMENT).parent());
							break;

						case scm.MANAGE_PAGE.SERVICE_KEY : 
							this.showComponent($(scm.MANAGE_PAGE.ELEMENT).parent());
							break;	
                    }    			
	    		}
	    	} else {
	    		this.hideAllHeaderTab();
          window.setTimeout(function() {
            Notification.toastNotification('red',"You don't have access to any module", 10*1000);
          }, 1000);
            }

          // remove all elements visible only to enterprise edition users
          if(window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE === AppConfig.amc_type[0]) {
            _.each(this._enterpriseOnlyElements_, function(elm) {
              $(elm).remove();
            });
          }
        },
    
        showComponentsInActivePage : function(activePage){
          var componentList = this._getAccesssibleComponents(this._getModuleObject_(activePage));
          var inaccessibleComponents = _.difference(
              this._getAllComponents(this._getModuleObject_(activePage)),
              componentList);

          if(componentList.length > 0) {
            for(var index in componentList) {
              this.showComponent($(componentList[index]));
            }
          } 

          if(this.isSecurityEnable() && inaccessibleComponents.length > 0){
            for(var index in inaccessibleComponents) {
              var component = $(inaccessibleComponents[index]);
              this.showComponent( component );
              this.markModuleUnavailable( inaccessibleComponents[index] );
            }	
          }
        },

	    getMinimumRoleRequired : function(obj){
	    	if(obj !== null){
	    		var key = obj["SERVICE_KEY"];
	    		var roles= ["read", "read-write", "sys-admin", "user-admin"];

	    		for(var role in roles){
	    			if( this._roleserviceMap_[roles[role]].indexOf(key) !== -1)
	    				return roles[role];
	    		}

          if(key === 'BACKUP') {
            return 'read, data-admin';
          } else if(key === 'RESTORE_BACKUP') {
            return 'write, data-admin';
          }
	    	}

	    	return null;
	    },

	    getServiceObject : function(ELEMENT){
	    	var moduleObject = this._getModuleObject_(window.AMCGLOBALS.activePage);

	    	if(ELEMENT !== null){
				for(var obj in moduleObject){
					if( _.has(moduleObject[obj], "SERVICE_KEY") && moduleObject[obj]["ELEMENT"] === ELEMENT)
						return moduleObject[obj];
				}
	    	}

	    	return null;
	    },
	    
	    showComponent : function(element) {
	    	//Display element branch
	    	while( !element.is(document) && element.length !== 0 ){
	    		if(!element.is(":visible")){
	    			element.show();
	    		}
	    		element = element.parent();	
	    	}
	    },

	    markModuleUnavailable : function(element){
	    	var el = $(element);
	    	el.addClass("outside-assigned-roles");
	    	el.attr("data-min-role-required", this.getMinimumRoleRequired( this.getServiceObject(element) ));
	    	el.attr("inaccessible-module", true);
	    },

	    hideComponent : function(element){
	    	element.hide();
	    },
	    
	    showAllHeaderTab : function() {
	    	for(var index in this._headerTabElements_){
	    		this.showComponent($(this._headerTabElements_[index]).parent());
	    	}
	    },
	    
	    hideAllHeaderTab : function(){
	    	for(var index in this._headerTabElements_){
	    		this.hideComponent($(this._headerTabElements_[index]).parent());
	    	}
	    },
	       
	    _getAccesssibleComponents : function(obj){
	    	var array = [];
	    	if(obj != null) {
	    		for (var prop in obj) {
	                   if(prop === "SERVICE_KEY" && this.isUserHasAccessToService(obj[prop]) && this.isSupportedByBuild(obj['BUILD_DEP'], obj['CUT_OFF_VER'])) {
	                		array = _.union(array, (obj.ELEMENT == null ? [] : (typeof obj.ELEMENT === "string" ? [obj.ELEMENT] : obj.ELEMENT) ));
	                   } else if(typeof obj[prop] === "object") {
	                       array = _.union(array,this._getAccesssibleComponents(obj[prop]));
	                   }
	             }
	    	}
	    	return array;
	    },

	    isSupportedByBuild : function(buildDep, cutOffVersion){
	    	if((buildDep == null && cutOffVersion == null) || window.AMCGLOBALS.persistent.buildDetails == null)
	    		return true;

	    	var lowerDep = null,
	    		upperDep = null,
	    		cutOffSide = null,
	    		buildSide = null,
	    		supported = true;

	    	if(buildDep != null){
		    	lowerDep = buildDep[0];
		    	upperDep = buildDep[1];
		    }

	    	var versionsAvailable = _.keys(window.AMCGLOBALS.persistent.buildDetails.version_list);

	    	for (var i = 0; i < versionsAvailable.length; i++) {
	    		if( (lowerDep != null && Util.versionCompare(versionsAvailable[i], lowerDep, {zeroExtend: true}) < 0) || 
	    			(upperDep != null && Util.versionCompare(upperDep, versionsAvailable[i], {zeroExtend: true}) < 0) ){
	    			supported = false;
	    			break;
	    		}

	    		if(cutOffVersion != null){
	    			buildSide = Util.versionCompare(versionsAvailable[i], cutOffVersion, {zeroExtend: true});

	    			if(cutOffSide == null){
	    				cutOffSide = buildSide;
	    			} else if( (cutOffSide < 0 && buildSide >= 0) || ( cutOffSide >=0 && buildSide < 0 ) ){
	    				supported = false;
	    			}
	    		}
	    	}

	    	return supported;
	    },
	    
	    _getAllComponents : function(obj) {
	    	 var array = [];
	    	 if(obj != null){
	    		 for (var prop in obj) {
	                   if(prop === "SERVICE_KEY") {
	                         array = _.union(array, (obj.ELEMENT == null ? [] : (typeof obj.ELEMENT === "string" ? [obj.ELEMENT] : obj.ELEMENT ) ));
	                   }else if(typeof obj[prop] === "object"){
	                       array = _.union(array,this._getAllComponents(obj[prop]));
	                   }
	             }
	    	 }
            return array;
	    },
	    
	    _getUniqueServicesForRoles : function(roleList) {
	    	 var serviceList = [];
	    	 if(!(typeof roleList === "undefined") || roleList.length > 0){
	    		 var roleIndex = null;
	    		 for(roleIndex in roleList) {
	    			 serviceList = _.union(serviceList,this._roleserviceMap_[roleList[roleIndex]]);
	    		 }
	    	 }

         // backup/restore require both "data-admin" and "read/write", because
         // backup/restore does sindex & udf registration.
         var hasRead = _.find(roleList, function(role) { 
           return ['read', 'read-write', 'read-write-udf'].indexOf(role) !== -1;
         });
         var hasWrite = _.find(roleList, function(role) { 
           return ['read-write', 'read-write-udf'].indexOf(role) !== -1;
         });
         var hasDataAdmin = _.values(roleList).indexOf('data-admin') !== -1;
         var hasSysAdmin  = _.values(roleList).indexOf('sys-admin') !== -1;

         if(hasDataAdmin || hasSysAdmin) {
           if(hasWrite) {
             serviceList = _.union(serviceList, ['BACKUP', 'RESTORE_BACKUP']);
           } else if(hasRead) {
             serviceList = _.union(serviceList, ['BACKUP']);
           }
         }

	    	 return serviceList;
   	    },
   	    
   	    _setLoggedInUserServices : function(serviceList){
	    	if(typeof serviceList === "undefined" || serviceList.length === 0){
				window.AMCGLOBALS.persistent.serviceList = [];	
			} else {
				window.AMCGLOBALS.persistent.serviceList = serviceList;
			}
	    },
   	
	    _getModuleObject_ : function(activePageName) {
	    	var obj = null;
	    	switch(activePageName){
	    		case "dashboard":
	    			obj = this.serviceComponentMap.DASHBOARD_PAGE;
	    			break;
	    			
	    		case "statistics":
	    			obj = this.serviceComponentMap.STATISTIC_PAGE;
	    			break;
	 	    		
	    		case "definitions":
	    			obj = this.serviceComponentMap.DEFINITION_PAGE;
	    			break;
	 	    		
	    		case "jobs":
	    			obj = this.serviceComponentMap.JOBS_PAGE;
	    			break;
	 	    		
	    		case "latency":
	    			obj = this.serviceComponentMap.LATENCY_PAGE;
	    			break;
	 	    		
	    		case "admin-console":
	    			obj = this.serviceComponentMap.MANAGE_PAGE;
	    			break;
	    	}
	    	return obj;
	    },

      setNonSecureUserServices : function(){
        if(window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE === AppConfig.amc_type[0]) {  // community edition
          window.AMCGLOBALS.persistent.serviceList = this._communityUserServiceList_;
        } else { // enterprise edition
          window.AMCGLOBALS.persistent.serviceList = this._nonSecureUserServiceList_;
        }
      },

      // elements visible only in the enterprise edition
      _enterpriseOnlyElements_: ["#AlertDropdownButton", "#amcSettingsButton", "#activityLogger", '#clusterUser',
                                 "#renameClusterBtn", "#removeClusterBtn", "#changeClusterButton"],

	    _headerTabElements_ : ["ul.tab-list li.tab a#dasboardTabLink",
	                     "ul.tab-list li.tab a#statTabLink",
	                     "ul.tab-list li.tab a#defTabLink",
	                     "ul.tab-list li.tab a#jobsTabLinks",
	                     "ul.tab-list li.tab a#latencyTabLink",
	                     "ul.tab-list li.tab a#adminConsoleTabLinks"
	                     ],

	    _roleserviceMap_ : {
	    	"read" : ["DASHBOARD_PAGE",
	    	        "DASHBOARD_SUMMARY",
	    	        "THROUGHPUT",
	    	        "DASHBOARD_NODE_SECTION", 
	    	        "DASHBOARD_NAMESPACE_SECTION",
	    	        "DASHBOARD_XDR_SECTION",
	    	        "STATISTIC_PAGE",
	    	        "DEFINITION_PAGE",
	    	        "JOBS_PAGE",
	    	        "JOBS_RUNNING",
	    	        "JOBS_COMPLETED",
	    	        "LATENCY_PAGE",
	    	        "MANAGE_PAGE",
	    	        "DASHBOARD_NODE_ON_OFF",
	    			"DASHBOARD_XDR_ON_OFF",
	    			"USER_SELF_ACCOUNT",
	    			"COMMAND_LINE"
	    			],
	    	        
	    	"read-write" : ["DASHBOARD_PAGE",
	    	              "DASHBOARD_SUMMARY",
	    	              "THROUGHPUT",
	    	              "DASHBOARD_NODE_SECTION",
	    	              "DASHBOARD_NAMESPACE_SECTION",
	    	              "DASHBOARD_XDR_SECTION",
	    	              "DASHBOARD_NODE_ON_OFF",
	    				  "DASHBOARD_XDR_ON_OFF",
	    	              "STATISTIC_PAGE",
	    	              "DEFINITION_PAGE",
	    	              "JOBS_PAGE",
	    	              "JOBS_RUNNING",
	    	              "JOBS_COMPLETED",
	    	              "LATENCY_PAGE", 
                          "MANAGE_PAGE",
	    				  "USER_SELF_ACCOUNT",
	    				  "COMMAND_LINE"
	    				  ],        
	    	
	    	"read-write-udf" : ["DASHBOARD_PAGE",
	    	              "DASHBOARD_SUMMARY",
	    	              "THROUGHPUT",
	    	              "DASHBOARD_NODE_SECTION",
	    	              "DASHBOARD_NAMESPACE_SECTION",
	    	              "DASHBOARD_XDR_SECTION",
	    	              "DASHBOARD_NODE_ON_OFF",
	    				  "DASHBOARD_XDR_ON_OFF",
	    	              "STATISTIC_PAGE",
	    	              "DEFINITION_PAGE",
	    	              "JOBS_PAGE",
	    	              "JOBS_RUNNING",
	    	              "JOBS_COMPLETED",
	    	              "LATENCY_PAGE", 
                          "MANAGE_PAGE",
	    				  "USER_SELF_ACCOUNT",
	    				  "COMMAND_LINE"
	    				  ],        
	    	
	    	"sys-admin" : ["DASHBOARD_PAGE",
	    				  "DASHBOARD_SUMMARY",
	    				  "THROUGHPUT",
	    				  "DASHBOARD_NODE_SECTION",
	    				  "DASHBOARD_NAMESPACE_SECTION",
	    				  "DASHBOARD_XDR_SECTION",
	    				  "STATISTIC_PAGE",
	    				  "DEFINITION_PAGE",
	    				  "CREATE_INDEX",
	    				  "DROP_INDEX",
	    				  "REGISTER_UDF",
	    				  "REMOVE_UDF",
	    				  "LATENCY_PAGE",
	    				  "MANAGE_PAGE",
	    				  "DASHBOARD_NODE_ON_OFF",
	    				  "DASHBOARD_XDR_ON_OFF",
	    				  "JOBS_PAGE",
	    				  "EDIT_CONFIG",
	    				  "AMC_REFRESH_INTERVAL",
	    				  "USER_SELF_ACCOUNT",
	    				  "COMMAND_LINE"
	    				  ],
	    	
	    	"user-admin" : ["DASHBOARD_PAGE",
	    				  "DASHBOARD_SUMMARY",
	    				  "THROUGHPUT",
	    				  "DASHBOARD_NODE_SECTION",
	    				  "DASHBOARD_NAMESPACE_SECTION",
	    				  "DASHBOARD_XDR_SECTION",
	    				  "STATISTIC_PAGE",
	    				  "DEFINITION_PAGE",
	    				  "LATENCY_PAGE",
	    				  "MANAGE_PAGE",
	    				  "DASHBOARD_NODE_ON_OFF",
	    				  "DASHBOARD_XDR_ON_OFF",
	    				  "JOBS_PAGE",
	    				  "CREATE_USER",
	    				  "DROP_USER",
	    				  "CHANGE_USER_PASSWORD",
	    				  "GRANT_ROLE",
	    				  "REMOVE_ROLE",
	    				  "GET_ALL_USERS",
	    				  "GET_ALL_ROLES",
	    				  "USER_EDITOR",
	    				  "ROLE_EDITOR",
	    				  "USER_SELF_ACCOUNT",
	    				  "COMMAND_LINE"
	    				  ],

	    	"data-admin" : ["DASHBOARD_PAGE",
	    				  "DASHBOARD_SUMMARY",
	    				  "THROUGHPUT",
	    				  "DASHBOARD_NODE_SECTION",
	    				  "DASHBOARD_NAMESPACE_SECTION",
	    				  "DASHBOARD_XDR_SECTION",
	    				  "DASHBOARD_NODE_ON_OFF",
	    				  "DASHBOARD_XDR_ON_OFF",
	    				  "STATISTIC_PAGE", 
	    				  "DEFINITION_PAGE",
	    				  "CREATE_INDEX",
	    				  "DROP_INDEX",
	    				  "REGISTER_UDF",
	    				  "REMOVE_UDF",
	    				  "MANAGE_PAGE",
	    				  "JOBS_PAGE",
	    				  "JOBS_RUNNING",
	    				  "JOBS_COMPLETED",
	    				  "LATENCY_PAGE",
	    				  "CHANGE_USER_PASSWORD",
	    				  "USER_SELF_ACCOUNT",
	    				  "COMMAND_LINE"	
	    				]
	    },

	    _nonSecureUserServiceList_ : [
	    					"DASHBOARD_PAGE", 
	    					"DASHBOARD_SUMMARY", 
	    					"THROUGHPUT", 
	    					"DASHBOARD_NODE_SECTION", 
	    					"DASHBOARD_NAMESPACE_SECTION", 
	    					"DASHBOARD_XDR_SECTION", 
	    					"STATISTIC_PAGE", 
	    					"DEFINITION_PAGE", 
	    					"LATENCY_PAGE", 
	    					"BACKUP", 
	    					"MANAGE_PAGE", 
	    					"RESTORE_BACKUP",
	    					"COMMAND_LINE",
	    					"DASHBOARD_NODE_ON_OFF", 
	    					"DASHBOARD_XDR_ON_OFF", 
	    					"JOBS_PAGE", 
	    					"CREATE_INDEX", 
	    					"DROP_INDEX",
	    					"REGISTER_UDF", 
	    					"REMOVE_UDF", 
	    					"EDIT_CONFIG", 
	    					"AMC_REFRESH_INTERVAL",
	    					],

	    _communityUserServiceList_ : [
	    					"DASHBOARD_PAGE", 
	    					"DASHBOARD_SUMMARY", 
	    					"THROUGHPUT", 
	    					"DASHBOARD_NODE_SECTION", 
	    					"DASHBOARD_NAMESPACE_SECTION", 
	    					"DASHBOARD_NODE_ON_OFF", 
	    					"STATISTIC_PAGE", 
	    					"DEFINITION_PAGE", 
	    					"JOBS_PAGE", 
	    					"CREATE_INDEX", 
	    					"DROP_INDEX",
	    					"REGISTER_UDF", 
	    					"REMOVE_UDF", 
	    					],
	    
	    /* Must not be modified this field anywhere in application except from this location*/
	    serviceComponentMap : {
            DASHBOARD_PAGE : {
                SERVICE_KEY : "DASHBOARD_PAGE",
                ELEMENT : "ul.tab-list li.tab a#dasboardTabLink",
                
                DASHBOARD_SUMMARY : {
                    SERVICE_KEY : "DASHBOARD_SUMMARY",
                    ELEMENT : ".cluster-overview"
                },
                THROUGHPUT : {
                    SERVICE_KEY : "THROUGHPUT",
                    ELEMENT : "#throughtputSection"
                },
                DASHBOARD_NODE_SECTION : {
                    SERVICE_KEY : "DASHBOARD_NODE_SECTION",
                    ELEMENT : "#nodeContainer"
                },
                DASHBOARD_NAMESPACE_SECTION : {
                    SERVICE_KEY : "DASHBOARD_NAMESPACE_SECTION",
                    ELEMENT : "#namespaceContainer"
                },
                DASHBOARD_XDR_SECTION : {
                    SERVICE_KEY : "DASHBOARD_XDR_SECTION",
                    ELEMENT : "#xdrContainer"
                },
                DASHBOARD_NODE_ON_OFF : {
                    SERVICE_KEY : "DASHBOARD_NODE_ON_OFF"
                },
                DASHBOARD_XDR_ON_OFF : {
                    SERVICE_KEY : "DASHBOARD_XDR_ON_OFF"
                }
            },

            STATISTIC_PAGE : {
                SERVICE_KEY : "STATISTIC_PAGE",
                ELEMENT : "ul.tab-list li.tab a#statTabLink"
            },

            DEFINITION_PAGE : {
                SERVICE_KEY : "DEFINITION_PAGE",
                ELEMENT : "ul.tab-list li.tab a#defTabLink",

                INDEX_MANAGEMENT : {
                	ADD_INDEX : {
                		SERVICE_KEY : "CREATE_INDEX",
                		ELEMENT : "#addNewIndex"
                	}
                },

                UDF_MANAGEMENT : {
                	ADD_UDF : {
                		SERVICE_KEY : "REGISTER_UDF",
                		ELEMENT : "#addNewUDF"
                	}
                }
            },

            JOBS_PAGE : {
                SERVICE_KEY : "JOBS_PAGE",
                ELEMENT : "ul.tab-list li.tab a#jobsTabLinks",

                JOBS_RUNNING : {
                	SERVICE_KEY : "JOBS_RUNNING",
                	ELEMENT : "#nodeContainer"
                },

                JOBS_COMPLETED : {
                	SERVICE_KEY : "JOBS_COMPLETED",
                	ELEMENT : "#nodeContainerCompletedJobs"
                }
            },

            LATENCY_PAGE : {
                SERVICE_KEY : "LATENCY_PAGE",
                ELEMENT : "ul.tab-list li.tab a#latencyTabLink"
            },

            MANAGE_PAGE : {
                SERVICE_KEY : "MANAGE_PAGE",
                ELEMENT : "ul.tab-list li.tab a#adminConsoleTabLinks",
                AMC_REFRESH_INTERVAL : {
					SERVICE_KEY : "AMC_REFRESH_INTERVAL",
                    ELEMENT : "#v-nav ul li[tab=general]",
                },
                USER_SELF_ACCOUNT : {
                	SERVICE_KEY : "USER_SELF_ACCOUNT",
                	ELEMENT : "#v-nav ul li[tab=accounts]"
                },
                BACKUP : {
                    SERVICE_KEY : "BACKUP",
                    ELEMENT : "#v-nav ul li[tab=backup]",
                },
                RESTORE_BACKUP : {
                    SERVICE_KEY : "RESTORE_BACKUP",
                    ELEMENT : "#v-nav ul li[tab=restore]",
                },
                EDIT_CONFIG : {
                	SERVICE_KEY : "EDIT_CONFIG",
                	ELEMENT : "#v-nav ul li[tab=configeditor]",
                },
                USER_EDITOR : {
                	SERVICE_KEY : "USER_EDITOR",
                	ELEMENT : "#v-nav ul li[tab=usermanager]",
                	CUT_OFF_VER : "3.5.4"
                },
                ROLE_EDITOR: {
                	SERVICE_KEY : "ROLE_EDITOR",
                	ELEMENT : "#v-nav ul li[tab=rolemanager]",
                	BUILD_DEP : ["3.5.4", null]
                },
                COMMAND_LINE: {
                	SERVICE_KEY : "COMMAND_LINE",
                	ELEMENT : "#v-nav ul li[tab=ascli]"
                }

            }
        }
    };

    return servicemanager;

});
