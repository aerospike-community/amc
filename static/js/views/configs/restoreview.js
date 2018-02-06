/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "config/view-config", "config/app-config" ,"helper/AjaxManager"], function($, _, Backbone, ViewConfig, AppConfig,AjaxManager){
    
    var RestoreView = Backbone.View.extend({
        initialize: function(){
            var that = this;
            this.bindEvents();
            this.initAutoComplete();
            
            this.model.on("change:restoreStatus", function(model){
                var restoreStatus = model.get('restoreStatus');
                if(restoreStatus && restoreStatus !== ''){
                    if(restoreStatus === 'failure'){
                        that.renderFailure("Error", model.get('restoreMessage'));
                    } else if (restoreStatus === 'Success'){
                        $("#restoreStatusMessage").text(model.get('restoreMessage')).removeClass("status").removeClass("error").addClass("success").css("display","block");
                    } else if(restoreStatus === 'In Progress'){
                       that.renderInProgress();
                    }
                }
            });
        },
        
        render: function(jobs){
        
        },
      		
		renderFailure : function(errorString, msg){
			var error = "";
			if(errorString !== "")
				error = errorString + " : ";
			$("#restoreStatusMessage").text(error + msg).removeClass("status").removeClass("success").addClass("error").css("display","block");
		},
		
		renderInProgress : function(){
			$("#restoreStatusMessage").removeClass("success").removeClass("error").addClass("status").css("display","block").html("Restoring. Please wait! <img style='margin-left: 20px; width: 16px; height : 16px;' src='/static/images/loading.gif'>");
		},

		renderStatusMsg : function(msg){
			$("#restoreStatusMessage").addClass("status").removeClass("success").removeClass("error").css("display","block").text(msg);
		},
        
        bindEvents : function(){
			var that = this; 
			Util.enterKeyEventForDialog("#clusterRestoreContainer input:not(#backupListGet):not(#restoreFilename)", "#restoreRunSubmit");

			$("#restoreFileNetworkAddress").focusout(function(){
                that.checkForLocalhost();
            });

			$("#restoreFileNetworkAddress").off('change').on("change", function(){
				that.model.availableBackupListFetched = false;
				var address =  $( this ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				var path = "";
				var backupName = "";
				var namespace = "";

				if(typeof that.model.prefillData[address] !== 'undefined'){
					var path = _.keys(that.model.prefillData[address]);
						path = path[path.length - 1];
					var last = that.model.prefillData[address][path].length - 1
					
					var backupName = that.model.prefillData[address][path][last].backupName;
					var namespace = that.model.prefillData[address][path][last].namespace;
					$("#restoreFilesystemPath").val(path);
					$("#restoreNamespace").val(namespace);
					$("#restoreFilename").val(backupName).css("display","inline-block");
					$("#backupListGet").css("display","none");
					$("#backupListRefresh").css("display","inline-block");

					that.checkForLocalhost();
				}

				if(backupName === ""){
					$("#restoreFilename").attr("disabled","disabled").css("display","none");
					$("#backupListGet").css("display","inline-block");
					$("#backupListRefresh").css("display","none");
				} else{
					$("#restoreFilename").removeAttr("disabled");
				}
			});

			$("#restoreFilesystemPath").off('change').on("change", function(){
				that.model.availableBackupListFetched = false;
				var address =  $( "#restoreFileNetworkAddress" ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				var path =  $( this ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				var namespace = "";
				var backupName = "";
				
				if(typeof that.model.prefillData[address] !== 'undefined' && typeof that.model.prefillData[address][path] !== 'undefined'){
					var last = that.model.prefillData[address][path].length - 1
					
					backupName = that.model.prefillData[address][path][last].backupName;
					namespace = that.model.prefillData[address][path][last].namespace;
					$("#restoreNamespace").val(namespace);
					$("#restoreFilename").val(backupName).css("display","inline-block");
					$("#backupListGet").css("display","none");
					$("#backupListRefresh").css("display","inline-block");
				}				

				if(backupName === ""){
					$("#restoreFilename").attr("disabled","disabled").css("display","none");
					$("#backupListGet").css("display","inline-block");
					$("#backupListRefresh").css("display","none");
				} else{
					$("#restoreFilename").removeAttr("disabled");
				}
			});

			$("#restoreFilename").off('change').on("change", function(){
				var address =  $( "#restoreFileNetworkAddress" ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				var path =  $( "#restoreFilesystemPath" ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				var backupName = $( this ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				var namespace = "";

				if(typeof that.model.prefillData[address] !== 'undefined' && typeof that.model.prefillData[address][path] !== 'undefined'){
					namespace = _.find(that.model.prefillData[address][path], function(obj){
										return obj.backupName === backupName;
									});
					
					if(typeof namespace === 'undefined'){
						namespace = "";
					} else{
						namespace = namespace.namespace;
					}

					$("#restoreNamespace").val(namespace);
				}
			});

			
			$("#clusterRestoreContainer .input_textbox").on("focus",function(){
				$(this).css("box-shadow","none");
			 	$("#restoreStatusMessage").hide();
			});

			$('#restoreRunSubmit').off('click').on('click', function(event){
				that.clusterRestoreHandler();
			});
			
			$("#clusterRestoreContainer div.cluster-advanced-toggle").off('click').on("click",function(){
				var button = $("#clusterRestoreContainer div.cluster-advanced-toggle.advance-toggle-button");
				var buttonText = $("#clusterRestoreContainer div.cluster-advanced-toggle.advance-toggle-text");
				if(button.text() === "+"){
					button.text("-");
					button.attr("title","minimize");
					buttonText.attr("title","minimize");
				} else{
					button.text("+");
					button.attr("title","maximize");
					buttonText.attr("title","maximize");
				}
				
				$("#clusterRestoreContainer div.cluster-advanced").slideToggle("fast"); 
			});

			$("#backupListRefresh").add("#backupListGet").off('click').on("click",function(e){
				
				var noblanks = true;

				$("#clusterRestoreContainer input.form_basic.req").not($("#restoreFilename")).prop("value", function(i,value){
					if(value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') === ""){
						$(this).css("box-shadow","inset 0 0 7px 1px red");
						noblanks = false;
					}
					return value;
				});


				if(!noblanks){
					that.renderFailure("","Please fill in highlighted details!");
					return;
				} else {
					$("#backupListRefresh").add("#backupListGet").css("display","none");
					$("#restoreFilename").css("display","inline-block");
					$("#backupListLoading").css("display","block");
					that.fillAvailableBackupsList(true);
					that.model.formUpdated = false;
				}
			});
			
			$("#v-nav ul:first li[tab='restore']").on("click",function(){
                    if(that.model){
                        that.model.restorePoller.start();
                        that.model.polling = true;
                    }
					
					that.prefill();
			});
			
			$("#v-nav ul:first li").not($("#v-nav ul:first li[tab='restore']")).on("click",function(){
                 if(that.model){
                    that.model.restorePoller.stop();
                    that.model.polling = false;
                 }
			});

            $(document).on("view:Destroy",function(){
                if(that.model){
                    that.model.destroy();
                }
                
                that.model = null;
            });
		},

		checkForLocalhost : function(){
          $("#restoreUsername").prop('disabled', false);
          $("#restorePassword").prop('disabled', false);
		},
        
        clusterRestoreHandler : function(){
			var that= this;

			if(this.model.attributes.status === "In Progress"){
				this.model.restorePoller.stop();
				this.model.polling = false;
				this.renderFailure("Error", "Restore is already in progress on this cluster");
				setTimeout(function(){
					this.model.restorePoller.start();
					this.model.polling = true;
				}, 10000);

				return;
			}

			var disabledItems = $("#clusterRestoreContainer input:disabled");
			var inputBoxs = $("#clusterRestoreContainer input").not(disabledItems);
			inputBoxs.add("#clusterRestoreContainer button");
			
			$("#restoreStatusMessage").hide();

			$("#clusterRestoreContainer input.form_basic.req").prop("value", function(i,value){
				if(value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') === ""){
					$(this).css("box-shadow","inset 0 0 7px 1px red");
				}
				return value;
			});

			for(var i=0; i < inputBoxs.length; i++){
				if($(inputBoxs[i]).val() === "" && $(inputBoxs[i]).attr("name") !== "namespace" && $(inputBoxs[i]).attr("name") !== "username" && $(inputBoxs[i]).attr("name") !== "password"){
					this.renderFailure("","Please fill in highlighted details!");
					return -1;
				}
			}

			var formdata = this.getFormData();
			
			if(typeof formdata.backup_file === 'undefined'){
				$("#backupListRefresh").add("#backupListGet").css("display","none");
				$("#restoreFilename").css("display","inline-block");
				$("#backupListLoading").css("display","block");
				this.renderStatusMsg("Backup File Not Specified. Populating Available Backups using given information.");
				function reConfirm(status){
					if(status === "Success"){
						this.renderStatusMsg("Click 'Restore' again if you want to use the file specified by Available Backups.");
						$("#restoreFilename").blur();
						$("#restoreRunSubmit").focus();
					}
				}
				
				this.fillAvailableBackupsList(true, reConfirm);
				
				return;
			}

			if(formdata.backup_file !== ""){
				formdata.backup_file = "backup_" + formdata.backup_file.replace(" ","_");
			}

			if(formdata.source_location.lastIndexOf("/") != formdata.source_location.length - 1)
				formdata.source_location += "/";

			formdata.source_location += formdata.backup_file;

			inputBoxs.attr("disabled","disabled");
			
			this.renderStatusMsg("Initiating restore. Please Wait!");
			
			AjaxManager.sendRequest(AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.restore.initiationUrl,
				{type:AjaxManager.POST, data:formdata},successCallback, failerCallback);
			function successCallback(data){
			   	inputBoxs.removeAttr("disabled");

                  if(data.status === 'In Progress'){
						that.model.restorePoller.start();
						that.model.polling = true;
						that.renderInProgress();
                  }else if(data.status === 'failure'){
						that.renderFailure("Error",data.error);					
                  }else {
						that.renderFailure("Error","unknown error");		
					}
			}
			function failerCallback(response){
				inputBoxs.removeAttr("disabled");
				that.renderFailure("Error","Network error");
			}
        },
        
		fillAvailableBackupsList : function(asynchronous, callback){
			var that = this;
			var availableBackups = null;
			var status = "failure";
			var formdata = this.getFormData();
			$("#restoreFilename").val("");
			AjaxManager.sendRequest(AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.restore.availableBackups,
					{type:AjaxManager.POST, data:formdata, async : asynchronous},successCallback, failerCallback);
			function successCallback(data){
				status = data.status;
				$("#backupListLoading").css("display","none");
				if(data.status === "Success" && typeof data.available_backups !== 'undefined' && data.available_backups.length > 0){

					availableBackups = data.available_backups;
					$("#backupListRefresh").css("display","inline-block");
					
					that.model.availableBackupList = [];
					availableBackups = _.sortBy(availableBackups, function(d){ return d; });

					_.each(availableBackups,function(elem){
						that.model.availableBackupList.unshift(elem.substr(7).replace("_"," "));
					});

					$("#restoreFilename").removeAttr("disabled").val(that.model.availableBackupList[0]).trigger("change").focus();
					
					that.model.availableBackupListFetched = true;
					$("#restoreNamespace").val("");
					$("#restoreFilename").autocomplete("search","");						
				} else{
					$("#restoreFilename").css("display","none");
					$("#backupListGet").css("display","inline-block");
					var status = data.status;
					if(typeof data.error !== 'undefined'){
						that.renderFailure(data.status, data.error);
					} else{
						var error = "Unable to fetch available backups!";
						if(typeof data.available_backups !== 'undefined' && data.available_backups.length == 0){
							status = "Error";
							error = "No Backups available at the given location!";
						}
						that.renderFailure(status, error);
					}
				}

                callback && callback.apply(this,status);
			}
			function failerCallback(data,ts,st){
				that.renderFailure(ts,st);
				$("#backupListLoading").css("display","none");
				$("#restoreFilename").css("display","none");
				$("#backupListGet").css("display","inline-block");
				status = "failure";
			}
			

			if(!asynchronous){
				return status;
			} else{
				return -1;
			}
		},

		getFormData : function(){
			var formdata = {};
			var form = $("#clusterRestoreContainer input")
						.add("#clusterRestoreContainer select")
						.add("#clusterRestoreContainer .selected")
						.not("[type='button']")
						.not(":disabled")
						.not(".disabled");
			
			form.each(function(i,d){
				var elem = $(d);
				var name = elem.attr("name");
				var value = elem.val();

				if(elem.hasClass("selected")){
					value = elem.attr("data-value");
				}else if(elem.attr("type") === "checkbox"){
					if(elem.prop("checked")){
						value = "True";
					} else{
						value ="False";
					}					
				}
				formdata[name] = value;
			});
			
			if(!formdata.username || !formdata.password){
				formdata.username = "";
				formdata.password = "";
			}

			return formdata;
		},
        
        prefill : function(){
			var that = this;
			AjaxManager.sendRequest(AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.restore.knownBackups,
					{},successCallback);
			function successCallback(response){
				that.model.prefillData = {};

				for(var i=0; i < response.successful_backups.length; i++){
					var address = response.successful_backups[i].destination_node_address;
					
					if(typeof that.model.prefillData[address] === 'undefined')
						that.model.prefillData[address] = {};

					var folder = response.successful_backups[i].destination_location;
					folder = folder.substr(0,folder.lastIndexOf("/") + 1);

					var backup = response.successful_backups[i].destination_location.substr(folder.lastIndexOf("/") + 1);
						backup = backup.substr(7).replace("_", " ");

					var namespaceName = response.successful_backups[i].namespace;

					var backupFile = {backupName : backup, namespace : namespaceName};

					if(typeof that.model.prefillData[address][folder] === 'undefined')
						that.model.prefillData[address][folder] = [];

					that.model.prefillData[address][folder].push(backupFile);
				}

				var last = response.successful_backups.length - 1;
				if(response.successful_backups.length != 0){
					
					var folder = response.successful_backups[last].destination_location;
					folder = folder.substr(0,folder.lastIndexOf("/") + 1);

					var backup = response.successful_backups[last].destination_location.substr(folder.lastIndexOf("/") + 1);
					backup = backup.substr(7).replace("_", " ");

					$("#restoreFileNetworkAddress").val(response.successful_backups[last].destination_node_address);
					$("#restoreFilesystemPath").val(folder);
					$("#restoreNamespace").val(response.successful_backups[last].namespace);
					$("#restoreFilename").val(backup);

					that.checkForLocalhost();
				} else{
					$("#restoreFilename").attr("disabled","disabled").css("display","none");
					$("#backupListGet").css("display","inline-block");
					$("#backupListRefresh").css("display","none");
				}
				
				$("#restoreUsername").val("");
				$("#restorePassword").val("");
			}
		
			
		},
        
		renderBackupList : function(list, availableBackups){
			var text = availableBackups[availableBackups.length - 1].substr(7).replace(/_/g," ");
			var value = availableBackups[availableBackups.length - 1];

			$("#clusterRestoreContainer nav ul li:first a").text(text);
			$("#clusterRestoreContainer nav ul li:first a").attr("data-value", value);
			$("#restoreFilename").removeClass("disabled");

			for(var i=availableBackups.length - 1; i >= 0 ; i--){
				list.append("<li><a data-value='" + availableBackups[i] + "'>" + availableBackups[i].substr(7).replace(/_/g," ") + "</a></li>");
			}
		},

		renderNoBackupsList : function(){
			$("#restoreFilename nav ul li a").text("No backups available.");
			$("#restoreFilename nav ul li a").attr("data-value","NA");
			$("#clusterRestoreContainer nav ul ul").hide();
			$("#clusterRestoreContainer nav ul li a.selected").css("color","#757575");
			$("#clusterRestoreContainer nav ul:first").css("background-color","transparent");
		},
        
        initAutoComplete : function(){
			var that = this;
			function extractLast( term ) {
			  return term.split( /,\s*/ ).pop();
			}

			$( "#restoreFileNetworkAddress" ).autocomplete({
				minLength: 0,
				autoFocus : true,
				appendTo : "#clusterRestoreContainer div.ui-front.restoreNetworkAddress",
				source: function( request, response ) {
				  // delegate back to autocomplete, but extract the last term
				  response(that.model.prefillData && $.ui.autocomplete.filter(
					_.keys(that.model.prefillData), request.term) );
				},
				focus: function() {
				  // prevent value inserted on focus
				  return false;
				},
				select: function( event, ui ) {
				  event.stopPropagation();
				  this.value = ui.item.value;
				  $(this).trigger('change');
				  return false;
				}
			  }).on("mousedown",function(){     
		            $(this).autocomplete("search","");
		      });

			  $( "#restoreFilesystemPath" ).autocomplete({
				minLength: 0,
				autoFocus : true,
				appendTo : "#clusterRestoreContainer div.ui-front.restoreFilesystemPath",
				source: function( request, response ) {
				  // delegate back to autocomplete, but extract the last term
				  var autoFillArray = [];
			 	  var address = $( "#restoreFileNetworkAddress" ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
			 	  if(address !== '' && typeof that.model.prefillData[address] !== 'undefined'){
			 	  	autoFillArray = _.keys(that.model.prefillData[address]);				 	 
				  }
				  response( $.ui.autocomplete.filter(autoFillArray, request.term) );
				},
				focus: function() {
				  // prevent value inserted on focus
				  return false;
				},
				select: function( event, ui ) {
				  this.value = ui.item.value;
				  $(this).trigger('change');
				  return false;
				}
			  }).on("mousedown",function(){     
		            $(this).autocomplete("search","");
		      });

			  $( "#restoreFilename" ).autocomplete({
			   	autoFocus : true,
				minLength: 0,
				appendTo : "#clusterRestoreContainer div.ui-front.restoreFilename",
				source: function( request, response ) {
				  // delegate back to autocomplete, but extract the last term
				  if(!that.model.availableBackupListFetched){
					  that.model.availableBackupList = [];
				 	  var address = $( "#restoreFileNetworkAddress" ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				 	  var path = $( "#restoreFilesystemPath" ).val().replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				 	  if(address !== '' && typeof that.model.prefillData[address] !== 'undefined'){
				 	  	_.each(that.model.prefillData[address][path], function(element,index,list){
				 	  		that.model.availableBackupList.push(element.backupName);
				 	  	});		 	 
					  }
				  }

				  response(that.model.availableBackupList &&
                    $.ui.autocomplete.filter(that.model.availableBackupList, request.term) );
				},
				focus: function() {
				  // prevent value inserted on focus
				  return false;
				},
				select: function( event, ui ) {
				  event.stopPropagation();
				  this.value = ui.item.value;
				  $(this).trigger('change');
				  return false;
				}
			  }).on("mousedown",function(){     
		            $(this).autocomplete("search","");
		      });


		      $( "#restoreNamespace" ).autocomplete({
				   	autoFocus : true,
					minLength: 0,
					appendTo : "#clusterRestoreContainer div.ui-front.restoreNamespace",
					source: function( request, response ) {
					  // delegate back to autocomplete, but extract the last term
					  response( $.ui.autocomplete.filter(
						window.AMCGLOBALS.pageSpecific.namespaceList,request.term) );
					},
					focus: function() {
					  // prevent value inserted on focus
					  return false;
					},
					select: function( event, ui ) {
					  this.value = ui.item.value;
					  $(this).trigger('change');
					  return false;
					}
			  }).on("mousedown",function(){     
			            $(this).autocomplete("search","");
			  });

		}
		
    });
    
    return RestoreView;
});




