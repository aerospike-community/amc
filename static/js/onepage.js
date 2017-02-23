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

define(["jquery", "underscore", "backbone", "helper/util", "config/app-config", "views/common/nodelistview","models/common/PopupModel","helper/AjaxManager","models/common/alertmodel","views/common/alertview","poller","helper/servicemanager","helper/authmanager","helper/notification","helper/sessionmanager","helper/usermanager","collections/common/MultiClusters", "helper/modal",
    // From the requirejs optimizer docs
    //  "The optimizer will only combine modules that are specified in arrays of
    //   string literals that are passed to top-level require and define calls,
    //   or the require('name') string literal calls in a simplified CommonJS
    //   wrapping. So, it will not find modules that are loaded via a variable
    //   name:"
    //      in util.js require(["models/" + page + "/clustermodel"], function(ClusterModel){
    //
    // For the optimizer to work, these clustermodel dependecies should be
    // required at the module level. But this causes circular dependency with
    // authmanager. Hence including these models here.
    'models/latency/clustermodel', 'models/jobs/clustermodel', 'models/configs/clustermodel',
    'models/definitions/clustermodel', 'models/dashboard/clustermodel', 'models/statistics/clustermodel'
 ], function($, _, Backbone, Util, AppConfig, NodeListView,PopupModel,AjaxManager,AlertModel,AlertView,Poller,ServiceManager,AuthManager,Notification,SessionManager,UserManager,MultiClusters, modal) {

    var onepage = function(){
        window.Util = Util;

        window.getGlobalVariableList = function(){
            var global = [];
            for(var key in window){
                global.push(key);
            }
            return global;
        };


        window.getNewGlobalVariableList = function(){
            var global = window.getGlobalVariableList();
            return _.difference(global, window.globalVars);
        };

        /****Setting up AMC GLOBAL Variables****/
        var that = window;
        window.AMCGLOBALS = window.AMCGLOBALS || {};
        window.AMCGLOBALS.activePage = null;
        window.AMCGLOBALS.activePageModel = null;
        window.AMCGLOBALS.currentCID = 0;
        window.AMCGLOBALS.clusterInitiated = false;

        window.AMCGLOBALS.persistent = {};
        window.AMCGLOBALS.persistent.nodeListView = new NodeListView({el:AppConfig.cluster.addressListOL});
        window.AMCGLOBALS.persistent.window_focus = true;

        //Warning : Never delete and reassign it to this property.... unless u know what u r doing :)
        window.AMCGLOBALS.APP_CONSTANTS = {};

        function refreshGlobals (){
            if(typeof window.AMCGLOBALS.persistent.models !== 'undefined') {
                if(typeof window.AMCGLOBALS.persistent.models.alertModel !== 'undefined') {
                    var poller = Poller.get(window.AMCGLOBALS.persistent.models.alertModel,
                            AppConfig.pollerOptions(AppConfig.updateInterval['alerts']));
                    poller.stop();
                    window.$.event.trigger("view:DestroyAlert");
                }

            }

            var nodeListView = window.AMCGLOBALS.persistent.nodeListView;
            var window_focus = window.AMCGLOBALS.persistent.window_focus;

            window.AMCGLOBALS.pageSpecific = {};
            window.AMCGLOBALS.pageSpecific.unSelectedNodes = [];

            window.AMCGLOBALS.persistent = {};
            window.AMCGLOBALS.persistent.nodeListView = nodeListView;
            window.AMCGLOBALS.persistent.window_focus = window_focus;
            window.AMCGLOBALS.persistent.selectedNodesStr = null;
            window.AMCGLOBALS.persistent.selectedNodes = [];
            window.AMCGLOBALS.persistent.nodesColorList = {};
            window.AMCGLOBALS.persistent.seedNode = null;
            window.AMCGLOBALS.persistent.models = {};
            window.AMCGLOBALS.persistent.xdrPort = 3004;
            window.AMCGLOBALS.persistent.snapshotTime = 60;

        }

        refreshGlobals();
        window.$(document).off("app:refreshGlobal").on("app:refreshGlobal", function(){
            refreshGlobals();
        });


        window.globalVars = window.getGlobalVariableList();
        /**********************************/


        $(document).ready(
            function(){
             Util.initAMC();
             Util.setGlobalEventListeners();
        });




        /****Setting up global services****/

        // remove loading message
        $('#appLoader').remove();
        Util.initAMC();
        Util.initGlobalEvents();

        if(Util.isMobile.any()){
            Util.setUpdateInterval(/*Default*/);
        }

        //Ajax global setting
        AjaxManager.initAjaxFailureCatch();


        //Get AMC version info
        that.displayAMCVersion = function(){
            AjaxManager.sendRequest(AppConfig.urls.GET_AMC_VERSION, {async: false} , function(response){
                Util.createConstant(window.AMCGLOBALS.APP_CONSTANTS,"AMC_TYPE",response.amc_type);

                if(response.amc_version !== 'Error reading AMC version'){
                    if(window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE === AppConfig.amc_type[0]){
                        $("#fullAmcVersionTxt").html('Aerospike Management Console - Community Edition - '+response.amc_version);
                        $("#partialAmcVersionTxt").html('AMC - Community Edition - '+response.amc_version);
                    } else {
                        $("#fullAmcVersionTxt").html('Aerospike Management Console - Enterprise Edition - '+response.amc_version);
                        $("#partialAmcVersionTxt").html('AMC - Enterprise Edition - '+response.amc_version);
                    }
                }
                if(window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE === AppConfig.amc_type[0]) {
                    $("#aerospikeHelp").attr("href", AppConfig.videoHelp.community);
                } else {
                    $("#aerospikeHelp").attr("href", AppConfig.videoHelp.enterprise);
                }

            },function(response){
                var amc_type = AppConfig.amc_type[0];
                try{
                    amc_type = response.amc_type;
                } catch(e){
                    console.log(e);
                }
                Util.createConstant(window.AMCGLOBALS.APP_CONSTANTS,"AMC_TYPE",amc_type);
                if(window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE === amc_type) {
                    $("#aerospikeHelp").attr("href", AppConfig.videoHelp.community);
                } else {
                    $("#aerospikeHelp").attr("href", AppConfig.videoHelp.enterprise);
                }
            });
        };

        that.displayAMCVersion();

        /**********************************/

        that.getClusterID = function(ip, port, callback, clusterName, multiclusterview, tls) {
            var that = this;

            if (!is_valid_port(port)) {
                return false;
            }
            var seedNode = ip + ":" + port;
            if (window.AMCGLOBALS.persistent.seedNode === seedNode){
                callback && callback("success");
                return;
            }
            var getClusterIdUrl = AppConfig.baseUrl + "get-cluster-id";
            var msgStr = "error";
            var clusterInfo = {seed_node : seedNode};

            if(clusterName != null && ( clusterName = clusterName.trim() ) != "")
                clusterInfo.cluster_name = clusterName;

            $("body").append(AppConfig.cursorStyler.cursorStylerHtmlStr);

            if(tls) {
              clusterInfo.tls_name = tls.tls_name;
              clusterInfo.cert_file = tls.cert_file;
              clusterInfo.key_file = tls.key_file;
              clusterInfo.encrypt_only = tls.encrypt_only;
            }

            /* RECHECK */
            var isExistingUserLogout = false;
            AjaxManager.sendRequest(getClusterIdUrl,{ async: false, type:'POST', data : clusterInfo },processSuccess, processError);

            function processSuccess(response){
                if (response.error === undefined) {

                    if(tls) {
                      AuthManager.setTLSProps(seedNode, tls.tls_name, tls.key_file, tls.cert_file, tls.encrypt_only);
                    } else {
                      AuthManager.removeTLSProps(seedNode);
                    }
                    SessionManager.putItemIntoSession(AppConfig.sessionKeys.isSecurityEnable,response.security_enabled);

                    var clusterName = ($("#cluster_name_dialog").val() || "").trim();//RECHECK
                    clusterName = clusterName !== "" ? clusterName : null;
                    msgStr = "success";

                    if(window.AMCGLOBALS.persistent.clusterID != null && response.cluster_id != null && window.AMCGLOBALS.persistent.clusterID !== response.cluster_id){
                        msgStr = "switch";
                        refreshGlobals();
                    }

                    if(response.security_enabled) {
                      if(Util.isCommunityEdition()) {
                        msgStr = 'error';
                        $("#error_message").text('Cannot access a secure cluster in Community Edition');
                        $(AppConfig.cursorStyler.cursorStylerDiv).remove();
                        callback && callback(msgStr);
                        return;
                      } else {
                        if(response.cluster_id == null){
                            AuthManager.showUserLoginPopup({"seedNode" : seedNode},function(response, forceRefresh){
                                clusterIdHandler(response, forceRefresh);
                            }, false, clusterName,multiclusterview);
                        } else {
                            AuthManager.getLoggedInUserInfo(response.cluster_id);
                            var loggedInUserName = SessionManager.getItemFromSession(AppConfig.sessionKeys.username);
                            AuthManager.loginSuccessHandlerForUser(response.cluster_id,loggedInUserName, multiclusterview);
                            if(multiclusterview !== true){
                                window.AMCGLOBALS.persistent.seedNode = response.seed_address;
                                window.AMCGLOBALS.persistent.nodeList = response.nodes;
                            }

                            var roleList = window.AMCGLOBALS.persistent.roleList;
                            if(roleList && roleList.length > 0) {
                              clusterIdHandler(response);
                            }
                        }
                      }
                    } else {
                        AuthManager._resetLogin_();
                        if(multiclusterview !== true){
                            ServiceManager.setNonSecureUserServices();
                            ServiceManager.showAccessibleModules();
                            window.AMCGLOBALS.persistent.seedNode = response.seed_address;
                            window.AMCGLOBALS.persistent.nodeList = response.nodes;
                        }
                        clusterIdHandler(response);
                    }
                }
                else {
                    msgStr = "error";
                    $("#error_message").text(response.error);
                    $(AppConfig.cursorStyler.cursorStylerDiv).remove();
                    callback && callback(msgStr, response.error);
                }

                return msgStr;
            }

            function processError(response){
                msgStr = "error";
                 if(response.status === 401) {
                     Util.showUserSessionInvalidateError(seedNode);
                 } else {
                     $("#error_message").text("Can't connect to server");
                     $(AppConfig.cursorStyler.cursorStylerDiv).remove();
                     callback && callback(msgStr);
                 }

            }

            function clusterIdHandler(clusterData, force){
                var cluster_id = null;

                if(clusterData != null){
                    cluster_id = clusterData.cluster_id;
                }

                msgStr = (cluster_id == null) ? "cancel" : "success";
                var hash = window.location.hash;

                if(cluster_id != null){

                    var hashSeed, end = -1, start = hash.indexOf("/");

                    if(start !== -1)
                        end = hash.indexOf("/", start + 1);

                    hashSeed = end !== -1 ? window.location.hash.substr(start + 1, end - start - 1) : "";

                    if(multiclusterview == true){
                        if(!$("#changeClusterButton").hasClass("active")){
                            $("#changeClusterButton").trigger("click");
                        }
                        //$("#multiple-cluster-list-container").trigger("panel:activate");
                        $(AppConfig.header.subHeader).slideUp(0);
                    } else {
                        if(hashSeed !== (window.AMCGLOBALS.persistent.seedNode || seedNode) ){
                            if(window.AMCGLOBALS.persistent.clusterID === cluster_id ||
                            ( _.contains(window.AMCGLOBALS.persistent.nodeList, hashSeed) &&
                            _.contains(window.AMCGLOBALS.persistent.nodeList, (window.AMCGLOBALS.persistent.seedNode || seedNode)))){
                                window.location.hash = window.location.hash.replace(hashSeed, (window.AMCGLOBALS.persistent.seedNode || seedNode) );
                                if($("#changeClusterButton").hasClass("active") && window.location.hash.indexOf("/") == -1){
                                    window.location.hash = "dashboard/" + (window.AMCGLOBALS.persistent.seedNode || seedNode);
                                }
                            } else {
                                window.location.hash = "dashboard/" + (window.AMCGLOBALS.persistent.seedNode || seedNode);
                            }
                        }
                    }

                    if(multiclusterview != true)
                        window.AMCGLOBALS.persistent.seedNode = (window.AMCGLOBALS.persistent.seedNode || seedNode);

                    window.AMCGLOBALS.persistent.buildDetails = clusterData.build_details;
                    Util.checkForCompatibility(clusterData.nodes_compatibility);
                }

                if(force || (cluster_id != null && window.AMCGLOBALS.persistent.clusterID !== cluster_id) ){
                    msgStr = "switch";
                    Util.cleanAlerts();
                    window.AMCGLOBALS.clusterInitiated = false;
                    window.AMCGLOBALS.persistent.clusterID = cluster_id;
                    that.initAlerts();
                    $(AppConfig.cursorStyler.cursorStylerDiv).remove();
                    Util.updateCurrentlyMonitoringCluster(window.AMCGLOBALS.persistent.currentlyMonitoringCluster, true);
                    Util.setGlobalClusterInfo();
                    $(AppConfig.header.sessionCloseBtn).off("click").on('click',function(){
                        if(AuthManager.executeLogoutRequest()){
                            window.location.hash = "";
                        }
                    });
                }

                if(hash === window.location.hash && force){
                    Backbone.history.loadUrl( Backbone.history.fragment );
                }

                callback && callback(msgStr);
            }

        };

       that.openClusterDialog = function(operation, connectCallback, cancelCallback) {
            var that = this;
            var nodeAddress = (typeof operation === "object" && operation.seedNode != null) ? operation.seedNode.split(":")[0] : "";
            var port = (typeof operation === "object" && operation.seedNode != null) ? operation.seedNode.split(":")[1] : "3000";
            var popupModel = new PopupModel({
                    'icon':'seed-node-dialog img-icon-seed-id',
                    'title':'Cluster Seed Node',
                    'header':'',
                    'modalClass':'',
                    'submitButtonValue': ( (typeof operation === "object" && operation.connectButtonValue != null) ? operation.connectButtonValue : 'Connect' ),
                    'cancelButtonValue': ( (typeof operation === "object" && operation.cancelButtonValue != null) ? operation.cancelButtonValue : 'Cancel' )
            });
            popupModel.set("content","<div class='dialog-message'>Enter the IP address and service port (default is 3000) for the node to connect to</div>" +
                                        "<input type='text' style='width: 135px;text-align:center;' placeholder='Host Name or IP' class='dialog_input' value='" + nodeAddress + "' id='ip_dialog'/>" +
                                        "<span>:</span>" +
                                        "<input id='port_dialog' class='dialog_input' type='number' style='width: 55px;' maxlength='5' placeholder='PORT' value='" + port + "'/>" +
                                        "<div><input type='text' style='width: 200px; text-align:center;' placeholder='Cluster Label (OPTIONAL)' class='dialog_input' value='' id='cluster_name_dialog'/></div>"+
                                        "<div id='multicluster_check_view' style='display: none'>" +
                                          "<label class='dialog_input'>" +
                                            "<input type='checkbox' style='width: auto; box-shadow: none;position: relative;vertical-align: middle;bottom: 1px;'" +
                                              "title='Multicluster View check' name='multiclusterview_check' id='multiclusterview_check'>" +
                                            "Multicluster View" +
                                          "</label>" +
                                        "</div>"+
                                        "<br/><div id='tls_container' " +
                                            " style='display: none; text-align: left; border-bottom: 1px solid #e5e5e5; height: 20px; padding-left: 148px'>" +
                                          "<div style='line-height: 8px; font-size: 8px' class='icon-seed-node-dialog icon-plus'> </div>" +
                                          "<div style='line-height: 8px; font-size: 8px; display: none' class='icon-seed-node-dialog icon-minus'> </div>" +
                                          "<div style='float: left'> TLS Connection Info</div>" +
                                        "</div>" +
                                        "<div style='display: none; clear: both;' id='tls_params'>" +
                                          "<div>" +
                                            "<input id='tls_name' class='dialog_input' type='text' style='width: 163px;' placeholder='TLS Host Name'/>" +
                                          "</div>" +
                                          "<div style='display: none'>" +
                                            "<input id='encrypt_only' class='dialog_input' type='checkbox' >" +
                                            "<span style='margin-right: -17px'> Encrypt Only (insecure)</span>" +
                                          "</div>" +
                                        "</div><br/>" +
                                        "<div id='error_message' class='dialog-message'></div>");

            popupModel.set('footer',"<div id='dialog_message_2' class='dialog-message'>(The other nodes in the cluster will be discovered automatically)</div>");

            var onEscape = true;
            if(typeof operation === 'undefined' || operation === "disableCancel" || (typeof operation === "object" && operation.cancelButton === "disable") ){
                onEscape = false;
                popupModel.set('showCancelButton',false);
            }


            var DOM = _.template($("#ModalTemplate").text())(popupModel.toJSON());

            function connect(){
                 var ipAddress = $("#ip_dialog").val().trim();
                 var portNumber = $("#port_dialog").val().trim();
                 var clusterName = $("#cluster_name_dialog").val().trim();
                 var multiclusterviewCheck = is_checked("multiclusterview_check");
                 var tls = null;
                 // var certFiles = document.getElementById('tls_certificate').files;
                 // var keyFiles = document.getElementById('tls_key').files;
                 var tls_name = $('#tls_name').val().trim();
                 var encrypt_only = $('#encrypt_only').is(':checked');

                 if (ipAddress.length === 0 && portNumber.length === 0) {
                   $("#error_message").text("Seed node and port number is mandatory");
                 } else if(encrypt_only || tls_name) {
                   // all values should be entered
                   if(!encrypt_only && !tls_name) {
                     $("#error_message").text("Invalid TLS values");
                     return;
                   }
                   tls = {};
                   tls.tls_name = tls_name;
                   tls.encrypt_only = encrypt_only;

                   sendRequest();
                 } else {
                   sendRequest();
                 }
                 return;

                 function sendRequest() {
                   getClusterID(ipAddress, portNumber, function(response){
                     if(response !== "error"){
                       Util.hideModalDialog();
                       connectCallback && connectCallback(response, multiclusterviewCheck);
                     }
                   }, clusterName, multiclusterviewCheck, tls);
                 }
            }



            function closePopup(){
                popupModel.destroy();
                $("#ModalWrapper").remove();
                cancelCallback && cancelCallback();
            }


            Util.showModalDialog(
                DOM,
                {dialogClass : "no-dialog-title", width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth), closeOnEscape : onEscape },
                ( (typeof operation === "object" && typeof operation.connect === "function") ? operation.connect : connect ),
                closePopup
            );

            Util.numbericInputValidation("#port_dialog", "#ModalSubmit");

            // disable TLS for now
            if(Util.isEnterpriseEdition()) {
              var shown = false;
              $('#multicluster_check_view').show();
              $('#tls_container').show();
              $('#tls_container').click(function() {
                $('#tls_params').toggle();
                shown = !shown;
                if(shown) {
                  $('#tls_container .icon-plus').hide();
                  $('#tls_container .icon-minus').show();
                } else {
                  $('#tls_container .icon-plus').show();
                  $('#tls_container .icon-minus').hide();
                  // reset tls params
                  $('#tls_name').val('')
                  $('#encrypt_only').attr('checked', false);
                }
              });
            }

            if(typeof operation === "object" && typeof operation.postDialog === "function"){
                operation.postDialog();
            }

        };

        var is_valid_port = function(port) {
            //var portRegex = /^\d{1,5}$/;
            if (typeof port === 'undefined' || !jQuery.trim(port) || port > 65535) {
                $("#error_message").text("Invalid Port number");
                return false;
            }
            return true;
        };

        var is_checked = function(id){
            var input = $("#" + id);
            if (input.is(":checked")) {
                return true;
            }
            return false;
        };

        that.openMulticlusterView = function(){
            //console.log("in openMulticlusterView");
            if (!window.AMCGLOBALS.pageSpecific.multiclusters) {
                window.AMCGLOBALS.pageSpecific.multiclusters = new MultiClusters({
                    poll: true
                });
            } else {
                window.AMCGLOBALS.pageSpecific.multiclusters.updatePoller({
                    poll: true
                });
            }

        }

        that.initAlerts = function(){
            if(Util.isEnterpriseEdition() && typeof window.AMCGLOBALS.persistent.models.alertModel === 'undefined'){
                window.AMCGLOBALS.persistent.models.alertModel = new AlertModel({"cluster_id" : window.AMCGLOBALS.persistent.clusterID});
                var alertView = new AlertView({el:AppConfig.alerts.container, model : window.AMCGLOBALS.persistent.models.alertModel});

                var roleList = window.AMCGLOBALS.persistent.roleList;
                if(roleList && roleList.length > 0) {
                  (Util.initPoller(window.AMCGLOBALS.persistent.models.alertModel, AppConfig.pollerOptions(AppConfig.updateInterval['alerts']))).start();
                }
            }

        }

        that.initAndValidateCluster = function(address,startClusterHandler){
            getClusterID(address[0], address[1], function(response){
                if (response !== "success" && response !== "switch") {
                    if (window.AMCGLOBALS.persistent.seedNode === null){
                        window.AMCGLOBALS.persistent.seedNode = address[0] + ":" + address[1];
                        openClusterDialog();
                    } else{
                        openClusterDialog("enableCancel");
                    }
                }  else{
                    startClusterHandler && startClusterHandler.apply();
                }

            });
        }

        that.addCluster = function(enableCancel, connectCallback, cancelCallback){
            var clusterID = window.AMCGLOBALS.persistent.clusterID;

            function defaultConnectCallback(response, enableCancel,multiclusterview){
                if(response === "cancel"){
                    if(window.AMCGLOBALS.persistent.seedNode != null)
                        !cancelCallback && Util.resumeAllActivePollers(true);

                    cancelCallback && cancelCallback(enableCancel, connectCallback, cancelCallback);
                } else {
                    if(multiclusterview !== true){
                        if($("#changeClusterButton").hasClass("active")){
                            $("#changeClusterButton").trigger("click");
                            $("#rightPanelButton").removeClass("active");
                        }

                        var activePage = "dashboard";

                        if(ServiceManager.isSecurityEnable()){
                            activePage = UserManager.getDefaultActivePageByRoles(window.AMCGLOBALS.persistent.roleList);
                        }

                        if(window.location.hash !== "" && window.location.hash !== "#" && window.location.hash.indexOf("addcluster") == -1){
                            if(window.location.hash.indexOf("/") == -1){
                                activePage = window.location.hash;
                            } else{
                                activePage = window.location.hash.substr(0, window.location.hash.indexOf("/"));
                            }
                        }

                        var hashSeed, end = -1, start = window.location.hash.indexOf("/");

                        if(start !== -1)
                            end = window.location.hash.indexOf("/", start + 1);

                        if(end !== -1){
                            hashSeed = window.location.hash.substr(start + 1, end - start - 1);
                        }

                        if(hashSeed != null && hashSeed !== window.AMCGLOBALS.persistent.seedNode){
                            window.location.hash = activePage + "/" + window.AMCGLOBALS.persistent.seedNode;
                        }

                        Util.resumeAllActivePollers(true);
                    } else {
                        if(!$("#changeClusterButton").hasClass("active")){
                            $("#changeClusterButton").trigger("click");
                        }
                        $("#multiple-cluster-list-container").trigger("panel:activate");
                        $(AppConfig.header.subHeader).slideUp(0);
                    }

                }

            }

            if(connectCallback == null || connectCallback === "default")
                connectCallback = defaultConnectCallback;

            $(".ui-dialog-content.ui-widget-content").dialog("destroy");

            Util.pauseAllActivePollers(false, true);
            openClusterDialog( (enableCancel === true ? "enableCancel" : "disableCancel" ), function(response ,multiclusterview){
                connectCallback.call(this, response, enableCancel, multiclusterview);
            }, function(){
                !cancelCallback && Util.resumeAllActivePollers(true);
                cancelCallback && cancelCallback(enableCancel, connectCallback, cancelCallback);
            });
        }

        that.newClusterConnect = function(){
            $(".ui-dialog-content.ui-widget-content").dialog("destroy");
            window.$("#headerButtons .button.active").trigger("click");

            Util.showCurrentlyMonitoringCluster(false, true, function(clusterExist){
                if(!clusterExist){
                    addCluster(false, "default", addCluster);
                } else {
                    //window.$.event.trigger("view:multiclusterDestroy","Stop multicluster polling");
                    setTimeout(function(){
                        if(!$("#changeClusterButton").hasClass("active")){
                            $("#changeClusterButton").trigger("click");
                        }
                        $(AppConfig.header.subHeader).slideUp(0);
                    }, 250);

                    //$("#multiple-cluster-list-container").trigger("panel:activate");
                    // openMulticlusterView();
                    /*$("#addAnotherClusterBtn").parent()
                        .off("mousedown")
                        .on("mousedown", function(event){
                            event.preventDefault();
                            $("#addAnotherClusterBtn").parent().off("mousedown");
                            addCluster(true, "default", newClusterConnect);
                        });

                    $(".cluster-list-modal .cluster_link").on("click", function(){
                        $(".cluster-list-modal .cluster_link").off("click");
                        $("#addAnotherClusterBtn").parent().off("mousedown");
                        $(AppConfig.header.multipleClusterListContainer).dialog("destroy");
                    });*/
                }
            });
        }

        // hide user menu on off click
        $('html').click(function(event) {
            var otarget = $(event.target);
            if (!otarget.parents('#userMenuContainer').length && otarget.attr('id')!="userMenuContainer" && !otarget.parents('#UserDropdownButton').length) {
                $('#userMenuContainer').hide();
            }
        });

        that.removeMulticlusterView = function(){
            if($("#changeClusterButton").hasClass("active")){
                $("#changeClusterButton").trigger("click");
                $("#rightPanelButton").removeClass("active");
            }
        };

        that.logoutUser = function() {
            $("#userMenuContainer").css("display", "none");
            AuthManager.logoutUser();
        };

        that.terminateSession = function() {
            $("#userMenuContainer").css("display", "none");
            AuthManager.terminateSession();
        };

        that.renameCluster = function() {
            $("#userMenuContainer").css("display", "none");
            Util.remove_cluster();
        };

        /************* Routing Table *************/



        var AppRouter = Backbone.Router.extend({
            routes: {
                //dashboard
                "": "newCluster",

                "addcluster" : "addnewcluster",

                "dashboard/:ip/:time/": "oldDashboardCluster",
                "dashboard/:ip/:time/:nodelist": "oldDashboardCluster",
                "dashboard/:ip/:time": "oldDashboardCluster",
                "dashboard/:ip": "oldDashboardCluster",
                "dashboard/": "newCluster",
                "dashboard": "newCluster",

                //Statistics
                "statistics/:ip/sindex": "restoreStatisticsClusterSIndex",
                "statistics/:ip/nodelist/:nodelistStr/sindex": "restoreStatisticsClusterSIndex",
                "statistics/:ip/nodelist/:nodelistStr/sindex/:nspname": "restoreStatisticsClusterSIndex",
                "statistics/:ip/nodelist/:nodelistStr/sindex/:nspname/:indexname": "restoreStatisticsClusterSIndex",

                "statistics/:ip/namespace": "restoreStatisticsClusterNamespace",
                "statistics/:ip/nodelist/:nodelistStr/namespace": "restoreStatisticsClusterNamespace",
                "statistics/:ip/nodelist/:nodelistStr/namespace/:nspname": "restoreStatisticsClusterNamespace",


                "statistics/:ip/xdr": "restoreStatisticsClusterXDR",
                "statistics/:ip/nodelist/:nodelistStr/xdr": "restoreStatisticsClusterXDR",
                "statistics/:ip/nodelist/:nodelistStr/xdr/:xdrport": "restoreStatisticsClusterXDR",


                "statistics/:ip/nodes": "restoreStatisticsClusterNode",
                "statistics/:ip/nodelist/:nodelistStr/nodes": "restoreStatisticsClusterNode",

                "statistics/:ip": "restoreStatisticsClusterNode",
                "statistics/:ip/nodelist/:nodelistStr": "restoreStatisticsClusterNode",

                "statistics/": "newCluster",
                "statistics": "newCluster",

                //definitions

                "definitions/:ip/nodelist/:nodelistStr/udf": "restoreDefinitionsClusterUdf",

                "definitions/:ip/nodelist/:nodelistStr/namespace": "restoreDefinitionsClusterNamespace",
                "definitions/:ip/nodelist/:nodelistStr/namespace/:nspname": "restoreDefinitionsClusterNamespace",

                "definitions/:ip": "restoreDefinitionsClusterNamespace",

                "definitions/:ip/nodelist/:nodelistStr": "restoreDefinitionsClusterNamespace",

                "definitions/": "newCluster",
                "definitions": "newCluster",

                //Jobs

                "jobs/:ip/nodelist/:nodelistStr": "restoreJobsCluster",
                "jobs/:ip": "restoreJobsCluster",

                "jobs/": "newCluster",
                "jobs" : "newCluster",

                //Latency

                "latency/:ip": "restoreLatencyCluster",
                "latency/:ip/nodelist/:nodelistStr": "restoreLatencyCluster",

                "latency": "newCluster",
                "latency/": "newCluster",

                //Admin-console

                "admin-console/:ip/sindex": "restoreAdminConsoleClusterSIndex",
                "admin-console/:ip/nodelist/:nodelistStr/sindex": "restoreAdminConsoleClusterSIndex",
                "admin-console/:ip/nodelist/:nodelistStr/sindex/:nspname": "restoreAdminConsoleClusterSIndex",
                "admin-console/:ip/nodelist/:nodelistStr/sindex/:nspname/:indexname": "restoreAdminConsoleClusterSIndex",

                "admin-console/:ip/namespace": "restoreAdminConsoleClusterNamespace",
                "admin-console/:ip/nodelist/:nodelistStr/namespace": "restoreAdminConsoleClusterNamespace",
                "admin-console/:ip/nodelist/:nodelistStr/namespace/:nspname": "restoreAdminConsoleClusterNamespace",


                "admin-console/:ip/xdr": "restoreAdminConsoleClusterXDR",
                "admin-console/:ip/nodelist/:nodelistStr/xdr": "restoreAdminConsoleClusterXDR",
                "admin-console/:ip/nodelist/:nodelistStr/xdr/:xdrport": "restoreAdminConsoleClusterXDR",


                "admin-console/:ip/nodes": "restoreAdminConsoleClusterNode",
                "admin-console/:ip/nodelist/:nodelistStr/nodes": "restoreAdminConsoleClusterNode",

                "admin-console/:ip": "restoreAdminConsoleCluster",
                "admin-console/:ip/nodelist/:nodelistStr": "restoreAdminConsoleClusterNode",

                "admin-console/": "newCluster",
                "admin-console": "newCluster"
            }
        });


        window.AMCGLOBALS.app_router = new AppRouter;

        /** Dashboard **/

        window.AMCGLOBALS.app_router.on('route:oldDashboardCluster', function(address, time, nodelist) {
          //  if (address === window.AMCGLOBALS.persistent.seedNode && window.AMCGLOBALS.activePage === "dashboard")
          //      return;
            if(window.AMCGLOBALS.activePage !== "dashboard"){
                window.AMCGLOBALS.clusterInitiated = false;
                window.AMCGLOBALS.activePage = "dashboard";
            }
            var addressArg = Util.setSeedNodeDialogValues(address);
            getClusterID(addressArg[0], addressArg[1], function(response, errorMsg){
                if (response === "success" || response === "switch") {

                    if(window.AMCGLOBALS.persistent.seedNode !== address)
                        window.AMCGLOBALS.persistent.seedNode = address;
                    if (typeof nodelist !== 'undefined') {
                        window.AMCGLOBALS.persistent.selectedNodesStr = nodelist;
                    }
                    if (typeof time !== 'undefined' && time !== 'nodelist' && time !== 'undefined') {
                        window.AMCGLOBALS.persistent.snapshotTime = time;
                    } else if(typeof window.AMCGLOBALS.persistent.snapshotTime === 'undefined' || window.AMCGLOBALS.persistent.snapshotTime == null){
                        window.AMCGLOBALS.persistent.snapshotTime = 30;
                    }

                    if(typeof time === "undefined" || (typeof nodelist === 'undefined' && window.AMCGLOBALS.persistent.selectedNodesStr != null)){
                        window.location.hash = "dashboard/" + window.AMCGLOBALS.persistent.seedNode + "/" + window.AMCGLOBALS.persistent.snapshotTime
                                            + (window.AMCGLOBALS.persistent.selectedNodesStr != null? ("/" + window.AMCGLOBALS.persistent.selectedNodesStr) : "");
                    }
                    Util.startCluster("dashboard",function(){
                        Util.updateTabLinks(address);
                    });
                    removeMulticlusterView();

                    $(AppConfig.throughput.historySelect).find("option[value='" + window.AMCGLOBALS.persistent.snapshotTime + "']").prop('selected', true);
                    $(AppConfig.throughput.historySelect).change();
                } else {
                    errorMsg = errorMsg || 'Login Error';
                    modal.messageModal('Login Error', errorMsg, function() {
                      var url = window.location.protocol + "//" + window.location.host;
                      window.location = url;
                    });
                    /*if (window.AMCGLOBALS.persistent.seedNode === null){
                        openClusterDialog("disableCancel",function(){
                            var activePage = "dashboard";

                            if(window.location.hash !== "" && window.location.hash !== "#"){
                                if(window.location.hash.indexOf("/") == -1){
                                    activePage = window.location.hash;
                                } else{
                                    activePage = window.location.hash.substr(0, window.location.hash.indexOf("/"));
                                }
                            }

                            var seedNode = window.AMCGLOBALS.persistent.seedNode || address;
                            refreshGlobals();
                            window.AMCGLOBALS.clusterInitiated = false;
                            window.location.hash = activePage + "/" + seedNode;
                            if(window.AMCGLOBALS.persistent.seedNode == null)
                                window.location.reload();
                        });
                    } else{
                        openClusterDialog("enableCancel");
                    }*/
                }

            });
        });

        window.AMCGLOBALS.app_router.on('route:newCluster', function() {
            if(window.location.hash.indexOf("#/") == 0){
                window.location.hash = "dashboard" + window.location.hash.substr(1);
            } else{
                newClusterConnect();
            }
        });

        window.AMCGLOBALS.app_router.on('route:addnewcluster', function() {
            addCluster();
        });

        /** Statistics **/
        window.AMCGLOBALS.app_router.on('route:initstatisticsCluster', function(address, nodelist) {
            window.AMCGLOBALS.persistent.showAttributesFor = 'nodes';
            openClusterDialog();
        });


        window.AMCGLOBALS.app_router.on('route:restoreStatisticsClusterNode', function(address, nodelist) {
            // Util.updateTabLinks(address);
            window.AMCGLOBALS.persistent.showAttributesFor = 'nodes';

            var addressArr = Util.setSeedNodeDialogValues(address);

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("statistics", function(){
                    Util.updateTabLinks(address);
                    Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreStatisticsClusterNamespace', function(address, nodelist, namespaceName) {
            // Util.updateTabLinks(address);
            window.AMCGLOBALS.persistent.showAttributesFor = 'namespace';
            var addressArr = Util.setSeedNodeDialogValues(address);

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            window.AMCGLOBALS.persistent.namespaceName = Util.setIfDefined(namespaceName, window.AMCGLOBALS.persistent.namespaceName);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("statistics", function(){
                    Util.updateTabLinks(address);
                    Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreStatisticsClusterSIndex', function(address, nodelist, namespaceName, indexName) {
            // Util.updateTabLinks(address);
            window.AMCGLOBALS.persistent.showAttributesFor = 'sindex';
            var addressArr = Util.setSeedNodeDialogValues(address);

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            window.AMCGLOBALS.persistent.namespaceName = Util.setIfDefined(namespaceName, window.AMCGLOBALS.persistent.namespaceName);
            window.AMCGLOBALS.persistent.indexName = Util.setIfDefined(indexName, window.AMCGLOBALS.persistent.indexName);
            initAndValidateCluster(addressArr,function(){

                Util.startCluster("statistics", function(){
                    Util.updateTabLinks(address);
                    Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreStatisticsClusterXDR', function(address, nodelist, xdrPort) {
            // Util.updateTabLinks(address);
            window.AMCGLOBALS.persistent.showAttributesFor = 'xdr';
            var addressArr = Util.setSeedNodeDialogValues(address);

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            window.AMCGLOBALS.persistent.xdrPort = Util.setAndValidateXdrPort(xdrPort, window.AMCGLOBALS.persistent.xdrPort);

            initAndValidateCluster(addressArr,function(){
                Util.startCluster("statistics", function(){
                    Util.updateTabLinks(address);
                    Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreDefinitionsClusterNamespace', function(address, nodeList, namespaceName) {
            // Util.updateTabLinks(address);
            window.AMCGLOBALS.persistent.showAttributesFor = 'namespace';

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodeList, window.AMCGLOBALS.persistent.selectedNodesStr);
            window.AMCGLOBALS.persistent.namespaceName = Util.setIfDefined(namespaceName, window.AMCGLOBALS.persistent.namespaceName );
            var addressArr = Util.setSeedNodeDialogValues(address);

            initAndValidateCluster(addressArr, function(){
                Util.startCluster("definitions",function(){
                    Util.updateTabLinks(address);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreDefinitionsClusterUdf', function(address, nodeList) {
            // Util.updateTabLinks(address);
            window.AMCGLOBALS.persistent.showAttributesFor = 'udf';

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodeList, window.AMCGLOBALS.persistent.selectedNodesStr);
            addressArr = Util.setSeedNodeDialogValues(address);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("definitions", function(){
                    Util.updateTabLinks(address);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreJobsCluster', function(address, nodelist) {
            // Util.updateTabLinks(address);
            var addressArr = Util.setSeedNodeDialogValues(address);

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("jobs", function(){
                    Util.updateTabLinks(address);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreLatencyCluster', function(address, nodelist) {
            // Util.updateTabLinks(address);
            var addressArr = Util.setSeedNodeDialogValues(address);

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("latency", function(){
                    Util.updateTabLinks(address);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreAdminConsoleCluster', function(address, nodelist) {
            // Util.updateTabLinks(address);
            var addressArr = Util.setSeedNodeDialogValues(address);

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("admin-console", function(){
                    Util.updateTabLinks(address);
                    if(typeof window.AMCGLOBALS.persistent.showAttributesFor === "undefined"){
                        window.AMCGLOBALS.persistent.showAttributesFor = "nodes";
                    }
                    Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreAdminConsoleClusterNode', function(address, nodelist) {
            // Util.updateTabLinks(address);

            window.AMCGLOBALS.persistent.showAttributesFor = 'nodes';

            var addressArr = Util.setSeedNodeDialogValues(address);
            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("admin-console", function(){
                        Util.updateTabLinks(address);
                        Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreAdminConsoleClusterNamespace', function(address, nodelist, namespaceName) {
            // Util.updateTabLinks(address);

            window.AMCGLOBALS.persistent.showAttributesFor = 'namespace';
            var addressArr = Util.setSeedNodeDialogValues(address);
            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            window.AMCGLOBALS.persistent.namespaceName = Util.setIfDefined(namespaceName, window.AMCGLOBALS.persistent.namespaceName);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("admin-console", function(){
                    Util.updateTabLinks(address);
                    Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreAdminConsoleClusterSIndex', function(address, nodelist, namespaceName, indexName) {
            // Util.updateTabLinks(address);

            window.AMCGLOBALS.persistent.showAttributesFor = 'sindex';
            var addressArr = Util.setSeedNodeDialogValues(address);

            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            window.AMCGLOBALS.persistent.namespaceName = Util.setIfDefined(namespaceName, window.AMCGLOBALS.persistent.namespaceName);
            window.AMCGLOBALS.persistent.indexName = Util.setIfDefined(indexName, window.AMCGLOBALS.persistent.indexName);
            initAndValidateCluster(addressArr,function(){
                Util.startCluster("admin-console", function(){
                        Util.updateTabLinks(address);
                        Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:restoreAdminConsoleClusterXDR', function(address, nodelist, xdrPort) {
            // Util.updateTabLinks(address);

            window.AMCGLOBALS.persistent.showAttributesFor = 'xdr';
            var addressArr = Util.setSeedNodeDialogValues(address);
            window.AMCGLOBALS.persistent.selectedNodesStr = Util.setIfDefined(nodelist, window.AMCGLOBALS.persistent.selectedNodesStr);
            window.AMCGLOBALS.persistent.xdrPort = Util.setAndValidateXdrPort(xdrPort, window.AMCGLOBALS.persistent.xdrPort);

            initAndValidateCluster(addressArr,function(){
                Util.startCluster("admin-console", function(){
                        Util.updateTabLinks(address);
                        Util.checkRadioButton(window.AMCGLOBALS.persistent.showAttributesFor);
                });
            });
            removeMulticlusterView();
        });

        window.AMCGLOBALS.app_router.on('route:404', function(){
            console.log("404!! not found");
            $("#mainContainer").html("<div class='header404'>Error : 404!!</div><div class='body404'>Page Not Found</div>");
        });

        if (!Backbone.history.start()){
            if(window.location.hash.indexOf("#/") == 0){
                window.location.hash = "dashboard" + window.location.hash.substr(1);
            } else{
                window.AMCGLOBALS.app_router.trigger('route:404');
            }
        }
    };

    return onepage;
});
