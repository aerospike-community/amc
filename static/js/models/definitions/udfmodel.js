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

define(["underscore", "backbone", "poller", "views/definitions/udfview", "helper/definitions/sindex-table", "config/app-config", "helper/util", "helper/servicemanager", "helper/AjaxManager"], function(_, Backbone, Poller, UdfView, SIndexTable, AppConfig, Util, ServiceManager, AjaxManager){
    var UdfModel = Backbone.Model.extend({
        initialize: function(){
			this.CID = window.AMCGLOBALS.currentCID;

            var model = _.find( AppConfig.udfDefListColumn, function(coloumn){
                return coloumn.name === "filename";
            } );

            if( ServiceManager.isUserHasAccessToService("REMOVE_UDF") ){
                model.formatter = function( cellvalue, options, rowObject ){
                    return "<span class='drop-udf-btn hover-drop-btn icon-cancel-circle remove-node-icon' style='display: inline-block'></span><span>" + cellvalue + "</span>";
                };
            } else {
                delete model.formatter;
            }

            this.initVariables();
            this.startEventListeners();
        },
        initVariables: function(){
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
            this.isInitialized = false;
            this.lastUDFFileAdded = null;
            this.views = {};
			this.tableDiv = AppConfig.udf.tableDiv;
            var tableWidth = ($(".table-container.box-container").width() - 70);
            SIndexTable.initGrid($(this.tableDiv), AppConfig.udfDefList, AppConfig.udfDefListColumn, true, tableWidth, this);
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + '/udfs';
        }, 
        fetchSuccess: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
			model.initUdfView(model);
			model.initEventHandlers(model.views);
			this.stop();
			
			if(model.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				model.clusterID = window.AMCGLOBALS.persistent.clusterID;
				 
			}  
			
			if(typeof model.attributes.error !== 'undefined' && model.attributes.error.indexOf("Invalid cluster id") != -1){
				delete model.attributes.error;
				Util.clusterIDReset();				
			}
        },
        initUdfView: function(model){
            var modelData = model.attributes;
            var udfI = 0;
            
            model.udfData = modelData.udfs;
            
            if(_.isEmpty(model.udfData)){
                model.views[0] = new UdfView({tableDiv:model.tableDiv, viewID:0 ,model: model});
                
            }else{
                var removedUDFs = _.difference( _.map( model.views, function(udf){ return udf.viewID; }), _.keys( model.udfData ) );

                removedUDFs.forEach( function( hashID ){
                    var udfView = _.find( model.views, function( udf ){
                        return udf.viewID === hashID;
                    });

                    udfView.clean(udfView.viewData.filename.substr(0, udfView.viewData.filename.length - 4));
                    
                    for( var index in model.views ){
                    	if(model.views[index] === udfView){
                    		delete model.views[index];
                    		break;
                    	}
                    }

                });

                for(var hashID in model.udfData){
                    var filename = model.udfData[hashID].filename;
                    filename = filename.substr(0, filename.length - 4);

                    model.views[udfI] = new UdfView({tableDiv:this.tableDiv, viewID:hashID, model: model});
                    model.views[udfI].render(model, model.udfData[hashID], filename);
                    udfI++;
                }
            }

            model.initRemoveUDFListener(model.tableDiv);
            
        },

        initRemoveUDFListener : function(tableDiv){
            //Move the function to views
            var that = this;
            $(tableDiv + " .drop-udf-btn").off("click").on("click", function(event){
                var filename = $(this).parent().parent().attr("id");
                filename += ".lua";
                that.displayDropConfirm(filename, function(){
                    that.dropUDF(filename, function(status, message){
                        if(status === "success"){
                            noty({text : message || "Success", type : 'green', layout: "center", timeout: 8000});
                        } else{
                            noty({text : message || "Failure", type : 'red', layout: "center", timeout: 8000});
                        }
                    });
                });
            });
        },

        startEventListeners : function (){
            var that = this;
            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            };

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
        },

        initEventHandlers: function(views){
            var view;
            
            for(var v in views){
                view = views[v];
                if(view.viewData['synced'] !== 'YES'){
                    view.startEventHandlers();
                }
            }
        },
        fetchError: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
			
            var that = this;
            try{
                
                model.displayNetworkErrorRow(model);
            }catch(e){
                console.info(e.toString());
            }
        },
        displayNetworkErrorRow: function(model){
            model.views[0] = new UdfView({tableDiv:model.tableDiv, viewID:0 ,model: model});
        },

        dropUDF: function(filename, callback){
            console.log(filename);
            var that = this;

            AjaxManager.sendRequest(AppConfig.baseUrl + AMCGLOBALS.persistent.clusterID + "/drop_udf", 
                {async: true, data: {file_name : filename}, type: AjaxManager.POST},
                function(response){//SUCCESS

                    setTimeout(function(){                  //Delay for changes to reflect
                        that.fetch({
                            success : function(){
                                that.initUdfView(that);
                            }
                        });
                    }, 1000);
                    
                    callback && callback(response.status, (response.status === "success" ? "Remove UDF Successful" : response.error));
                    console.log(response);
                },
                function(response){//FAILURE
                    callback && callback("failure", "Unknown error");
                }
            );
        },

        addNewUDF : function(UDFData, callback){
            var that = this;

            that.lastUDFFileAdded = _.clone(UDFData);

            AjaxManager.sendRequest(AppConfig.baseUrl + AMCGLOBALS.persistent.clusterID + "/add_udf", 
                {async: true, data: UDFData, type:AjaxManager.POST},

                function(response){
                	var message;
                	that.lastUDFFileAdded.status = response.status;

					if(response.status === "success"){
						message = "Register UDF Successful";
						setTimeout(function(){                  //Delay for changes to reflect
							that.fetch({
								success : function(){
									that.initUdfView(that);
								}
							});
						}, 1000);
					} else{
						if(response.error.indexOf("error=compile_error") != -1){
							message = "Compilation Error";

							var lineNumberStart = response.error.indexOf("line=") + 5,
								lineNumberEnd = response.error.indexOf( ";", response.error.indexOf("line=") + 5);
							
							if(lineNumberEnd == -1)
								lineNumberEnd = response.error.length;
							
							var lineNumber = response.error.substr(lineNumberStart, lineNumberEnd - lineNumberStart);
							that.lastUDFFileAdded.error = message + " : error at line " + lineNumber;
						} else{
							message = response.error;
							that.lastUDFFileAdded.error = message;
						}
					}

                    callback && callback(response.status, message);
                    console.log(response);
                },
                function(response){//FAILURE
                	that.lastUDFFileAdded.status = "failure";
                    callback && callback("failure", "Unknown error");
                }
            );
        },

        displayDropConfirm: function(filename, onConfirm){
            var html = '<div id="userUpdateConfirm" style="display:none">';
            html += '<div class="title-bar">';
            html += '<div class="img-icon-namespace icon-seed-node-dialog"></div>';
            html += '<div class="title-bar-header" title="Add Index">';
            html += 'Add Index';
            html += '</div>';
            html += '</div>';
            html += '<div class="update-popup-container">';
            html += '<div class="update-popup">';
            html += '<span class="popupValidValues popupList">';

            html += "<div class='user-popup-container'>";
            html += "Please confirm to Remove UDF file '" + filename + "' from cluster.";
            html += "</div>";

            html += '</span>';
            html += '</div>';
            html += '<div class="popup-error-display"></div>';
            html += '<span class="popupDialogButtons">';
            html += '<input id="userUpdateSubmit" class="blue_btn btn" value="Confirm" type="submit">';
            html += '<input id="userUpdateCancel" class="clear_btn btn" value="Cancel" type="submit">';
            html += '</span>';
            html += '</div>';
            html += '</div>';

            $("body").append(html);

            $('#userUpdateSubmit').on('click', function(event) {
                onConfirm();
                $("#userUpdateConfirm").remove();
            });

            $('#userUpdateCancel').off('click').on('click', function(event) {
                $("#userUpdateConfirm").remove();
            });

            $("#userUpdateConfirm").dialog({
                dialogClass: "no-dialog-title",
                modal: true,
                width: (innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                closeOnEscape: true,
                resizable: false
            });
        }
        
        
    });
    
    return UdfModel;
});
