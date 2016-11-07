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

define(["jquery"], function($){
		
	var Notification = {
		   toastNotification : function(notificationType, message, timeout, showNotificationAsModel){
			   var notificationObj = {
					   text : message,
					   layout : "center",
					   type : notificationType,
					   timeout : (timeout == null ? 1000 : timeout),
					   model : (showNotificationAsModel == null ? false : showNotificationAsModel),
					   closeWith: ["click"]
					   
			   };
			   if(this.toastMsg != null){
				   /*Destroying old notification message*/
				   if ($("#" + this.toastMsg.options.id).parent()) {
	                    $("#" + this.toastMsg.options.id).parent().remove();
	               }
			   } 
			   this.toastMsg = noty(notificationObj);
		   }, 

		   cleanUp : function(){
		   		$.noty.closeAll();
		   		$(".noty_bar").parent().remove();
		   }
	};
	
	return Notification;
});	