/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery","underscore","backbone", "config/app-config", "models/common/PopupModel","helper/AjaxManager","helper/servicemanager","helper/notification","helper/sessionmanager", "helper/util"],
	function($,_, Backbone, AppConfig ,PopupModel,AjaxManager,ServiceManager,Notification,SessionManager, Util){

  var _tlsProps = {};
	var AuthManager = {

			getLoggedInUserInfo : function(clusterID){
				 try{
			           AjaxManager.sendRequest(AppConfig.baseUrl + clusterID + AppConfig.urls.GET_CURRENT_USER,
			           		{async:false}, function(response){
					        	if(response.username === null){
					        		SessionManager.cleanupLocalUserSession();
					            } else {
						            SessionManager.putItemIntoSession(AppConfig.sessionKeys.username,response.username);
						            SessionManager.putItemIntoSession(AppConfig.sessionKeys.userClusterId,response.cluster_id);
								}
			            	}, function(response){
				            	console.log(response);
				            	SessionManager.cleanupLocalUserSession();
			            });
			        }catch(e){
			        	console.log(e);
			        	SessionManager.cleanupLocalUserSession();
		            }
			 },

       setTLSProps: function(address, name, key, certificate, encryptOnly) {
         _tlsProps[address] = {
           certificate : certificate,
           name        : name,
           key         : key,
           encryptOnly : encryptOnly,
        };
       },

			 showUserLoginPopup : function(properties,callback,showErrorMessage,clusterName,multiclusterview){
			 	var that = this;

				var displayStatus = (showErrorMessage ? 'inline' : 'none');
	            var content =   '<span style="color:red;display:'+displayStatus+'">You have logged out or your session timed out.</span> <br\><br\>';

				if(ServiceManager.isSecurityEnable()){
					content +=	'<label >Username</label>' +
								'<input id="loginUsername" class="input_textbox" name="username" value="" title="username" type="text">'+
								'</br>'+
								'<label >Password</label>'+
								'<input id="loginPassword" class="input_textbox" name="password" value="" title="password" type="password">'  +
								'</br>'+
								'<span class="status_message" id="loginDialogMsg" style="display:none"> </span>';
				} else {
					content += "<span>Please refresh the page to start a new session.</span><br/>";
				}


	            var popupModel = new PopupModel({
	                    'icon':'seed-node-dialog img-icon-seed-id',
	                    'title': properties.title || 'Log In',
	                    'header':'',
	                    'modalClass': 'user-popup' + (properties.modalClass != null ? (" " + properties.modalClass) : ""),
	                    'submitButtonValue': 'Login',
	                    'cancelButtonValue': 'Cancel',
	 					'showCancelButton' : true,
	                    'footer' : '</br>'
	            });


	            popupModel.set("content", content);


	            var DOM = _.template($("#ModalTemplate").text())( popupModel.toJSON());

	            function userLogin() {
	                if(that._isUserEnterValidData()){
	                	var formdata = that._getUserLoginObject(properties.seedNode);

	                	if(clusterName != null)
	                		formdata.cluster_name = clusterName;

	                	var clusterData = that.authenticateUser(properties.seedNode,formdata);
	                	var forceRefresh = SessionManager.getItemFromSession("username") !== formdata.username;

	                	if(clusterData.cluster_id != null && (window.AMCGLOBALS.persistent.clusterID !== clusterData.cluster_id || forceRefresh) ){
							window.$.event.trigger("app:refreshGlobal");
							window.AMCGLOBALS.persistent.seedNode = clusterData.seed_address;
						}

						if(clusterData.cluster_id != null){
							that.loginSuccessHandlerForUser(clusterData.cluster_id,formdata.username,multiclusterview);
							popupModel.destroy();
			            	Util.hideModalDialog();
			            	callback && callback(clusterData, forceRefresh);
						}
	                }
	            }
	            function cancelLogin() {
	            	callback && callback(null);
	            }
	            Util.showModalDialog(DOM, {dialogClass : "no-dialog-title", width : (innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth), closeOnEscape : false }, userLogin, cancelLogin);
	        },

	        loginSuccessHandlerForUser : function(clusterId,username,multiclusterview){
	        	//$(AppConfig.header.loginButtonId).css("display","inline-block");
				$("body").addClass("secure");
            	// this._setLoggedInUser(username);

            	SessionManager.putItemIntoSession(AppConfig.sessionKeys.username,username);
            	SessionManager.putItemIntoSession(AppConfig.sessionKeys.userClusterId,clusterId);
            	/*if(multiclusterview !== true){*/
	            	var roleList = ServiceManager.getUserRoles(clusterId);
					ServiceManager.setLoggedInUserRoles(roleList);
					ServiceManager.showAccessibleModules();
				/*}*/
		    	$(AppConfig.header.loggedInUserContainer).show();
            	this._initLoginSuccessEvents();
	        },

	        _initLoginSuccessEvents : function(){

	        },

	        executeLogoutRequest : function(clusterId){
	        	Util.pauseAllActivePollers(false, true);
	        	if(this._logoutUser_(clusterId)){
	               	 ServiceManager.hideAllHeaderTab();
	               	 var mainContainer = $("#mainContainer");
	               	 mainContainer.attr("class","container_16 main-container ").empty();
	               	 window.$.event.trigger("view:Destroy",window.AMCGLOBALS.activePage);
	           		 window.$.event.trigger({type: "app:refreshGlobal"});
	           		 window.AMCGLOBALS.clusterInitiated = false;
	           		 return true;
	            } else {
	            	Util.resumeAllActivePollers(true);
                	return false;
                }
	        },

	        showChangeLoginPopup : function(){
	        	var that = this;
	            var popupModel = new PopupModel({
	                    'icon':'seed-node-dialog img-icon-seed-id',
	                    'title':'Change Password',
	                    'header':'',
	                    'modalClass':'user-popup',
	                    'showCancelButton' : false,
	 					'showSubmitButton' : false,
	                    'footer' : '</br>'
	            });

	            popupModel.set("content",
	            			'<div class="tab-content">'+
								'<div class="change-password-container" id="changePasswordContainer">'+
									'<div class="keyValueBinder">'+
										'<label for="password">User Name</label>'+
										'<input id="currentUserName" class="input_textbox" name="currentUserName" value="'+ SessionManager.getItemFromSession(AppConfig.sessionKeys.username) +'" title="username" type="text" disabled>'+
									'</div>'+
									'<div class="keyValueBinder">'+
										'<label for="password">Current Password</label>'+
										'<input id="changePassOldPass" class="input_textbox" name="old_password" value="" title="password" type="password" autofocus>'+
									'</div>'+
									'<div class="keyValueBinder">'+
										'<label for="password">New Password</label>'+
										'<input id="changePassNewPass" class="input_textbox" name="new_password" value="" title="password" type="password">'+
									'</div>'+
									'<div class="keyValueBinder">'+
										'<label for="password">Confirm Password</label>'+
										'<input id="changePassConfirmPass" class="input_textbox" name="confirm_password" value="" title="Confirm Password" type="password">'+
									'</div>'+
									'<span class="status_message" id="changePasswordErrorMsg" style="display:none">'+
										'Incorrect current password'+
									'</span>'+
									'<button id="ModalSubmit" class="blue_btn btn" style="width:132px;"> Change Password </button>'+
									'<button id="ModalCancel" class="blue_btn btn"> Cancel </button>'+
				                 '</div>'+
						   '</div>'
					);


	            var DOM = _.template($("#ModalTemplate").text(), popupModel.toJSON());

	            function changePassword() {
	            	that._hideMessage("#changePasswordErrorMsg");
					if(that._validateChangePasswordData() && that._confirmChangePasswordAction()) {
						that._disableEnterKeyEventForDialog("#changePasswordContainer");
						that.executeChangePasswordRequest(that._getChangePasswordFormData(),popupModel);
					}
					return false;
	            }

	            function cancelChangePassword() {
	            	popupModel.destroy();
	            	Util.hideModalDialog();
	            }


	            Util.showModalDialog(DOM, {dialogClass : "no-dialog-title", width : (innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth), closeOnEscape : true },
	            		changePassword, cancelChangePassword);

	            this.enableEnterKeyEvent("#changePasswordContainer", "#changePasswordSubmit");
	        },

	        /**
	         * authenticate user authorize given user in provided seed node.
	         * Server return either response.status = success/failure.
	         * If server return response success, in that case it also return cluster id for given seed node
	         *
	         */
	        authenticateUser : function(seedNode,formData) {
	        	var that = this;
	        	var clusterData = {};
	        	$("body").append(AppConfig.cursorStyler.cursorStylerHtmlStr);
	        	formData.seed_node = seedNode;
	        	AjaxManager.sendRequest(AppConfig.baseUrl + "get-cluster-id", {type : 'POST', data : formData, async : false }, successHandler, failureHandler);
				function successHandler(response) {
				    if(response.status === 'success'){
				    	_.extend(clusterData, response);
	                } else {
	                	that._showMesssge('#loginDialogMsg', response.error);
	                }
				}
				function failureHandler(response){
					if(response.status === 401)
						that._showMesssge('#loginDialogMsg', "Incorrect Username or Password");
					else
						that._showMesssge('#loginDialogMsg', "Can't connect to server");
				}
				$(AppConfig.cursorStyler.cursorStylerDiv).remove();
				return clusterData;
			},

	        executeChangePasswordRequest: function(formData, callback){
	        	var that = this;
	        	$("body").append(AppConfig.cursorStyler.cursorStylerHtmlStr);

	        	Util.pauseAllActivePollers(false, true);
				AjaxManager.sendRequest(AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.urls.CHANGE_PASSWORD, {type : AjaxManager.POST, data : formData }, successHandler, failureHandler);

				function successHandler(data){
					if(data.status === 'success'){
						Notification.toastNotification('green','Password changed successfully');
		            	Util.hideModalDialog();
		            	Util.resumeAllActivePollers(true);
			        }else{
			        	that._showMesssge("#changePasswordErrorMsg", 'Incorrect current password');
			        	Util.resumeAllActivePollers(true);
	                }
	                $(AppConfig.cursorStyler.cursorStylerDiv).remove();
	                callback && callback(data.status);
				}

				function failureHandler(data){
					if(data.status == 401){
						that._clearPasswordsInput();
					}else {
					 	that._showMesssge("#changePasswordErrorMsg", 'Failed');
					}
					Util.resumeAllActivePollers(true);
					$(AppConfig.cursorStyler.cursorStylerDiv).remove();
					callback && callback(data.status);
				}
	        },

	        _logoutUser_ : function(clusterId) {
	        	var that = this;

	        	//SKIPPING session-terminate
	        	that._resetLogin_();
	        	return true;

	        	/*
	        	var result = false;
	        	var postData = {};
	        	postData.cluster_id = clusterId;
	        	AjaxManager.sendRequest(AppConfig.urls.SESSION_TERMINATE, {type:AjaxManager.POST,async : false,data:postData}, function(response){
	        		that._resetLogin_();
            		result = true;
            	}, function(data){
            		 if(typeof data === "object" && data.status === 401){

            		 } else {
            			 Notification.toastNotification('alert','unable to connect server');
            		 }

            	});
	        	return result;
	        	*/
	        },

	        logoutUser : function() {
	        	var that = this;

	        	//SKIPPING session-terminate
				// var mainContainer = $("#mainContainer");
				// mainContainer.attr("class","container_16 main-container ").empty();
				// window.$.event.trigger("view:Destroy",window.AMCGLOBALS.activePage);
				// window.$.event.trigger({type: "app:refreshGlobal"});

                // var seedNode = (typeof seedNode !== "undefined") ? seedNode : window.AMCGLOBALS.persistent.seedNode;
                // that.executeLogoutRequest(window.AMCGLOBALS.persistent.clusterID);
                // Util.pauseAllActivePollers(false, true);
                // window.$.event.trigger("view:Destroy",window.AMCGLOBALS.activePage);
                // $("#mainContainer").empty();
                // AuthManager.showUserLoginPopup({
                //         "seedNode" : seedNode,
                //         "modalClass" : "session-error",
                //         "title" : "Invalid Session!"
                //     },function(){
                //     window.$.event.trigger({type: "app:refreshGlobal"});
                //     window.AMCGLOBALS.clusterInitiated = false;
                //     window.location.hash = "dashboard/" + seedNode;
                // },true);
	        	// that._resetLogin_();
                AuthManager.showUserLoginPopup({"seedNode" : window.AMCGLOBALS.persistent.seedNode},function(response, forceRefresh){
                	// console.log("================");
					        	// that._resetLogin_();
                                // clusterIdHandler(response, forceRefresh);
                            }, false, null);
	        	return true;
	        },

	        terminateSession : function(clusterId) {
	        	var that = this;

	        	var result = false;
	        	var postData = {};
	        	postData.cluster_id = clusterId;
	        	AjaxManager.sendRequest(AppConfig.urls.SESSION_TERMINATE, {type:AjaxManager.POST,async : false,data:postData}, function(response){
	        		that._resetLogin_();
            		result = true;
            	}, function(data){
            		 if(typeof data === "object" && data.status === 401){

            		 } else {
            			 Notification.toastNotification('alert','unable to connect server');
            		 }

            	});

        		that._resetLogin_();
        		result = true;

				var mainContainer = $("#mainContainer");
				mainContainer.attr("class","container_16 main-container ").empty();
				window.$.event.trigger("view:Destroy",window.AMCGLOBALS.activePage);
				window.$.event.trigger({type: "app:refreshGlobal"});
				window.AMCGLOBALS.clusterInitiated = false;
                window.location.hash = "dashboard";
	        	return result;
	        },




	        enableEnterKeyEvent: function(container, btn){
			    $(container).off("keyup").on("keyup",function(e) {
	                if (e.keyCode === 13) {
	                    $(btn).triggerHandler('click');
	                }
	            });
	        },

	        _getUserLoginObject : function(address){
	        	var formData = {};
            var tls = _tlsProps[address];
	        	formData.username =  $("#loginUsername").val().trim();
	            formData.password = $('#loginPassword').val().trim();
            if(tls) {
              formData.tls_name = tls.name;
              formData.cert_file = tls.certificate;
              formData.key_file = tls.key;
              formData.encrypt_only = tls.encryptOnly;
            }
	            return formData;
	        },

	        _isUserEnterValidData : function() {
	        	this._hideMessage("#loginDialogMsg");
	           	if($("#loginUsername").val().trim().length === 0 || $('#loginPassword').val().trim().length === 0){
	        		this._showMesssge('#loginDialogMsg', "Username or password can't be empty");
	        		return false;
	        	}
	        	return true;
	        },

	    	_setLoggedInUser: function(userName){
			    // $(AppConfig.header.loginButtonId).text(userName);
	        },

	        _clearPasswordsInput: function(){
	            $('#loginPassword').val('');
	            $('#changePassOldPass').val('');
	            $('#changePassNewPass').val('');
	        },

	        _validateChangePasswordData : function() {
	        	var old_password = $('#changePassOldPass').val().trim();
	            var new_password = $('#changePassNewPass').val().trim();
	            var confirmPassword = $("#changePassConfirmPass").val().trim();
	            if(old_password.length === 0 || new_password.length === 0 || confirmPassword.length === 0){
	            	this._showMesssge("#changePasswordErrorMsg", "Password can't be empty");
	            	return false;
	            }

	            if(new_password !== confirmPassword) {
	            	this._showMesssge("#changePasswordErrorMsg", "New and Confirm password not match.");
	            	return false;
	            }

	            if(old_password === new_password){
	            	this._showMesssge("#changePasswordErrorMsg", "Old password and new password are same.");
	            	return false;
	            }

	            this._hideMessage("#changePasswordErrorMsg");
	            return true;
	        },

	        _getChangePasswordFormData: function(){
	            var formData = {};
	            formData.user = SessionManager.getItemFromSession(AppConfig.sessionKeys.username);
	            formData.old_password = $('#changePassOldPass').val().trim();
	            formData.new_password = $('#changePassNewPass').val().trim();
	            formData.confirm_password = $('#changePassConfirmPass').val().trim();
	            return formData;
	        },

	        _confirmChangePasswordAction: function(){
	            if (confirm('Confirm Password Change')) {
	                return true;
	            }else{
	                return false;
	            }
	        },

	        _disableEnterKeyEventForDialog: function(container){
				$(container).off("keyup");
			},

			_showMesssge : function(container, message) {
				$(container).html(message).show(200);
			},

			_hideMessage : function(container){
				$(container).html('').hide();
			},
		   _resetLogin_ : function(){
				$("body").removeClass("secure");
				window.$("#headerButtons .button.active").trigger("click");
				//$("#headerButtons .button.active").removeClass("active");
				$("#wrap .drop-downs .overlay").fadeOut(200);
				//$(AppConfig.header.subHeader).slideUp(200);
 	        	Util.cleanAlerts();
	        	SessionManager.cleanupLocalUserSession();
	        }

	};

	return AuthManager;

});
