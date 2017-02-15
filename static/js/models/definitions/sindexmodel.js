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

define(["underscore", "backbone", "poller", "views/definitions/sindexview", "helper/definitions/sindex-table", "config/app-config", "helper/util", "helper/AjaxManager", "helper/servicemanager"], function(_, Backbone, Poller, SIndexView, SIndexTable, AppConfig, Util, AjaxManager, ServiceManager){
    var SIndexModel = Backbone.Model.extend({
        initialize: function(options){
			this.CID = window.AMCGLOBALS.currentCID;
            this.version = options.version;
            this.initVariables();
            this.startEventListeners();          
        },
        initVariables: function(){
            var secondaryIndexDefListColumn = $.extend(true,[], AppConfig.secondaryIndexDefListColumn);
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
            this.views = {};
            this.indexListFull = {};
            this.pendingList = {
                _add : [],
                _delete : []
            };
            this.tableDiv = AppConfig.sindex.tableDiv;
			var tableWidth = ($(".table-container.box-container").width() - 70);
			
			var model = _.find( AppConfig.secondaryIndexDefListColumn, function(coloumn){
				return coloumn.name === "indexname";
			} );

            if( ServiceManager.isUserHasAccessToService("DROP_INDEX") ){
                model.formatter = function( cellvalue, options, rowObject ){
                    return "<span class='drop-index-btn hover-drop-btn icon-cancel-circle remove-node-icon' style='display: inline-block'></span><span>" + cellvalue + "</span>";
                };
            } else {
            	delete model.formatter;
            }

            var versionCheck = this.versionCompare(this.version);

            if(versionCheck > 0){
                secondaryIndexDefListColumn[1].name = "bin";
            }

            SIndexTable.initGrid($(this.tableDiv), AppConfig.secondaryIndexDefList, secondaryIndexDefListColumn, true, tableWidth ,this);
        },
        
        versionCompare : function(versionString){
            var version = Util.versionAfphaNumericCheck(versionString);
            return Util.versionCompare(version, AppConfig.version3point7);
        },
        replaceTempData : function(versionCheck, tempData){
            if(versionCheck > 0){
                tempData.bin = tempData.bins;
                delete tempData.bins;
            }
            return tempData;
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + '/namespaces/' + window.AMCGLOBALS.persistent.namespaceName + '/sindexes';
        }, 
        fetchSuccess: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
                
            model.initSIndexView(model);

            if(model.pendingList._add.length == 0 && model.pendingList._delete.length == 0){
                this.stop();
            }
		   
            if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
                this.clusterID = window.AMCGLOBALS.persistent.clusterID;
            }

			if(typeof model.attributes.error !== 'undefined' && model.attributes.error.indexOf("Invalid cluster id") != -1){
				delete model.attributes.error;
				Util.clusterIDReset();				
			}
        },

        startEventListeners : function (){
            var that = this;
            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            };

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
        },

        initSIndexView: function(model){
            var that = this;
            var modelData = model.attributes;
            var indexData = _.clone( modelData.indexes );

            indexData = model.modifyForPendingActions(model.pendingList, indexData);

            model.indexList = _.pluck(indexData, 'indexname');

            if(_.isEmpty(model.indexList)){
                model.views[0] = new SIndexView({tableDiv:model.tableDiv, indexName:0 ,model: model});
            }else{
                for(var i in model.indexList){
                    for(var j in indexData){
                        if(indexData[j].indexname === model.indexList[i]){
                            model.indexListFull[model.indexList[i]] = indexData[j];
                            break;
                        }
                    }
                }

                var deletedViews = _.difference( _.keys( model.indexListFull ), model.indexList );

                for(var index in deletedViews ){
                    model.views[deletedViews[index]].clean(deletedViews[index]);
                    delete model.views[deletedViews[index]];
                    delete model.indexListFull[deletedViews[index]];
                }

                for(var index in model.indexListFull){
                    if( model.views[index] == null ){
                        model.views[index] = new SIndexView({tableDiv:this.tableDiv,indexName:index ,model: model});
                    }

                    model.views[index].render(model, model.indexListFull[index], index || "_blank");

                }
            }

            model.initDropIndexListener(model.tableDiv);
            
        },

        fetchError: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.destroy();
			}
			
            var that = this;
            try{
                //DISPLAY ERROR
                model.displayNetworkErrorRow(model);
            }catch(e){
                console.info(e.toString());
            }
        },
        displayNetworkErrorRow: function(model){
            model.views[0] = new SIndexView({tableDiv:model.tableDiv, indexName:0 ,model: model});
        },

        addNewIndex : function(indexData, callback){
        	if(indexData.index_name === "_blank")
        		indexData.index_name = "";
        		
            console.log(indexData);
            var that = this;

            for (var key in indexData) {
                if (key !== "set_name" && indexData[key].trim() === "") {
                    callback && callback("error", "\'" + key.replace("_", " ") + "\' cannot be empty");
                    return;
                }

                if (indexData[key].trim().indexOf(" ") !== -1) {
                    callback && callback("error", "Spaces are not allowed in \'" + key.replace("_", " ") + "\'");
                    return;
                }
            }

            function addNewToPending(){
                that.pendingList._add.push(indexData.index_name);
                var poller = Util.initPoller( that, AppConfig.pollerOptions(AppConfig.updateInterval['def']));
                poller.start();
            }

            AjaxManager.sendRequest(AppConfig.baseUrl + AMCGLOBALS.persistent.clusterID + "/namespace/" + indexData.namespace + "/add_index", 
                {async: true, data: indexData, type:AjaxManager.POST},
                function(response){//SUCCESS

                	if(response.status === "success"){
                        setTimeout(function(){                      //Delay for changes to reflect
                            addNewToPending();
                        }, 1000);
                    }
                    
                    callback && callback(response.status, (response.status === "success" ? "Add Index Successful" : response.error));
                    console.log(response);
                },
                function(response){//FAILURE
                    callback && callback("failure", "Unknown error");
                }
            );
        },

        dropIndex: function(indexData, callback){
        	if(indexData.index_name === "_blank")
        		indexData.index_name = "";

            console.log(indexData);
            var that = this;

            function addRemoveToPending(){
                that.pendingList._delete.push(indexData.index_name);
                var poller = Util.initPoller( that, AppConfig.pollerOptions(AppConfig.updateInterval['def']));
                poller.start();
            }

            AjaxManager.sendRequest(AppConfig.baseUrl + AMCGLOBALS.persistent.clusterID + "/namespace/" + indexData.namespace + "/drop_index", 
                {async: true, data: {index_name : indexData.index_name}, type: AjaxManager.POST},
                function(response){//SUCCESS

                	setTimeout(function(){					//Delay for changes to reflect
                		addRemoveToPending();
                	}, 1000);
                    
                    callback && callback(response.status, (response.status === "success" ? "Drop Index Successful" : response.error));
                    console.log(response);
                },
                function(response){//FAILURE
                    callback && callback("failure", "Unknown error");
                }
            );
        },
        
        initDropIndexListener : function(tableDiv){
            //Move the function to views
            var that = this;
            $(tableDiv + " .drop-index-btn").off("click").on("click", function(event){
                var indexData = {namespace : AMCGLOBALS.persistent.namespaceName};
                indexData.index_name = $(this).parent().parent().attr("id");
                that.displayDropConfirm(indexData, function(){
                    that.dropIndex(indexData, function(status, message){
                        if(status !== "success"){
                            noty({text : message || "Failure", type : 'red', layout: "center", timeout: 8000});
                        }
                    });
                });
            });
        },

        displayDropConfirm: function(indexData, onConfirm){
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
            html += "Please confirm to Drop index '" + indexData.namespace + "." + indexData.index_name + "' from cluster.";
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
        },

        modifyForPendingActions : function(pendingList, indexData){

            var that = this;
            var added = _.pluck( 
                            _.filter( indexData, function(index){
                                return pendingList._add.indexOf( index.indexname ) != -1
                            }), 
                        'indexname' );

            var deleted = _.difference( pendingList._delete, _.pluck( indexData, 'indexname' ) );

            if(added.length > 0){
                noty({text : (added.toString() + " " + (added.length > 1 ? "indexes" : "index") + " added"), type : 'green', layout: "center", timeout: 5000});
            }

            if(deleted.length > 0){
                noty({text : (deleted.toString() + " " + (deleted.length > 1 ? "indexes" : "index") + " removed"), type : 'green', layout: "center", timeout: 5000});
            }

            pendingList._add = _.difference( pendingList._add, added );
            pendingList._delete = _.difference( pendingList._delete, deleted);

            if( pendingList._delete.length > 0){
                for( var index in pendingList._delete ){
                    var deletePending = _.find( indexData, function(staleIndex){
                        return staleIndex.indexname === pendingList._delete[index];
                    });

                    if(deletePending != null){
                        deletePending.action_pending = 'Drop Pending ';
                    }
                }
            }
            
            if( pendingList._add.length > 0){

                for( var index in pendingList._add ){
                    var tempData = {
                        "indexname": pendingList._add[index],
                        "bins": "N/E",
                        "set": "N/E",
                        "type": "N/E",
                        "sync_state": "N/E",
                        "action_pending": "Add Pending"
                    };

                    if(that.version){
                        var versionCheck = that.versionCompare(that.version);
                        tempData = that.replaceTempData(versionCheck, tempData);  
                    }
                    
                    indexData[tempData.indexname] = tempData;
                }
            }

            return indexData;
        }
    });
    
    return SIndexModel;
});
