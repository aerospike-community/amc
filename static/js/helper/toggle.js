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

define(["jquery", "helper/util","config/app-config","helper/AjaxManager"], function($, Util,AppConfig,AjaxManager){
	var Toggle = {
		toastNotification: function(container, type, msg, details, timeOut, handle, callback){
			this.destroyToast(handle);
			var alertMsg = msg + '';
			var closeOptions = [];
						
			if(details !== null){
				closeOptions.push("button");
				alertMsg += "<br/><div class='notyDetailsButton' style='color: rgb(196, 196, 196); cursor: pointer; display : inline-block;'>Show Details</div>" + 
							"<div class='notyDetailedMsg' style='display : none; padding: 5px; border: 1px solid white; background-color: rgb(134, 134, 134);'>" + 
							details + "</div>";
			}
						
			var notyHandle = $(container).noty({text : alertMsg, type : type, timeout: timeOut, closeWith: closeOptions, callback:{
						onClose : function(){
							if(typeof callback !== 'undefined')
								callback();
						}
					}
				});
				
			$(container).find("div.notyDetailsButton").off("click");
			$(container).find("div.notyDetailsButton").on("click", function(){
				$(container).find("div.notyDetailedMsg").slideToggle();
				var button = $(container).find("div.notyDetailsButton");
				if(button.text() === "Show Details")
					button.text("Close Details");
				else
					button.text("Show Details");
			});
			
			if(details !== null){
				$(container).find(".noty_message").trigger("mouseover");
			}
			
			return notyHandle;
		},
		
		getCommandPrefix : function(toggleFor){
			if(toggleFor === 'node')
				return "switch_";
			else if(toggleFor === 'xdr')
				return "switch_xdr_";
			else
				return "";
		},

		destroyToast : function(handle){
			if(typeof handle !== 'undefined' && handle != null){
				//handle.close();
				if(handle != null && !!handle.$bar){
					handle.$bar.remove();
				}
				handle = null;
			}
			return null;
		},
	
		toggle : function(button, nodeAddress, status, rowView, toggleFor){
			var that = this;
			
			if(status !== 'undefined'){
				button.parent().addClass("in-flux-visibility");
			}
			
			if(status === 'on'){
				Toggle.toggleButton(button, nodeAddress, "off");
				Toggle.confirmToggleDialog(button, nodeAddress, "off", rowView, toggleFor);
			}else if(status === 'off'){
				Toggle.toggleButton(button, nodeAddress, "on");
				Toggle.confirmToggleDialog(button,nodeAddress, "on", rowView, toggleFor);
			}else{
				Toggle.toastNotification("div." + toggleFor + ".status-alert-container[name='" + nodeAddress + "']", "notification", toggleFor + " Status Unknown. Toggling Aborted.", null, "5000", rowView.alertQueue[nodeAddress]);
				that.disableViewSkips(button, nodeAddress, status, rowView);
			}
		},
		
		showToggleDialog : function(button,nodeAddress, toggleToState, rowView, toggleFor){
			
			var that = this;
			
			if(typeof window.modal === 'undefined'){
				window.modal = false;
			}
			
			if(!window.modal){
				window.modal = true;
				$("#credentialModalDialog").remove();
				var htmlstr = '<div id="credentialModalDialog" class="toggleForm"> <div class="title-bar"> <div class="icon-seed-node-dialog img-icon-seed-id"></div>Turning ' + toggleFor + ' [' + nodeAddress + '] ' + toggleToState + '</div>' +
						'<div class="user-popup-container">' +
							'<div class="user-popup">' +
								'<label>Username</label>' +
								'<input class="input_textbox req" name="username" value="root" title="username" type="text">' +
								'<br>' +
								'<div id="auth_radio_buttons">' +
									'<input id="password" type="radio" name="authToken" value="Password" checked="checked" style="vertical-align:middle;margin:0;"/>  Password' +
									'&nbsp; &nbsp;' +
									'<input id="ssh_key" type="radio" name="authToken" value="SSH_Key" style="vertical-align:middle;margin:0;"/>  SSH Key File Path' +
								'</div>' +
								'<br>' +
								'<div>' +
									'<div id="password_as_auth">' +
										'<label>Password</label>' +
										'<input class="input_textbox" name="password" value="" title="password" type="password">' +
									'</div>' +
									'<div id="sshkey_as_auth" style="display:none">' +
										'<label style="margin-top:-2px;">SHH Key File Path</label>' +
										'<input class="input_textbox req" name="ssh_key" value="" title="ssh_key">' +
									'</div>' +
								'</div>' +
								'<span class="status_message class" id="statusMessage" style="display: none;"></span>' +
							'</div>' +
							'<br>' +
							'<input id="credentialsModalSubmit" class="blue_btn btn" value="Authorize" type="submit">' +
							'<input id="modalCancel" class="clear_btn btn" value="Cancel" type="submit">' +
							'<br>' +
						'</div>' +
					'</div>';
				
				$("body").append(htmlstr);
				
				$("#credentialModalDialog").dialog({
					dialogClass: "no-dialog-title",
					modal: true,
					width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
					closeOnEscape: false,
					resizable: false
				});
				
				Toggle.enterKeyEventForDialog("#credentialModalDialog", "#credentialsModalSubmit");

				$('#auth_radio_buttons input:radio').on("click",function() {
				    if ($(this).val() === 'Password') {
						$('#sshkey_as_auth').hide()
						$('#password_as_auth').show()
						$('#sshkey_as_auth input').val("");
						$(".user-popup input[name='username']").val("root");
						$(".user-popup input[name='password']").css("box-shadow", "none");
				    } else if ($(this).val() === 'SSH_Key') {
						$('#password_as_auth').hide()
						$('#sshkey_as_auth').show()
						$('#password_as_auth input').val("");
						$(".user-popup input[name='username']").val("");
						$(".user-popup input[name='ssh_key']").css("box-shadow", "none");	
				    } 
				    $(".user-popup input[name='username']").css("box-shadow", "none");
				    $("#statusMessage").text("").removeClass("status error success").css("display", "none");
				});

				$(".user-popup input.input_textbox").off("focus").on("focus", function() {
                	$(this).css("box-shadow", "none");
            	});

            	$(".user-popup input.input_textbox").off("click").on("click", function() {
                	$("#statusMessage").text("").removeClass("status error success").css("display", "none");
            	});
				
				$("#credentialsModalSubmit").on("click",function(e){
					e.stopPropagation();
					var formdata = that.validateFormdata();
					if(!formdata) {
						return false;
					} else {
						$("#credentialModalDialog").off("keyup");
						$("#credentialModalDialog").dialog('destroy');
						$("#credentialModalDialog").remove();
						window.modal = false;
						that.toggleService(nodeAddress, button, rowView, toggleToState, toggleFor, formdata);
					}		
				});
				
				$("#modalCancel").on("click",function(e){
					e.stopPropagation();
					var status = 'on';
					if(toggleToState === 'on')
						status = 'off';
					that.disableViewSkips(button, nodeAddress, status, rowView);
					$('#auth_radio_buttons input:radio').off("click");	
					$("#modalCancel").off("click");
					$("#credentialsModalSubmit").off("click");
					$("#credentialModalDialog").off("keyup");
					$("#credentialModalDialog").dialog('destroy');
					$("#credentialModalDialog").remove();
					if(toggleToState === "on")
						Toggle.toggleButton(button, nodeAddress, "off");
					else
						Toggle.toggleButton(button, nodeAddress, "on");
					window.modal = false;
				});
			} else{
				setTimeout(function(){ that.showToggleDialog(button,nodeAddress, toggleToState, rowView, toggleFor); console.info(nodeAddress + " modal wait state");},1000);
			}
		},

		validateFormdata : function(){
			var statusMessageEL = $("#statusMessage");
            statusMessageEL.css("display", "none").addClass("class", "status_message");
        
            $(".user-popup input.input_textbox.req").prop("value", function(i, value) {
                if (value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') === "") {
                    $(this).css("box-shadow", "inset 0 0 7px 1px red");
                }
                return value;
            });

			var formdata = {};

			formdata.username = $("#credentialModalDialog input[name='username']").val();
			
			if($('#password').is(':checked')) {
				if($(".user-popup input[name='username']").val() === ""){
					statusMessageEL.text("Please fill in highlighted details!").addClass("error").css("display", "block");
                    return false;
				}
				formdata.password = $("#credentialModalDialog input[name='password']").val();
			} else {
				if($(".user-popup input[name='username']").val() === "" || $(".user-popup input[name='ssh_key']").val() === ""){
					statusMessageEL.text("Please fill in highlighted details!").addClass("error").css("display", "block");
                    return false;
				}
				formdata.ssh_key = $("#credentialModalDialog input[name='ssh_key']").val();
			}

			return formdata;
		},

		toggleButton : function(button, nodeAddress, toggleToState){
			
			var buttonContainer = $(button.selector);
			var iconClassName = toggleToState === 'on' ? 'green' : 'red';
			
			var htmlStr = '';
			buttonContainer.removeClass('green-visibility');
			buttonContainer.removeClass('red-visibility');
			buttonContainer.parent().removeClass('green-visibility');
			buttonContainer.parent().removeClass('red-visibility');
			buttonContainer.parent().addClass(iconClassName+'-visibility');
			
			var buttonSliderClass = iconClassName + '-visibility ' + buttonContainer.prop("class");

			if(toggleToState === 'on'){
				htmlStr += '<span class="text-status-visibility"> ' + toggleToState + '</span><div name="' + nodeAddress + '" class="'+buttonSliderClass+'"></div>';
			}else{
				htmlStr += '<div name="' + nodeAddress + '" class="'+buttonSliderClass+'"></div><span class="text-status-visibility">'+toggleToState+'</span>';
			}
			
			buttonContainer.parent().html(htmlStr);
			//Util.updateVisibilityBtnSize();
		},
		toggleService : function(nodeAddress, button, rowView, toggleToState, toggleFor, credentials){
			console.info("serviced");
			var that = this;
			var msg = "Turning " + toggleFor + " " + toggleToState + ". Please Wait.";
			var countDown = 120;
			
			if(typeof credentials === 'undefined')
				msg = "Contacting Node. Please Wait.";
				
			rowView.alertQueue[nodeAddress] = this.toastNotification("div." + toggleFor + ".status-alert-container[name='" + nodeAddress + "']", "information", msg, null, false, rowView.alertQueue[nodeAddress]);
			$("body").append(AppConfig.cursorStyler.cursorStylerHtmlStr);
		
			function startRowRefresh(){
				if(rowView.status === toggleToState){
					that.disableViewSkips(button, nodeAddress, rowView.status, rowView);
					rowView.alertQueue[nodeAddress] = that.destroyToast(rowView.alertQueue[nodeAddress]);
				}else {
					if( --countDown > 0 )
						setTimeout(startRowRefresh,1000);
					else
						revertState("Operation Timed Out");
				}
			}

			function revertState(error){
				var revertToState = toggleToState === 'on' ? 'off' : 'on';
				
				Toggle.toggleButton($("." + toggleFor + ".visibility-button-slider[name='" + nodeAddress + "']"), nodeAddress, revertToState);
			
				Toggle.toastNotification("div." + toggleFor + ".status-alert-container[name='" + nodeAddress + "']",
										"red",
										toggleFor + " toggle operation for " + nodeAddress + " failed.",
										error,
										false,
										rowView.alertQueue[nodeAddress],
										function(){
											that.disableViewSkips(button, nodeAddress, rowView.status, rowView);
										});
				//Toggle.toastNotification("red","Node toggle operation for " + nodeAddress + " failed. <br/>Server Message : <br/>'" + data.error + "'");	
			}

			function successCallback(data){
				 if(data.status === 'Success'){
				 		countDown = 120;
						startRowRefresh();
					}else if(data.status === 'Failure' /* && data.error.indexOf('Authentication') != -1 */ && typeof credentials === 'undefined'){
						rowView.alertQueue[nodeAddress] = that.destroyToast(rowView.alertQueue[nodeAddress]);
						console.info("here");
						that.showToggleDialog(button,nodeAddress, toggleToState, rowView, toggleFor);
					}else {
						revertState("Server Message : '" + data.error + "'");
					}
					$(AppConfig.cursorStyler.cursorStylerDiv).remove();
			}
			
			function failureCallback(data){
				$.noty.close(rowView.alertQueue[nodeAddress]);
				rowView.alertQueue[nodeAddress] = null;
			
                Toggle.toastNotification("red","Network Error");
				that.disableViewSkips(button, nodeAddress, rowView.status, rowView);
				$(AppConfig.cursorStyler.cursorStylerDiv).remove();
			}
			AjaxManager.sendRequest(AppConfig.baseUrl+window.AMCGLOBALS.persistent.clusterID+"/nodes/"+nodeAddress+"/"+ Toggle.getCommandPrefix(toggleFor) + toggleToState,
					{type: AjaxManager.POST,data : credentials},successCallback, failureCallback);
		},

		enterKeyEventForDialog: function(container, btn){
			console.info(container);
            $(container).on("keyup",function(e) {
                if (e.keyCode === 13) {
                    $(btn).triggerHandler('click');
                }
            });
        },
		
		confirmToggleDialog : function(button,nodeAddress, toggleToState, rowView, toggleFor){
			
			var that = this;
			
			if(typeof window.modal === 'undefined'){
				window.modal = false;
			}
			
			if(!window.modal){
				window.modal = true;
				$("#confirmModalDialog").remove();
				var htmlstr = '<div id="confirmModalDialog" class="toggleForm"> <div class="title-bar"> <div class="icon-seed-node-dialog img-icon-seed-id"></div>Turning ' + toggleFor + ' [' + nodeAddress + '] ' + toggleToState + '</div>' +
						'<div class="user-popup-container">' +
							'<div class="user-popup">' +
								'Are You Sure?' + 
							'</div>' +
							'<br>' +
							'<input id="confirmModalSubmit" class="blue_btn btn" value="Yes" type="submit">' +
							'<input id="modalCancel" class="clear_btn btn" value="No" type="submit">' +
							'<br>' +
						'</div>' +
					'</div>';
				
				$("body").append(htmlstr);
				
				$("#confirmModalDialog").dialog({
					dialogClass: "no-dialog-title",
					modal: true,
					width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
					closeOnEscape: false,
					resizable: false
				});
				
				Toggle.enterKeyEventForDialog("#confirmModalDialog", "#confirmModalSubmit");
				
				$("#confirmModalSubmit").on("click",function(e){
					e.stopPropagation();
					$("#confirmModalDialog").dialog('destroy');
					$("#credentialModalDialog").off("keyup");
					$("#confirmModalDialog").remove();
					window.modal = false;
					that.toggleService(nodeAddress, button, rowView, toggleToState, toggleFor);
				});
				
				$("#modalCancel").on("click",function(e){
					e.stopPropagation();
					that.disableViewSkips(button, nodeAddress, rowView.status, rowView);	
					$("#modalCancel").off("click");
					$("#confirmModalSubmit").off("click");
					$("#credentialModalDialog").off("keyup");
					$("#confirmModalDialog").dialog('destroy');
					$("#confirmModalDialog").remove();

					$(button.selector).parent().removeClass("in-flux-visibility");

					if(toggleToState === "on")
						Toggle.toggleButton(button, nodeAddress, "off");
					else
						Toggle.toggleButton(button, nodeAddress, "on");
					window.modal = false;
				});
			} else{
				setTimeout(function(){ that.showToggleDialog(button,nodeAddress, toggleToState, rowView, toggleFor); console.info(nodeAddress + " modal wait state");},1000);
			}
		},
		
		disableViewSkips : function(containerInfo, nodeAddress, status, view){
			var button = $(containerInfo.selector);
			view.skip = false;
			button.parent().removeClass("in-flux-visibility");
		}
	};
	
	return Toggle;
});