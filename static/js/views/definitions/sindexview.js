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

define(["jquery", "underscore", "backbone", "helper/definitions/sindex-table", "helper/jqgrid-helper", "config/view-config", "config/app-config", "helper/servicemanager"], function($, _, Backbone, SIndexTable, GridHelper, ViewConfig, AppConfig, ServiceManager){
    
    var SIndexView = Backbone.View.extend({
        initialize: function(){
            this.tableDiv = this.options.tableDiv;
            this.indexName = this.options.indexName;
            this.initEventHandler();
        },
        initEventHandler: function(){
            var that = this;

            if( ServiceManager.isUserHasAccessToService("CREATE_INDEX") ){
                $("#addNewIndex").off("click").on("click", function(event){
                    that.displayAddIndexForm();
                });
            }
        },     
        render: function(model, newData, rowID){
            newData = this.formatRowData(newData, rowID);
            newData.indexname = ( newData.action_pending != null ? ( "[" + newData.action_pending + "] : " ) : "" ) + newData.indexname;
            SIndexTable.updateRowData(this.tableDiv,  newData, rowID, (newData.action_pending != null ? ["actionPending"] : null) );
        },
        renderNetworkError: function(model, newData, rowID){
            SIndexTable.updateRowData(this.tableDiv,  newData, rowID);
        },
        formatRowData: function(newData, rowID){
            if(newData['sync_state'] === 'synced'){
                newData['sync_state'] = 'YES';
            }else{
//               var synButtonID = 'sIndexTable_'+rowID;
//               newData['sync_state'] = '<div class="not-sync" id="'+synButtonID+'"><u>NO</u></div>'
                newData['sync_state'] = 'NO';
            }
            
            return newData;
        },

        displayAddIndexForm: function(){
            var that = this;
            var html = '<div id="userUpdateConfirm" style="display:none">';
            html += '<div class="title-bar">';
            html += '<div class="img-icon-namespace icon-seed-node-dialog"></div>';
            html += '<div class="title-bar-header" title="Add Index">';
            html += 'Add Index';
            html += '</div>';
            html += '</div>';
            html += '<div class="update-popup-container">';
            html += '<div class="update-popup">';
            html += '<span class="popupValidValues popupHeader">Add new Index under namespace \''+ (AMCGLOBALS.persistent.namespaceName) +'\'</span>';
            html += '<span class="popupValidValues popupList">';

            html += "<div class='user-popup-container'>";
            html += "<form class='user-form'>";
            html += "<div class='user-form user-form-content user-form-row-binder'>";
            html += "<label for='user-data-index'>Index Name </label> <input type='text' id='user-data-index' name='index_name' style='width: 175px;' placeholder='Index Name'>";
            html += "</div>";
            html += "<div class='user-form user-form-content user-form-row-binder'>";
            html += "<label for='user-data-bin'>Bin </label> <input type='text' id='user-data-bin' name='bin_name' placeholder='Bin Name' style='width: 175px;'></div>";
            html += "<div class='user-form user-form-content user-form-row-binder' style='text-align: left; display: inline-block; width: 284px;'>";
            html += "<label for='user-data-set'>Set Name </label> <input type='text' id='user-data-set' name='set_name' placeholder='Set Name (Optional)' style='width: 175px'></div>";
            html += "<div class='user-form user-form-content user-form-row-binder'>";
            html += "<label for='user-data-bin-type'>Bin Type</label> <select name='bin_type'>";
            html += "<option value='numeric'>Numeric</option> <option value='string'>String</option>";
            html += "</select></div>";
            html += "<br/>";
            html += "</form>";
            html += "</div>";

            html += '</span>';
            html += '</div>';
            html += '<div class="popup-error-display"></div>';
            html += '<span class="popupDialogButtons">';
            html += '<input id="userUpdateSubmit" class="blue_btn btn" value="Add" type="submit">';
            html += '<input id="userUpdateCancel" class="clear_btn btn" value="Cancel" type="submit">';
            html += '</span>';
            html += '</div>';
            html += '</div>';

            $("body").append(html);

            $('#userUpdateSubmit').on('click', function(event) {
                
                $("#userUpdateConfirm .popup-error-display").hide();

                var formdata = {};

                $("#userUpdateConfirm form.user-form input").each(function(index, element){
                    formdata[element.name] = element.value.trim();
                });

                var binType = $("#userUpdateConfirm form.user-form select");

                formdata[ binType.attr("name") ] = binType.val();
                formdata[ "namespace" ] = AMCGLOBALS.persistent.namespaceName;

                that.model.addNewIndex(formdata, function(status, message){
                    if(status === "error"){
                        $("#userUpdateConfirm .popup-error-display").text("Error : " + message).show();;
                    } else{

                        $("#userUpdateConfirm").dialog( "destroy" ).remove();
                        if(status !== "success"){
                            noty({text : message || "Failure", type : 'red', layout: "center", timeout: 5000});
                        }
                    }
                });
            });

            $('#userUpdateCancel').off('click').on('click', function(event) {
                $("#userUpdateConfirm").dialog( "destroy" ).remove();
            });

            $("#userUpdateConfirm").dialog({
                dialogClass: "no-dialog-title",
                modal: true,
                width: (innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                closeOnEscape: true,
                resizable: false
            });
        },

        clean : function(rowID){
            $(this.tableDiv).delRowData(rowID);
        },
    });
    
    return SIndexView;
});