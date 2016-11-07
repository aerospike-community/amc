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

define(["jquery","underscore","helper/util"],function($,_,Util){
	var AjaxManager = {
	                   
	    //Request type constants               
	    GET : "GET",
	    POST : "POST",
	    UPDATE : 'UPDATE',
	    DELETE : 'DELETE',
		
		initAjaxFailureCatch : function(){
			$(function(){
				//setup ajax error handling
	            $.ajaxSetup({
	                always : function(x){
	                    if(typeof x.responseText !== 'undefined' && x.responseText.indexOf("Invalid cluster id") != -1){
	                        Util.clusterIDReset();
	                    }
	                },
	                fail: function (x, status, error) {
	                    if (x.status == 401) {
	                        Util.showUserSessionInvalidateError(window.AMCGLOBALS.persistent.clusterID);
	                    }
	                }
	            });
			});
		},
		
		//Send the ajax request
		sendRequest :  function(url, customOption, successCallback, failCallback){
			var defaultOptions = {
				type  : this.GET,
				async : true,
				cache : true,
				data : {},
				dataType : 'json',
				contentType : 'application/json; charset=utf-8'
			};
			
			var options = $.extend({}, defaultOptions, customOption);
			
			//Actual send the ajax request
			var request = $.ajax({
				type  : options.type,
				url   : url,
				async : options.async,
				cache : options.cache,
				data  : options.data,
				headers  : options.header || {}
			})
			.done(function(data,textStatus, jqXHR ){
				successCallback && successCallback(data);
			})
			.fail(function(data,textStatus, errorThrown){
				failCallback && failCallback(data,textStatus, errorThrown);
			});
			
			return request;
		}, 
		
		//This function will abort the ajax request
		abortAjaxRequest : function(request){	
			//Abort the ajax request, it is not completed
			if(request && request.readyState !== 4){
				request.abort();
			}
		}
	};
	
	return AjaxManager;
	
});