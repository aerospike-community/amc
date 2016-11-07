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

define(["jquery", "underscore", "backbone","poller", "config/app-config", "helper/util","models/common/PopupModel","helper/AjaxManager"], 
	function($, _, Backbone, Poller, AppConfig, util,PopupModel,AjaxManager){

	var Login = {  

        toastNotification: function(type, msg, timeout){
			if(typeof timeout === 'undefined'){
				timeout = 1000;
			}
            if(typeof this.toastMsg === 'undefined')
                this.toastMsg = noty({text : msg, type : type, layout: "center", timeout: timeout, closeWith: []});
            else{
            	if ($("#" + this.toastMsg.options.id).parent()) {
                    $("#" + this.toastMsg.options.id).parent().remove();
             	}
                this.toastMsg = noty({text : msg, type : type, layout: "center", timeout: timeout, closeWith: []});
            }

        },
        
        bindAuthCheckEvt: function(){
            $("li.tab.auth-required").off("click").on("click", function(e){
                if(window.AMCGLOBALS.persistent.loggedInUser === null){
                    e.preventDefault();
                    Login.showLoginErrorMsg();
                    $("#userLoginButton").trigger("click",[function(){
                        window.location = $("#adminConsoleTabLinks").attr("href");
                    }]);
                    return false;
                }
            });
        },
        
        setLoginText: function(){
            $('#userLoginButton').text('Login');
        },
        clearLoginErrors: function(){
            $('#loginDialogMsg').html('').hide();
        },
        clearChangePasswordErrors: function(){
            $('#changePasswordErrorMsg').html('').hide();
        },
        showLoginContainer: function(){
            $("#loggedInUserContainer").hide();
            $('#loginContainer').show();
        },
        showUserContainer: function(){
            $('#loginContainer').hide();
            $("#loggedInUserContainer").show();
        },
        enableEnterKeyEvent: function(container, btn){
		    $(container).off("keyup").on("keyup",function(e) {
                if (e.keyCode === 13) {
                    $(btn).triggerHandler('click');
                }
            });
        },
		disableEnterKeyEventForDialog: function(container){
			$(container).off("keyup");
		},
        initAllEventHandlers: function(){
            Login.loginEventHandler();
            Login.initListHandler();
            Login.closeLoginCancelBtnEventHandler();
        },
        
        showLoginDialog: function(callback){
             var popupModel = new PopupModel({
                    'icon':'seed-node-dialog img-icon-seed-id',
                    'title':'Log In',
                    'header':'',
                    'modalClass':'user-popup',
                    'submitButtonValue':'Log in',
                    'cancelButtonValue':'Cancel',
                    'footer' : '</br>'
            });
                
            popupModel.set("content",'<label >Username</label>' +
                                        '<input id="loginUsername" class="input_textbox" name="username" value="admin" disabled="disabled" title="username" type="text">'+
                                        '</br>'+
                                        '<label >Password</label>'+
                                        '<input id="loginPassword" class="input_textbox" name="password" value="" title="password" type="password">'  +
                                        '</br>'+
                                        '<span class="status_message" id="loginDialogMsg" style="display:none"> </span>');
            
       
            
            var DOM = _.template($("#ModalTemplate").text(), popupModel.toJSON());

            function ModalSubmit(){
                Login.hideLoginError();
                var formData = Login.getLoginFormData();
                if(formData === null){
                    Login.showLoginError("Username or password can't be empty");
                }else{
                    Login.executeLoginRequest(formData, callback);
                    $("#userLoginButton").removeClass("active");
                }
            }

            function ModalCancel(){
                popupModel.destroy();
                $("#userLoginButton").removeClass("active");
                Util.hideModalDialog();
            }

            Util.showModalDialog(DOM, {dialogClass : "no-dialog-title", width : (innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth), closeOnEscape : true }, ModalSubmit, ModalCancel);
        },
        closeLoginDialog: function(){
			if(window.location.hash.indexOf('admin-console') != -1){
				var nodeListStr = '';
				if(typeof window.AMCGLOBALS.persistent.selectedNodes !== 'undefined' && window.AMCGLOBALS.persistent.selectedNodes !== null){
					nodeListStr = '/nodelist/'+window.AMCGLOBALS.persistent.selectedNodes;
				}
				var hashStr = window.AMCGLOBALS.persistent.seedNode + nodeListStr;
					window.location='/#dashboard/'  + hashStr;
			}
            Util.hideModalDialog();
        },
        closeLoginCancelBtnEventHandler: function(){
            $("#loginCancel").off("click").on('click',function(){
                Login.closeLoginDialog();
            });
        },
        closeChangePasswordDialog: function(){
            $("#changePasswordDialog").dialog('close');
        },
        closeChangePasswordCancelBtnEventHandler: function(){
            $("#changePasswordCancel").off("click").on('click',function(){
                Login.closeChangePasswordDialog();
            });
        },
        showLoginError: function(msg){
            $('#loginDialogMsg').html(msg).show(200);
        },
        hideLoginError: function(){
            $('#loginDialogMsg').html('');
            $('#loginDialogMsg').hide();
        },
        showChangePasswordError: function(msg){
            $('#changePasswordErrorMsg').html(msg).show(200);
        },
        hideChangePasswordError: function(){
            $('#changePasswordErrorMsg').html('').hide();
        },
        clearPasswordsInput: function(){
            $('#loginPassword').val('');
            $('#changePassOldPass').val('');
            $('#changePassNewPass').val('');
        },
        resetLogin: function(){
            window.AMCGLOBALS.persistent.loggedInUser = null;
            Login.setLoginText();
            Login.showLoginContainer();
            if(window.location.hash.indexOf('admin-console') !== -1){
                var nodeListStr = '';
                if(typeof window.AMCGLOBALS.persistent.selectedNodes !== 'undefined' && window.AMCGLOBALS.persistent.selectedNodes !== null){
                    nodeListStr = '/nodelist/'+window.AMCGLOBALS.persistent.selectedNodes;
                }
				
				if(!window.AMCGLOBALS.persistent.seedNode){
					window.AMCGLOBALS.persistent.seedNode = Util.getSeedNodeFromAddress();
				}
				
                var hashStr = window.AMCGLOBALS.persistent.seedNode != null ? (window.AMCGLOBALS.persistent.seedNode + nodeListStr) : "";
                window.location='/#dashboard/'  + hashStr;
                Login.showLoginErrorMsg();
            }
            Login.bindAuthCheckEvt();
        },
        showLoginErrorMsg: function(){
            Login.toastNotification('information','Please login as admin user',2000);
        },
        getLoginFormData: function(){
            var formData = {};
            formData.password = $('#loginPassword').val();
            if((formData.password) == ''){
                formData = null;
            }
            return formData;
        },
        getChangePasswordFormData: function(){
            var formData = {};
            formData.username = $('#loginUsername').val();
            formData.old_password = $('#changePassOldPass').val();
            formData.new_password = $('#changePassNewPass').val();
            if((formData.new_password) == '' || (formData.old_password) == ''){
                formData = null;
            }
            return formData;
        },
        setLoggedInUser: function(userName){
			window.AMCGLOBALS.persistent.loggedInUser = userName;
            window.AMCGLOBALS.persistent.userName = userName;
            Login.showUserContainer();
            Login.setUserName();
        },
        executeLoginRequest: function(formData, callback){
			$("body").append(AppConfig.cursorStyler.cursorStylerHtmlStr);
			
			AjaxManager.sendRequest(AppConfig.urls.LOGIN, {type : AjaxManager.POST, data : formData }, successHandler, failureHandler);
			function successHandler(data){
			    if(data.status === 'success'){
                    Login.closeLoginDialog();
                    Login.setLoggedInUser('admin');
                    Login.toastNotification('green','Login Successful');
                    $("li.tab.auth-required").off("click");
                    callback && callback();
                }else{
                    Login.showLoginError('Incorrect Username or Password');
                }
				$(AppConfig.cursorStyler.cursorStylerDiv).remove();
			}
			
			function failureHandler(data){
				Login.showLoginError("Can't connect to server");
				$(AppConfig.cursorStyler.cursorStylerDiv).remove();
			}
		
        },
        
        executeChangePasswordRequest: function(formData){
        	$("body").append(AppConfig.cursorStyler.cursorStylerHtmlStr);
			AjaxManager.sendRequest(AppConfig.urls.CHANGE_PASSWORD, {type : AjaxManager.POST, data : formData }, successHandler, failureHandler);
			
			function successHandler(data){
				if(data.status === 'success'){
                    Login.toastNotification('green','Password changed successfully');
                    Login.clearPasswordsInput();
					//Login.closeChangePasswordDialog();
                }else{
                    Login.showChangePasswordError('Incorrect current password');
                }
                $(AppConfig.cursorStyler.cursorStylerDiv).remove();
			}
			
			function failureHandler(data){
				if(data.status == 401){
					Login.clearPasswordsInput();
				}else {
					Login.showChangePasswordError("Failed");
				}	
				$(AppConfig.cursorStyler.cursorStylerDiv).remove();
			}
        },
        
        executeLogoutRequest: function(formData){
			$("body").append(AppConfig.cursorStyler.cursorStylerHtmlStr);
			AjaxManager.sendRequest(AppConfig.urls.GET_CURRENT_USER, {}, function(data){
			     if(data.username === null){
                        Login.resetLogin();
						Login.toastNotification('alert','Logged out Successfully');
						$(AppConfig.cursorStyler.cursorStylerDiv).remove();
                 }else{
                	 AjaxManager.sendRequest(AppConfig.urls.LOGOUT, {}, function(){
             			Login.resetLogin();
						Login.toastNotification('alert','Logged out Successfully');
						$(AppConfig.cursorStyler.cursorStylerDiv).remove();
                	 }, function(data){
                		 Login.bindAuthCheckEvt();
                		 if(window.AMCGLOBALS.activePage === 'admin-console'){
								var nodeListStr = '';
								if(typeof window.AMCGLOBALS.persistent.selectedNodes !== 'undefined' && window.AMCGLOBALS.persistent.selectedNodes !== null){
									nodeListStr = '/nodelist/'+window.AMCGLOBALS.persistent.selectedNodes;
								}
								var hashStr = window.AMCGLOBALS.persistent.seedNode + nodeListStr;
								window.location='/#dashboard/'  + hashStr;
							}
                		 $(AppConfig.cursorStyler.cursorStylerDiv).remove();
                	 });
                   }
			}, function(){
				Login.resetLogin();
				 $(AppConfig.cursorStyler.cursorStylerDiv).remove();
			});
        },

        loginEventHandler: function(){
            $("#userLoginButton").off("click").on('click',function(event, callback){
                if(typeof window.AMCGLOBALS.persistent.loggedInUser === 'undefined' || window.AMCGLOBALS.persistent.loggedInUser === null){
                    Login.showLoginDialog(callback);
                } else{
                    $('#userMenuContainer').slideToggle(200);
                }
            });
        },
        setUserName: function(){
            $('#userLoginButton').text(window.AMCGLOBALS.persistent.userName);
        },
        initChangePasswordEventHandler: function(){
			$('#changePasswordSubmit').off("click").on('click',function(){
				Login.hideChangePasswordError();
				var formData = Login.getChangePasswordFormData();
				if(formData === null){
					Login.showChangePasswordError("Password can't be empty");
				}else{
					Login.disableEnterKeyEventForDialog("#changePasswordContainer");
					if(Login.confirmChangePassword()){
						Login.executeChangePasswordRequest(formData);
					}
				}
			});
            Login.enableEnterKeyEvent("#changePasswordContainer", "#changePasswordSubmit");
        },
        confirmChangePassword: function(){
            if (confirm('Confirm Password Change')) { 
                return true;
            }else{
                return false;
            }
        },
        initListHandler: function(){
            $(document).on("mouseup", function(e){
                var container = $("#userLoginButton").add("#userMenuContainer");
                if((container.find(e.target)).length == 0 && !container.is(e.target)) {
                    if($("#userMenuContainer").css("display") === "block"){
                        $("#userMenuContainer").fadeOut(200);
                    }
                }
            });

            $("#logOutBtn").off("click").on('click',function(){
                if($("#userMenuContainer").css("display") === "block"){
                    $("#userMenuContainer").fadeOut(200);
                    $("#headerButtons .button.active").removeClass("active");
                }
                Login.executeLogoutRequest();
            });
        },
        checkeIfLoggedIn: function(asynchronous){
            Login.initAllEventHandlers();
			var authenticatedUser = false;
			if(asynchronous == null)
				asynchronous = true;
            $("li.tab.auth-required").off("click");
            try{
	            AjaxManager.sendRequest(AppConfig.urls.GET_CURRENT_USER, {async: asynchronous}, function(data){
                     if(data.username === null){
                         Login.resetLogin();
						 
                         authenticatedUser = false
	                 }else{
						Login.setLoggedInUser(data.username);
						authenticatedUser = true;
	                 }
                }, function (){ Login.resetLogin(); });	
            }catch(e){
                Login.resetLogin();
            }
			return authenticatedUser;
        }
    };
    return Login;
});  
  
