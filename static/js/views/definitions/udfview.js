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
    
    var UdfView = Backbone.View.extend({
        initialize: function(){
            this.tableDiv = this.options.tableDiv;
            this.viewID = this.options.viewID;
            this.viewData = null;
            this.startEventHandlers();
        },
        render: function(model, newData, rowID){
            this.viewData = newData;
            this.viewData = this.formatRowData(this.viewData, rowID);
            SIndexTable.updateRowData(this.tableDiv,  this.viewData, rowID);
            
        },
        renderNetworkError: function(model, newData, rowID){
            this.viewData = newData;
            SIndexTable.updateRowData(this.tableDiv,  this.viewData, rowID);
        },
        formatRowData: function(data, rowID){
            if(data['synced']){
                data['synced'] = 'YES';
            }else{
               var synButtonID = 'udfSyncBtn_' + this.viewID;
               data['synced'] = '<div class="not-sync" id="'+synButtonID+'"><u>NO</u></div>'
               //ADD EVENT LISTENER 'NO'
//               $('#'+synButtonID).click(function(e){
//                $("#syncedDialog").dialog({
//                    dialogClass: 'sync-dialog'
//                });
//            });
            }
            
            return data;
        },
        startEventHandlers: function(){
            var synButtonID = 'udfSyncBtn_' + this.viewID;
            var that = this;
            $('#'+synButtonID).click(function(e){
                that.displaySyncedDetails(that.viewData);
                $("#syncedDialog").dialog({
                    width: 500,
                    closeOnEscape: true,
//                    resizable: false,
                    dialogClass: 'sync-dialog'
                });
           });

            if( ServiceManager.isUserHasAccessToService("REGISTER_UDF") ){
                $("#addNewUDF").off("click").on("click", function(event){
                    that.displayAddUDFForm();
                });
            }
        },
        displaySyncedDetails: function(viewData){
            var syncNodeHtml= '';
            $('#syncedDetailsContainer').empty();
            $('#syncedDetailsContainer').show();
            
            syncNodeHtml += this.getSyncNodeList('Missing on',viewData["absent_nodes"], 'red');
            syncNodeHtml += this.getSyncNodeList('Present on',viewData["present_nodes"], 'green');
            $('#syncedDetailsContainer').html(syncNodeHtml);
        },
        getSyncNodeList: function(storageName, nodeList, nodesColor){
            var node;
            var tempStr = '';
            tempStr += '<div>'+
                        '<div class="synced-subheader-container"><span class="synced-subheader">'+storageName+'</span></div>'+
                        '<ol class="synced-list">';
                        for(var nodeI in nodeList){
                            node = nodeList[nodeI];
                            tempStr +='<li class="synced-details-address ui-widget-content '+nodesColor+'">'+
                                '<span class="li-node-addr">'+node+'</span>'+
                            '</li> ';

                        }
            tempStr += '</ol></div>';
            return tempStr;
        },

        displayAddUDFForm: function(){
            var that = this;
            var html = '<div id="userUpdateConfirm" style="display:none">';
            html += '<div class="title-bar">';
            html += '<div class="img-icon-namespace icon-seed-node-dialog"></div>';
            html += '<div class="title-bar-header" title="Register New UDF">';
            html += 'Register New UDF';
            html += '</div>';
            html += '</div>';
            html += '<div class="update-popup-container">';
            html += '<div class="update-popup">';
            html += '<span class="popupValidValues popupList">';

            html += "<div class='user-popup-container'>";
            html += "<form class='user-form'>";
            html += "<div class='user-form user-form-content user-form-row-binder'>";
            html += "<label for='user-data-udf-name'>File Name</label>";
            html += "<input id='user-data-udf-name' name='file_contents'></input></div>";
            html += "<div class='user-form user-form-content user-form-row-binder'>";
            html += "<label for='user-data-udf-type'>UDF Type</label> <select name='udf_type' style='width: 158px; height: 28px; margin-left: -4px; border-radius: 3px;'>";
            html += "<option value='LUA'>Lua code</option>";
            html += "</select></div>";
            html += "<br/><br/>";
            html += "<div class='user-form user-form-content user-form-row-binder' style='text-align: center; width : 95%;'>";
            html += "<input id='user-data-udf-content' name='file_contents' type='file' value='Choose File'>";
            html += "<br/><br/>OR<br/><br/>";
            html += "<label for='user-data-udf-content'>Contents (LUA Code)</label> <br/>";
            html += "<textarea id='user-data-udf-editor' name='file_contents' rows='8' cols='80' style='width : 95%; resize:none;'></textarea></div>";
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

                function add(data){
                    
                    var existingUDFs = _.pluck( _.values(that.model.attributes.udfs), "filename" );

                    if( data.file_name == null || data.file_name === ""){
                        return "error : File Name not provided";
                    } else if( existingUDFs.indexOf(data.file_name) != -1 ){
                        return "error : UDF with same file name already exist"
                    } else if(data.file_name.match(/[a-z0-9_\.\-]*\.lua/i) == null){
                        return "error : Invalid File Name";
                    } else if ( data.udf_type == null || data.udf_type === "" ){    
                        return "error : UDF type not defined";
                    } else if( data.file_contents == null || data.file_contents === "" ){
                        return "error : UDF body (File or Contents) not provided";
                    }

                    that.model.addNewUDF(data, function(status, message){
                        if(status === "success"){
                            noty({text : message || "Success", type : 'green', layout: "center", timeout: 8000});
                        } else{
                            noty({text : message || "Failure", type : 'red', layout: "center", timeout: 8000});
                        }
                    });

                    $("#userUpdateConfirm").dialog( "destroy" ).remove();
                    return "success";
                };

                function showError(error){
                    $("#userUpdateConfirm .popup-error-display").hide(100,function(){
                        $("#userUpdateConfirm .popup-error-display").text(error).show(100);
                    });
                }

                var formdata = {};
                 
                formdata.udf_type = $("#userUpdateConfirm form.user-form select").val();
                //formdata.file_contents
                var file = $("#user-data-udf-content")[0].files[0];
                formdata.file_name = $("#user-data-udf-name").val().trim();

                if(file){
                    if(formdata.file_name === ""){
                        formdata.file_name = file.name;
                    }

                    var reader = new FileReader();

                    reader.onload = function(e){
                        formdata.file_contents = e.target.result;
                        
                        var result = add(formdata);
                        
                        if(result.indexOf("error") !== -1){
                            showError(result);
                        }
                    };

                    reader.readAsText(file);
                } else {
                    var editorVal = $("#user-data-udf-editor").val().trim();
                    formdata.file_contents = editorVal;

                    var result = add(formdata);

                    if(result.indexOf("error") !== -1){
                        showError(result);
                    }
                }
            });

            $("#user-data-udf-content").off("change").on("change", function(event){
                var providedName = $("#user-data-udf-name").val().trim();

                if(providedName === ""){
                    var file = $("#user-data-udf-content")[0].files[0];
                    if(file){
                        $("#user-data-udf-name").val(file.name);
                    }
                }
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

            $("#user-data-udf-content").on("keydown", function(e){
                if(e.keyCode === 9){
                    e.preventDefault();
                    var textarea = $(this);
                    textValue = JSON.stringify( textarea.val() );
                    textValue = textValue.substr(1, textValue.length - 2);
                    textValue = textValue + "\t";
                    textarea.val( textValue );
                }
            });

            $("#user-data-udf-editor").off("keydown").on("keydown", function(event){
                if(event.keyCode === 9){
                    event.preventDefault();
                    var node = $(this)[0];
                    var caretPos = that.getCaret(node);
                    node.value = node.value.substr(0, caretPos) + "    " + node.value.substr(caretPos);

                    that.setCaret(node, caretPos + 4);
                }
            });

            if(this.model.lastUDFFileAdded != null && this.model.lastUDFFileAdded.status === "failure"){   //AutoFill from last
                var form = $("#userUpdateConfirm");
                form.find("#user-data-udf-name").val(this.model.lastUDFFileAdded.file_name);
                form.find("#user-data-udf-type").val(this.model.lastUDFFileAdded.udf_type);
                form.find("#user-data-udf-editor").val(this.model.lastUDFFileAdded.file_contents).focus();

                if(this.model.lastUDFFileAdded.error != null)
                    form.find(".popup-error-display").text(this.model.lastUDFFileAdded.error).show();
            }
        },

        getCaret : function (ctrl) {
            var CaretPos = 0;   // IE Support
            if (document.selection) {
            ctrl.focus ();
                var Sel = document.selection.createRange ();
                Sel.moveStart ('character', -ctrl.value.length);
                CaretPos = Sel.text.length;
            }
            // Firefox support
            else if (ctrl.selectionStart || ctrl.selectionStart == '0')
                CaretPos = ctrl.selectionStart;
            return (CaretPos);
        },

        setCaret : function(ctrl, pos){
            if(ctrl.setSelectionRange)
            {
                ctrl.focus();
                ctrl.setSelectionRange(pos,pos);
            }
            else if (ctrl.createTextRange) {
                var range = ctrl.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        },

        clean : function(rowID){
            $(this.tableDiv).delRowData(rowID);
        },
        
    });
    
    return UdfView;
});




