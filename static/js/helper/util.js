
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

define(["jquery", "backbone", "poller", "config/app-config", "underscore", "helper/AjaxManager", "helper/servicemanager",
    "helper/usermanager","helper/notification" , "helper/overlay", "models/common/AlertEmailsModel", "views/common/AlertEmailsView", "helper/modal"],
    function($, Backbone, Poller, AppConfig, _,AjaxManager,ServiceManager,UserManager,Notification, Overlay, AlertEmailsModel, AlertEmailsView, modal){

    var Util = {
        initAMC: function(){
            Util.EnableCrossBrowserConsole();
            Util.setFavicon();
            Util.setCustomScrollBar();

            Util.logger.get_status();
            Util.logger.setDefaultValueToDuration();
            $("#rightPanelButton").on("click", function(){
                if($(this).hasClass("active") && !$("#wrap").hasClass('fullScreen')){
                    Util.logger.get_status();
                }

                if($(".log-start").css('display') == "inline-block"){
                    Util.logger.print_label_message("OFF", Util.logger.CLASS_ERROR);
                    Util.logger.setDefaultValueToDuration();
                }
            });

        },

        isCommunityEdition: function() {
          var edition = window.AMCGLOBALS.APP_CONSTANTS.AMC_TYPE
          if(!edition || edition === AppConfig.amc_type[0]) {
            return true;
          } else {
            return false;
          }
        },

        isEnterpriseEdition: function() {
          return !this.isCommunityEdition();
        },

        setEnviromentSetupUI : function(){
            Util.removeEnviromentSetupUI();

            $("#wrap").scrollTop(0);

            $("<div id='envSetupContainer'><div id='envSetup'><div id='envSetupMsg'>Setting up Environment. Please Wait!!</div><div id='envSetupSpinner'></div></div></div>").dialog({
                modal: true,
                resizable: false,
                dialogClass : "env-setup-modal",
                width: "80%",
                minWidth : 320,
                closeOnEscape : false
            });

            window.AMCGLOBALS.pageSpecific.spinner = new Overlay("envSetupSpinner");

            // set up for community edition
            if(Util.isCommunityEdition()) {
              $('#AlertEmailsSelector').hide();
            }
        },

        removeEnviromentSetupUI : function(){
            if(window.AMCGLOBALS.pageSpecific.spinner != null){
                window.AMCGLOBALS.pageSpecific.spinner.stopOverlay();
                delete window.AMCGLOBALS.pageSpecific.spinner;
            }

            var container = $("#envSetupContainer");

            if(container.hasClass("ui-dialog-content"))
                container.dialog("destroy");

            container.remove();
        },

        updateVisibilityBtnSize: function(sd){
            if(window.innerWidth > 1000){
                $('#nodeListTable .visibility-button-container').css({'width' : '50px'});
                $('#nodeListTable .visibility-button-slider').css({'width': '25px'});
                $('#nodeListTable .text-status-visibility').css({'font-size': '12px'});
            }else{
                $('#nodeListTable .visibility-button-container').css({'width' : '38px'});
                $('#nodeListTable .visibility-button-slider').css({'width': '15px'});
                $('#nodeListTable .text-status-visibility').css({'font-size': '11px'});
            }
        },
        setFavicon: function(){
            window.onhashchange = function(){
                var link = $('link[type="image/png"]').remove().attr("href");
                $('<link href="'+ link +'" rel="shortcut icon" type="image/png" />').appendTo('head');
            }
        },
        EnableCrossBrowserConsole: function(){
          if ( ! window.console ) console = {
                log: function(){},
                error: function(){},
                info: function(){},
                clear: function(){}
          };
        },
        setCustomScrollBar: function(){
            $('#alertNotifyList').slimScroll({
                height: '270px',
                wheelStep : 3
            });
        },
        bytesToSize: function(bytes, precision) {
            var KB = 1024;
            var MB = KB * 1024;   // 1024 * 1024
            var GB = MB * 1024;   // 1024 * 1024 * 1024
            var TB = GB * 1024;   // 1024 * 1024 * 1024 * 1024
            var humanReadableBytes;

            if ((bytes < KB)) {
                    humanReadableBytes = bytes + ' B';
            } else if ((bytes >= KB) && (bytes < MB)) {
                    humanReadableBytes = (bytes / KB).toFixed(precision) + ' KB';
            } else if ((bytes >= MB) && (bytes < GB)) {
                    humanReadableBytes = (bytes / MB).toFixed(precision) + ' MB';
            } else if ((bytes >= GB) && (bytes < TB)) {
                    humanReadableBytes = (bytes / GB).toFixed(precision) + ' GB';
            } else if (bytes >= TB) {
                    humanReadableBytes = (bytes / TB).toFixed(precision) + ' TB';
            }
            if(typeof humanReadableBytes === 'undefined'){
                humanReadableBytes = '0 B';
            }
            return humanReadableBytes ;
        },
        getAlertDateTime: function(now){
            if(!now){
                now = new Date();
            }
            var date = now.getDate();
            var month = now.getMonth()+1;
            var year = (now.getFullYear()+'').substr(2,3);
            var hours = now.getHours();
            var minutes = now.getMinutes();
            var seconds = now.getSeconds();

            var monthMM = ((month < 10)? "0" : "" ) + month;
            var dd = ((date < 10)? "0" : "" ) + date;
            var yy = ((year < 10)? "0" : "" ) + year;

            var hh = ((hours < 10)? "0" : "" ) + hours;
            var mm = ((minutes < 10)? "0" : "" ) + minutes;
            var ss = ((seconds < 10)? "0" : "" ) + seconds;

            var timeStr = monthMM+'/'+dd+'/'+yy+' '+hh+':'+mm+':'+ss;
            return timeStr;
        },
        getFormattedDate: function(now){
            if(!now){
                now = new Date();
            }
            var date = now.getDate();
            var month = now.getMonth()+1;
            var year = (now.getFullYear()+'').substr(2,3);

            var mm = ((month < 10)? "0" : "" ) + month;
            var dd = ((date < 10)? "0" : "" ) + date;
            var yy = ((year < 10)? "0" : "" ) + year;

            var timeStr = mm+'/'+dd+'/'+yy;
            return timeStr;
        },
        getFormattedTime: function(now){
            if(!now){
                now = new Date();
            }
            var hours = now.getHours();
            var minutes = now.getMinutes();
            var seconds = now.getSeconds();

            var hh = ((hours < 10)? "0" : "" ) + hours;
            var mm = ((minutes < 10)? "0" : "" ) + minutes;
            var ss = ((seconds < 10)? "0" : "" ) + seconds;

            var timeStr = hh+':'+mm+':'+ss;
            return timeStr;
        },
        formatKMBT: function(y) {
            var abs_y = Math.abs(y);
            if (abs_y >= 1000000000000)   { return (y / 1000000000000).toFixed(2) + "T"; }
            else if (abs_y >= 1000000000) { return (y / 1000000000).toFixed(2) + "B"; }
            else if (abs_y >= 1000000)    { return (y / 1000000).toFixed(2) + "M"; }
            else if (abs_y >= 1000)       { return (y / 1000).toFixed(2) + "K" ;}
            else if (abs_y < 1 && y > 0)  { return y.toFixed(2); }
            else if (abs_y === 0)          { return ''; }
            else                      { return y ;}
        },
        msecToTime: function(duration) {
            if(_.isUndefined(duration) ||  _.isNaN(duration)){
                return 'N/A';
            } else {
                var milliseconds = /*parseInt((duration % 1000) / 100)*/ (duration % 1000),
                    seconds = parseInt((duration / 1000) % 60),
                    minutes = parseInt((duration / (1000 * 60)) % 60),
                    hours = parseInt((duration / (1000 * 60 * 60)) % 24);

                hours = (hours < 10) ? "0" + hours : hours;
                minutes = (minutes < 10) ? "0" + minutes : minutes;
                seconds = (seconds < 10) ? "0" + seconds : seconds;

                return hours + ":" + minutes + ":" + seconds + "." + milliseconds;
            }
        },
        secToTime: function(duration) {
            if(_.isUndefined(duration) ||  _.isNaN(duration)){
                return 'N/A';
            }else{
                    var seconds = parseInt((duration)%60)
                    , minutes = parseInt((duration/(60))%60)
                    , hours = parseInt((duration/(60*60))%24);

                hours = (hours < 10) ? "0" + hours : hours;
                minutes = (minutes < 10) ? "0" + minutes : minutes;
                seconds = (seconds < 10) ? "0" + seconds : seconds;

                return hours + ":" + minutes + ":" + seconds;
            }
        },
        secToTimeWithDays: function(duration) {
            if(_.isUndefined(duration) ||  _.isNaN(duration)){
                return 'N/A';
            }else{
                    var seconds = parseInt((duration)%60)
                    , minutes = parseInt((duration/(60))%60)
                    , hours = parseInt((duration/(60*60))%24)
                    , days = Math.floor((duration/(60*60))/24);

                hours = (hours < 10) ? "0" + hours : hours;
                minutes = (minutes < 10) ? "0" + minutes : minutes;
                seconds = (seconds < 10) ? "0" + seconds : seconds;

                if(days > 0){
                    return days + " day(s) " + hours + ":" + minutes + ":" + seconds;
                }
                return hours + ":" + minutes + ":" + seconds;
            }
        },
        secToString: function(duration) {
            var secString = 'N/A';
            var totalSeconds = '0';
            if(!(_.isUndefined(duration) ||  _.isNaN(duration))){
                var seconds = parseInt((duration)%60)
                    , minutes = parseInt((duration/(60))%60)
                    , hours = parseInt((duration/(60*60))%24);

                hours = (hours < 10) ? "0" + hours : hours;
                minutes = (minutes < 10) ? "0" + minutes : minutes;
                seconds = (seconds < 10) ? "0" + seconds : seconds;


                if(hours !== '00'){
                    if(hours === '01'){
                        secString = '1 Hour';
                    }else{
                        secString = +hours + ' Hours';
                    }
                    totalSeconds = +hours * 60 * 60;
                }else if(minutes !== '00'){
                    if(minutes === '01'){
                        secString = '1 Minute';
                    }else   {
                        secString = +minutes + ' Minutes';
                    }
                    totalSeconds = +minutes * 60;
                }else if(seconds !== '00'){
                    if(seconds === '01'){
                        secString = '1 Second';
                    }else{
                        secString = +seconds + ' Seconds';
                    }
                    totalSeconds = +seconds;
                }
            }
            return [totalSeconds, secString];
        },
        formatNumber: function(number){
            return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        },
        initPoller: function(modelObj, pollerOptions){
            return Poller.get(modelObj, _.extend(pollerOptions, {
                continueOnError: true,
                success: Util.pollerSuccessWrapper,
                error: Util.pollerFailureWrapper
            }));
        },

        pollerSuccessWrapper: function(response, resp) {
            if (resp.error != null) {
                //All Error Checks
                if (resp.error.indexOf("Invalid session") != -1) {
                    Util.showUserSessionInvalidateError();
                } else if (resp.error.indexOf("Invalid cluster id") != -1) {
                    Util.clusterIDReset();
                }
            }

            if(resp.build_details != null){
                window.AMCGLOBALS.persistent.buildDetails = resp.build_details;
            }

            if(resp.nodes_compatibility != null){
                Util.checkForCompatibility(resp.nodes_compatibility);
            }

            //Do your checks before this
            response.fetchSuccess.apply(this, arguments);
        },

        pollerFailureWrapper: function(response){
            //Do your checks before this
            response.fetchError.apply(this, arguments);
        },

        updateCollectionPoller: function(collection, timeInterval, start){
            collection.each(function(model){
                Util.updateModelPoller(model, timeInterval, start);
            });

        },
        updateModelPoller: function(model, timeInterval, start){
            var polOptions = AppConfig.pollerOptions(timeInterval);
            if(start)
                Util.initPoller(model, polOptions).start();
            else
                Util.initPoller(model, polOptions).stop();
        },
        destroyCollection: function(collection){
                 var tempModel;
                 while (tempModel = collection.pop()) {
                     Util.destroyModel(tempModel);
                 }
                 collection.reset();
                 collection = null;
        },
        destroyModel: function(model){
                 model.destroy();
                 model = null;
                 return model;
        },
        /*STAT UTIL*/
        startStatPoller: function(model){
            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['stat']);
            var statPoller = this.initPoller(model, polOptions);
            statPoller.start();
        },
        stopStatPoller: function(model){
            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['stat']);
            var statPoller = this.initPoller(model, polOptions);
            statPoller.stop();
        },
        stopPollingCollectionExceptSeedNode: function(clusterModel){
            try{
                if(clusterModel.statCollection === null){
                    return;
                }
                var models = clusterModel.statCollection.models;
                for(var modelI in models){
                    var  model = models[modelI];
                    if(model.address !== window.AMCGLOBALS.persistent.seedNode){
                        this.stopStatPoller(model);
                        window.clearTimeout(model.setTimeOut);
                    }
                }
            }catch(e){
                console.log(e.toString());
            }
        },
        stopPollingCollection: function(clusterModel){
            try{
                if(clusterModel.statCollection === null){
                    return;
                }
                var models = clusterModel.statCollection.models;
                for(var modelI in models){
                    var  model = models[modelI];
                    this.stopStatPoller(model);
                    window.clearTimeout(model.setTimeOut);
                }
            }catch(e){
                console.log(e.toString());
            }
        },
        startPollingCollection: function(clusterModel){
            try{
                var models = clusterModel.statCollection.models;
                for(var modelI in models){
                    var  model = models[modelI];
                    this.startStatPoller(model);
                    window.clearTimeout(model.setTimeOut);
                }
            }catch(e){
                console.log(e.toString());
            }
        },
        stopPollingModel: function(clusterModel, modelAddress){
            try{
                var modelToPause;
                if(clusterModel.statCollection === null){
                    return;
                }
                var models = clusterModel.statCollection.models;

                for(var model in models){
                    if(modelAddress === models[model].address){
                        modelToPause = models[model];
                        break;
                    }
                }
                this.stopStatPoller(modelToPause);
                window.clearTimeout(modelToPause.setTimeOut);
            }catch(e){
                console.info('ERROR IN STOP')
                console.error(e);
            }
        },
        startPollingModel: function(clusterModel, modelAddress){
            try{
                var modelToResume;
                if(clusterModel.statCollection === null){
                    return;
                }
                var models = clusterModel.statCollection.models;

                for(var model in models){
                    if(modelAddress === models[model].address){
                        modelToResume = models[model];
                        break;
                    }
                }
                this.startStatPoller(modelToResume);
                window.clearTimeout(modelToResume.setTimeOut);
            }catch(e){
                console.info('ERROR IN START')
                console.error(e);
            }
        },
        saveColumnVisibiltyState: function(){
            var colModel = $(AppConfig.stat.statTableDiv).getGridParam('colModel'); // this get the colModel array
            var visibileColList = [];
            var j = 0;
            $.each(colModel, function(i) {
                if(this.hidden === false && this.name !== 'rn' && this.name !== 'stat') {
                    visibileColList[j++] = this.name;
                }
            });
            return visibileColList;
        },

        setUpVisibilityStateListener : function(){

            var hidden = "hidden";

            // Standards:
            if (hidden in document)
                document.addEventListener("visibilitychange", onchange);
            else if ((hidden = "mozHidden") in document)
                document.addEventListener("mozvisibilitychange", onchange);
            else if ((hidden = "webkitHidden") in document)
                document.addEventListener("webkitvisibilitychange", onchange);
            else if ((hidden = "msHidden") in document)
                document.addEventListener("msvisibilitychange", onchange);
            // IE 9 and lower:
            else if ('onfocusin' in document)
                document.onfocusin = document.onfocusout = onchange;
            // All others:
            else
                window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onchange;

            function onchange (evt) {
                var v = 'visible', h = 'hidden',
                evtMap = {
                    focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
                };

                evt = evt || window.event;

                $("body").removeClass(v).removeClass(h);

                if (evt.type in evtMap){
                    if(!window.$("#changeClusterButton").hasClass("active")){
                        $("body").addClass(evtMap[evt.type]);
                        document.dispatchEvent(new CustomEvent(evtMap[evt.type]));
                    }
                    console.info(evtMap[evt.type]);
                } else if(this[hidden]){
                    if(!window.$("#changeClusterButton").hasClass("active")){
                        $("body").addClass(h);
                        document.dispatchEvent(new CustomEvent(h));
                    }
                    console.info(h);
                } else{
                    if(!window.$("#changeClusterButton").hasClass("active")){
                        $("body").addClass(v);
                        document.dispatchEvent(new CustomEvent(v));
                    }
                    console.info(v);
                }
            }
        },

        //VISIBILTY CHECK: Disable all ajax request if window is hidden

        stopIfWindowNotVisible: function(){
            var Util = this;

            function pausePollers() {
                if(!window.AMCGLOBALS.pageSpecific.keepPollersAlive){
                    Util.pauseAllActivePollers(!Util.isMobile.any());
                    console.info('Window out of focus : polling stopped');
                }
            };

            function resumePollers(){
                Util.resumeAllActivePollers();
                console.info('Window in focus : polling started');
            }

            $(document).off("hidden", pausePollers).on("hidden", pausePollers);
            $(document).off("visible", resumePollers).on("visible", resumePollers);
        },

        startVisibleColPolling: function(clusterModel){
            try{
                var visibleColList = Util.saveColumnVisibiltyState();
                var address, model;
                for(var modelI in clusterModel.statCollection.models){
                    model = clusterModel.statCollection.models[modelI];
                    address = model.address;
                    if(_.contains(visibleColList, address)){
                        Util.startStatPoller(model);
                    }
                }
            }catch(e){
                console.log(e.toString());
            }
        },
        //INPUT VALIDATIONS
        isNumbericKey: function(event){
                    // Allow: backspace, delete, tab, escape, and enter
                    if ( event.keyCode == 46 || event.keyCode == 8 || event.keyCode == 9 || event.keyCode == 27 || event.keyCode == 13 ||
                         // Allow: Ctrl
                        (event.ctrlKey === true )||//&& event.keyCode == 65) ||
                         // Allow: home, end, left, right
                        (event.keyCode >= 35 && event.keyCode <= 39)) {
                             // let it happen, don't do anything
                             return true;
                    }
                    else {
                        // Ensure that it is a number and stop the keypress
                        if (event.shiftKey || (event.keyCode < 48 || event.keyCode > 57) && (event.keyCode < 96 || event.keyCode > 105 )) {
                            return false;
                        }
                        return true;
                    }
        },
        numbericInputValidation: function(inputID, connectBtn){
                $(inputID).off('keydown');
                var Util = this;
                $(inputID).off('keydown');
                $(inputID).on('keydown', function(event){
                    var isAllow = Util.isNumbericKey(event);
                    if(!isAllow){
                        event.preventDefault();
                    }else{
                        //Allow
                    }

                    if(event.keyCode === 13){
                        if(typeof connectBtn !== 'undefined'){
                             $(connectBtn).click();
                        }
                    }
                });
        },
        //SELECTABLE UTILS
        removeDotAndColon: function(inputAddr){
            var outPutAddr = inputAddr.replace(/\./g, "");
            outPutAddr = outPutAddr.replace(/:/g, "");
            return outPutAddr;
        },
        getNodeSelectIDStr: function(address){
            return "nodeSelectable-"+Util.removeDotAndColon(address);
        },
        selectSelectableElement: function(selectableContainer, elementToSelect){
            // add unselecting class to all elements in the styleboard canvas except current one
                    $("li.selectable", selectableContainer).each(function() {
                            if (this != elementToSelect[0]){
                                    $(this).removeClass("ui-selected");
                            }
                    });

                    // add ui-selecting class to the element to select
                    elementToSelect.addClass("ui-selected");

                    // trigger the mouse stop event (this will select all .ui-selecting elements, and deselect all .ui-unselecting elements)
                    //selectableContainer.data("ui-selectable")._mouseStop(null);
        },
        selectSelectableElementList: function(selectableContainer){
                $("li", selectableContainer).each(function() {
                    var item = $(this);
                    //console.info($(this).attr('id'))
                    if(item.hasClass('unselectable')){
                        $(this).removeClass("ui-selected");
                    }else if(item.hasClass('selectable')){
                        $(this).addClass("ui-selected");
                    }
                });
                // trigger the mouse stop event (this will select all .ui-selecting elements, and deselect all .ui-unselecting elements)
                //selectableContainer.data("ui-selectable")._mouseStop(null);

        },
        checkMaxLimitAndResetToDefaultMax: function(container, clusterModel){
//                var allNodesLi =  $(container).find('li');
                var selectedNodesLi =  $(container).find('li.ui-selected');
                var unSelectedNodesLi =  $(container).find('li:not(.ui-selected)');
                var totalSelectedNodesLi = selectedNodesLi.length;
//                var totalUnSelectedNodesLi = unSelectedNodesLi.length;
                var toastMsg;
                if(totalSelectedNodesLi === 0){
                    var oldSelectedNodes = window.AMCGLOBALS.persistent.selectedNodes;
                    this.resetSelectedNodes(container, oldSelectedNodes);
                }
                if(window.location.pathname !== "/admin-console/" && totalSelectedNodesLi > AppConfig.maxStartNodes){
                    var totalExtraNodes = totalSelectedNodesLi - AppConfig.maxStartNodes;
                    var extraNodesLi = _.last(selectedNodesLi,totalExtraNodes);
                    this.resetExtraSelectedNodes(container, extraNodesLi);
                    toastMsg = 'You can only select a maximum of '+AppConfig.maxStartNodes+' nodes. First '+AppConfig.maxStartNodes+' nodes are selected.';
                    Util.displayToastMsg('#selectNodesMsgToast',toastMsg);
                }else if(totalSelectedNodesLi === 1){
                    toastMsg = '1 Node selected';
                    Util.displayToastMsg('#selectNodesMsgToast',toastMsg);
                }else if(totalSelectedNodesLi !== 0){
                    toastMsg = totalSelectedNodesLi+' Nodes selected';
                    Util.displayToastMsg('#selectNodesMsgToast',toastMsg);
                }else{
                    toastMsg = ' No nodes selected. Previous selection is maintained.';
                    Util.displayToastMsg('#selectNodesMsgToast',toastMsg);
                }
        },
        displayToastMsg: function(container, toastMsg){
            if(_.isUndefined(window.selectNodesToastTimeout)){
                window.selectNodesToastTimeout = null;
            }else{
                window.clearTimeout(window.selectNodesToastTimeout);
            }
            $(container).fadeOut(100);
            $(container).html(toastMsg);
            $(container).fadeIn(200);
            window.selectNodesToastTimeout = window.setTimeout(function(){
                $(container).fadeOut(200);
            },AppConfig.toastTimeout);
        },
     onFail: function(video){
        console.info('ERROR CATCHED');
    },
        initHelp: function(){
            try{

                $('#selectNodesHelpVideoContainer').html(AppConfig.htmlVideo.selectNodes(Util.onFail));

                $("#selectNodesHelpBtn").off('click');

                $("#selectNodesHelpBtn").on('click',function(e){
                    e.stopPropagation();

                    $("#selectNodesHelp").dialog({
                        modal: true,
                        width: Math.min((window.innerWidth - 50), 940),
                        height: ((Math.min((window.innerWidth - 50), 940)) * (166/940)),
                        resizable: false,
                        closeOnEscape: true,
                        dialogClass: 'no-dialog-title',
                        close: function(event, ui){
                            var selectNodesHelpVideo=document.getElementById("selectNodesHelpVideo");
                            if(!!selectNodesHelpVideo){
                                selectNodesHelpVideo.currentTime = 0;
                                selectNodesHelpVideo.pause();
                            }
                        }
                    });

                    $("#selectNodesHelpCloseBtn").off('click');

                    $("#selectNodesHelpCloseBtn").on('click',function(){
                        $("#selectNodesHelp").dialog("close");
                    });

                    var selectNodesHelpVideo=document.getElementById("selectNodesHelpVideo");
                    if(!!selectNodesHelpVideo){
                        selectNodesHelpVideo.play();
                    }

                });
            }catch(e){
                console.info('Error in selectNodes help');
            }
        },
        resetSelectedNodes: function(container, oldSelectedNodes){
            $("li", $(container)).each(function() {
                var thisIPAdd = $(this).attr('title');
                var oldSelectedNode = _.find(oldSelectedNodes, function(ipAdd){ return ipAdd === thisIPAdd; });
                if(typeof oldSelectedNode !== 'undefined'){
                    $(this).removeClass("ui-unselecting").addClass("ui-selected");
                }
            });
            //$(container).data("ui-selectable")._mouseStop(null);
        },
        resetExtraSelectedNodes: function(container, extraNodesLi){
            $("li", $(container)).each(function() {
                var thisID = $(this).attr('id');
                var extraNodeLi = _.find(extraNodesLi, function(liID){ return $(liID).attr('id') === thisID; });
                if(typeof extraNodeLi !== 'undefined'){
                    $(this).removeClass("ui-selected");
                }
            });
            //$(container).data("ui-selectable")._mouseStop(null);
        },
        initSelectNodesToggling: function(toggleBtn){
            //window.isSelectNodesShown = false;

            $("input").click(function(e){
                e.stopPropagation();
            });

            $("select").click(function(e){
                e.stopPropagation();
            });

            $(".all_stats_links").click(function(e){
                e.stopPropagation();
            });

            var currRow = $("#wrap .main-container");
            Util.setupRowLevelInfo(currRow.find(".grid_16").not(currRow.find(".grid_16 .grid_16")), "grid_16", 0, 0);

            var cookieSetForPage = false;
            var panelWholeState = Util.getCookie("panelState") || "";

            panelState = panelWholeState.split("|") || "";

            for (var i in panelState) {
                if (panelState[i].split(";")[0] === AMCGLOBALS.activePage) {
                    panelState = panelState[i].split(";").slice(1);
                    cookieSetForPage = true;
                    break;
                }
            }

            if (cookieSetForPage) {
                for (var state in panelState) {
                    var classes = panelState[state].split(",");
                    var cards, row = $(".gLevel-" + classes[0] + ".gRow-" + classes[1]);

                    if (!row.hasClass("card_layout")) {
                        cards = row.find(".card_layout").not(row.find(".card_layout .card_layout"));
                    } else{
                        cards = row;
                    }

                    cards.children(".title-bar").addClass("closed").removeClass("open");
                    cards.children(".title-bar").find(".toggle-to-state").text("(Show)");
                    cards.children(".box-container").css("display", "none");
                }
            }


            $(toggleBtn).off('click');
            $(toggleBtn).on('click', function(e) {
                e.stopPropagation();
                var container = $(e.target),
                    containerVisible,
                    gLevel,
                    gRow,
                    panelStateWhole = [],
                    panelState = "",
                    state,
                    panelStateIndex;

                while (!container.is('body')) {
                    if (container.hasClass("grid_16")) {
                        break;
                    } else {
                        container = container.parent();
                    }
                }

                gLevel = container.attr("class").match(/gLevel\-[0-9]/);
                gRow = container.attr("class").match(/gRow\-[0-9]/);

                if (gLevel != null) {
                    gLevel = gLevel[0];
                    gLevel = +gLevel.substr(7);
                }

                if (gRow != null) {
                    gRow = gRow[0];
                    gRow = +gRow.substr(5);
                }

                if (gRow != null && gLevel != null) {
                    panelStateWhole = Util.getCookie("panelState") || [];
                    if (panelStateWhole.length > 0) {
                        panelState = panelStateWhole = panelStateWhole.split("|");
                        for (var i in panelState) {
                            var stateForPage = panelState[i].split(";")[0];
                            if (stateForPage != null && stateForPage !== "") {
                                if (AMCGLOBALS.activePage === stateForPage) {
                                    panelState = panelState[i];
                                    panelStateIndex = i;
                                    break;
                                }
                            }
                        }
                        if (panelStateIndex != null) {
                            state = panelState.match(new RegExp(gLevel + "\," + gRow + "\;"));
                        }

                        if (state != null)
                            state = state[0];
                    }
                }

                if (panelState === "" || panelStateIndex == null) {
                    panelState = AMCGLOBALS.activePage + ";";
                }

                if (state != null && state) {
                    panelState = panelState.substr(0, panelState.indexOf(state)) + panelState.substr(panelState.indexOf(state) + state.length);
                }

                container = container.find(".box-container").not(container.find(".box-container .box-container"));
                containerVisible = container.css("display") === 'none' ? false : true;

                if (containerVisible === true) {
                    Util.selectNodesToggle(container, false);

                    panelState = panelState + (gLevel + "," + gRow + ";");

                    if (panelStateIndex != null)
                        panelStateWhole[panelStateIndex] = panelState;
                    else
                        panelStateWhole.push(panelState);

                    Util.setCookie("panelState", panelStateWhole.join("|"), 43200, "/");
                } else {
                    Util.selectNodesToggle(container, true);

                    if (state != null && state) {

                        if (panelStateIndex != null)
                            panelStateWhole[panelStateIndex] = panelState;
                        else
                            panelStateWhole.push(panelState);

                        Util.setCookie("panelState", panelStateWhole.join("|"), 43200, "/");
                    }
                }
            });
        },

        BlockAccessToInacessibleModules : function(){
            var inAccessibleModules = window.$(".outside-assigned-roles");
            var roleToken = Util.versionCompare(window.AMCGLOBALS.persistent.buildDetails.latest_build_no, "3.5.4") >= 0 ? "Privilege" : "Role";

            inAccessibleModules.add(".outside-assigned-roles *").off("mousedown mouseup keydown keyup");

            Util.selectNodesToggle( inAccessibleModules.find(".box-container") , false);

            if(AMCGLOBALS.activePage === "admin-console" && inAccessibleModules.length > 0){
                var items = window.$('#v-nav>ul>li');
                var divs = window.$('#v-nav>div.tab-content');

                inAccessibleModules.each(function(index, container){
                    var el = divs.eq( items.index( container ) )
                                .addClass("outside-assigned-roles");

                    if(AMCGLOBALS.persistent.roleList.indexOf( container.attributes["data-min-role-required"].value ) === -1) {
                        el.prepend("<div class='permission-overlay'>Module not accessible. " + roleToken + " required : [" +
                                (container.attributes["data-min-role-required"] && container.attributes["data-min-role-required"].value) +
                                "]. " + roleToken + "s Available : [" + AMCGLOBALS.persistent.roleList +  "].</div>");
                    } else {
                        el.prepend("<div class='permission-overlay'>Module not accessible. Module not supported by some of the cluster nodes.</div>");
                    }
                });

            } else {
                inAccessibleModules.find(".box-container").prepend("<div class='permission-overlay'>Module not accessible. " + roleToken + " required : [" +
                                (inAccessibleModules.attr("data-min-role-required")) +
                                "]. " + roleToken + "s Available : [" + AMCGLOBALS.persistent.roleList +  "].</div>");
            }

            $(".tooltip").remove();
             window.$(".outside-assigned-roles").off("mouseover mousemove").on("mouseover mousemove", function(event){
                var html = "<div>You don't have permissions to access this module or it does not support your current aerospike version.</div>";
                $(".tooltip").remove();
                $("<div class='tooltip' style='width:150px; left : " + Math.min( Math.max(0, (event.pageX - 110)), window.innerWidth - 160) + "px; top : " + ((event.pageY + 100) < window.innerHeight ? (event.pageY + 27) : event.pageY - 70) + "px;'>" +
                    "<div class='tooltip-info' style='background-color: #888;'>" +
                html + "</div>" + "</div>").appendTo("body");
            }).on("mouseout", function(){
                $(".tooltip").remove();
            });

            $(".outside-assigned-roles a").add(".outside-assigned-roles button").add(".outside-assigned-roles input")
                .on("click", function(event){
                    event.preventDefault();
                })
                .attr("disabled", "disabled");
        },

        setupRowLevelInfo: function(el, rowSelector, level, row) {
            var nextLevelRow = 0;
            el.each(function(index, DOMObj) {
                var currRow = $(DOMObj);
                if (currRow.hasClass(rowSelector)) {
                    currRow.addClass("gLevel-" + level).addClass("gRow-" + row);
                    nextLevelRow = Util.setupRowLevelInfo(currRow.find(".grid_16").not(currRow.find(".grid_16 .grid_16")), rowSelector, level + 1, nextLevelRow);
                    row++;
                }
            });

            return row;
        },

        selectNodesToggle: function(container, show){
            var container = window.$(container);
            if(show === true){
                container.parent()
                .children(".title-bar")
                .css("border-radius","0");

                container.slideToggle(200,function(){
                    container.parent()
                        .trigger("startPoller")
                        .children(".title-bar")
                        .removeClass("closed")
                        .addClass("open")
                        .find(".title-bar-header .toggle-to-state")
                        .html("(Hide)");
                });
                //toggleText.html('(Hide)');
            }else{
                container.slideToggle(200,function(){
                    container.parent()
                        .trigger("stopPoller")
                        .children(".title-bar")
                        .removeClass("open")
                        .addClass("closed")
                        .find("span.toggle-to-state")
                        .html("(Show)");
                });

            }

            document.dispatchEvent(new CustomEvent("resize"));
        },
        subTitleToggle: function(container, show){

            if(show === true){
                container.parent().find(".title-ribbon").show();
                container.parent().children(".sub-title-bar").removeClass("close");
                container.parent().children(".sub-title-bar").addClass("open");
                container.slideToggle(200,function(){
                    container.parent().find(".title-bar-header .toggle-to-state").html("(Hide)");
                });
                //toggleText.html('(Hide)');
            }else{
                container.slideToggle(200,function(){
                    container.parent().children(".sub-title-bar").removeClass("open");
                    container.parent().children(".sub-title-bar").addClass("close");
                    container.parent().find("span.toggle-to-state").html("(Show)");
                    container.parent().find(".title-ribbon").hide();
                });
                //toggleText.html('(Show)');
            }

        },
        //THROUGHPUT
        toggleNodeThroughput: function(clusterModel, nodeAddr, isEnabled){
                console.info(nodeAddr+' : '+isEnabled);
                console.info(AMCGLOBALS.pageSpecific.charts.xdrWritesChartType);
                try{
                var isDisabled = !isEnabled;
                var readIndex, writeIndex, readTotalTPSIndex, writeTotalTPSIndex;
                var xdrReadIndex, xdrWriteIndex, xdrReadTotalTPSIndex, xdrWriteTotalTPSIndex;
                var scanIndex, queryIndex, scanTotalTPSIndex, queryTotalTPSIndex;
                var udfIndex, batchReadIndex, udfTotalTPSIndex, batchReadTotalTPSIndex;
                var readSeries = clusterModel.throughputModel.readsDataWithOptions;
                var writeSeries = clusterModel.throughputModel.writesDataWithOptions;
                var xdrReadsSeries = clusterModel.throughputModel.xdrReadsDataWithOptions;
                var xdrWritesSeries = clusterModel.throughputModel.xdrWritesDataWithOptions;
                var queriesSeries = clusterModel.throughputModel.queriesDataWithOptions;
                var scansSeries = clusterModel.throughputModel.scansDataWithOptions;
                var udfsSeries = clusterModel.throughputModel.udfsDataWithOptions;
                var batchReadsSeries = clusterModel.throughputModel.batchReadsDataWithOptions;


                for(var i = 0; i < readSeries.length && (readIndex == null || readTotalTPSIndex == null); i++){
                    if(readSeries[i].name === nodeAddr)
                        readIndex = i;
                    if(readSeries[i].name === "TPS")
                        readTotalTPSIndex = i;
                }

                for(var i = 0; i < writeSeries.length && (writeIndex == null || writeTotalTPSIndex == null); i++){
                    if(writeSeries[i].name === nodeAddr)
                        writeIndex = i;
                    if(writeSeries[i].name === "TPS")
                        writeTotalTPSIndex = i;
                }

                for(var i = 0; i < xdrReadsSeries.length && (xdrReadsIndex == null || xdrReadsTotalTPSIndex == null); i++){
                    if(xdrReadsSeries[i].name === nodeAddr)
                        xdrReadsIndex = i;
                    if(xdrReadsSeries[i].name === "TPS")
                        xdrReadsTotalTPSIndex = i;
                }

                for(var i = 0; i < xdrWritesSeries.length && (xdrWritesIndex == null || xdrWritesTotalTPSIndex == null); i++){
                    if(xdrWritesSeries[i].name === nodeAddr)
                        xdrWritesIndex = i;
                    if(xdrWritesSeries[i].name === "TPS")
                        xdrWritesTotalTPSIndex = i;
                }

                for(var i = 0; i < queriesSeries.length && (queriesIndex == null || queriesTotalTPSIndex == null); i++){
                    if(queriesSeries[i].name === nodeAddr)
                        queriesIndex = i;
                    if(queriesSeries[i].name === "TPS")
                        queriesTotalTPSIndex = i;
                }

                for(var i = 0; i < scansSeries.length && (scansIndex == null || scansTotalTPSIndex == null); i++){
                    if(scansSeries[i].name === nodeAddr)
                        scansIndex = i;
                    if(scansSeries[i].name === "TPS")
                        scansTotalTPSIndex = i;
                }

                for(var i = 0; i < udfsSeries.length && (udfsIndex == null || udfsTotalTPSIndex == null); i++){
                    if(udfsSeries[i].name === nodeAddr)
                        udfsIndex = i;
                    if(udfsSeries[i].name === "TPS")
                        udfsTotalTPSIndex = i;
                }

                for(var i = 0; i < batchReadsSeries.length && (batchReadsIndex == null || batchReadsTotalTPSIndex == null); i++){
                    if(batchReadsSeries[i].name === nodeAddr)
                        batchReadsIndex = i;
                    if(batchReadsSeries[i].name === "TPS")
                        batchReadsTotalTPSIndex = i;
                }

                if (readSeries[readIndex] != null && AMCGLOBALS.pageSpecific.charts.readChartType === "nodewise") {
                    readSeries[readIndex].disabled = isDisabled;
                }
                if (writeSeries[writeIndex] != null && AMCGLOBALS.pageSpecific.charts.writeChartType === "nodewise") {
                    writeSeries[writeIndex].disabled = isDisabled;
                }
                if (xdrReadsSeries[xdrReadsIndex] != null && AMCGLOBALS.pageSpecific.charts.xdrReadsChartType === "nodewise") {
                    xdrReadsSeries[xdrReadsIndex].disabled = isDisabled;
                }
                if (xdrWritesSeries[xdrWritesIndex] != null && AMCGLOBALS.pageSpecific.charts.xdrWritesChartType === "nodewise") {
                    xdrWritesSeries[xdrWritesIndex].disabled = isDisabled;
                }
                if (queriesSeries[queriesIndex] != null && AMCGLOBALS.pageSpecific.charts.queriesChartType === "nodewise") {
                    queriesSeries[queriesIndex].disabled = isDisabled;
                }
                if (scansSeries[scansIndex] != null && AMCGLOBALS.pageSpecific.charts.scansChartType === "nodewise") {
                    scansSeries[scansIndex].disabled = isDisabled;
                }
                if (udfsSeries[udfsIndex] != null && AMCGLOBALS.pageSpecific.charts.udfsChartType === "nodewise") {
                    udfsSeries[udfsIndex].disabled = isDisabled;
                }
                if (batchReadsSeries[batchReadsIndex] != null && AMCGLOBALS.pageSpecific.charts.batchReadsChartType === "nodewise") {
                    batchReadsSeries[batchReadsIndex].disabled = isDisabled;
                }

                if(readSeries[readTotalTPSIndex] != null){
                    for(var i = 0; i < readSeries[readTotalTPSIndex].data.length; i++){
                        readSeries[readTotalTPSIndex].data[i].secondary = readSeries[readTotalTPSIndex].data[i].secondary + (isEnabled ? (readSeries[readIndex].data[i].secondary) : (-readSeries[readIndex].data[i].secondary));
                        readSeries[readTotalTPSIndex].data[i].y = readSeries[readTotalTPSIndex].data[i].y + (isEnabled ? (readSeries[readIndex].data[i].y) : (-readSeries[readIndex].data[i].y));
                    }
                }

                if(writeSeries[writeTotalTPSIndex] != null){
                    for(var i = 0; i < writeSeries[writeTotalTPSIndex].data.length; i++){
                        writeSeries[writeTotalTPSIndex].data[i].secondary = writeSeries[writeTotalTPSIndex].data[i].secondary + (isEnabled ? (writeSeries[readIndex].data[i].secondary) : (-writeSeries[readIndex].data[i].secondary));
                        writeSeries[writeTotalTPSIndex].data[i].y = writeSeries[writeTotalTPSIndex].data[i].y + (isEnabled ? (writeSeries[readIndex].data[i].y) : (-writeSeries[readIndex].data[i].y));
                    }
                }

                if(xdrReadsSeries[xdrReadsTotalTPSIndex] != null){
                    for(var i = 0; i < xdrReadsSeries[xdrReadsTotalTPSIndex].data.length; i++){
                        xdrReadsSeries[xdrReadsTotalTPSIndex].data[i].secondary = xdrReadsSeries[xdrReadsTotalTPSIndex].data[i].secondary + (isEnabled ? (xdrReadsSeries[readIndex].data[i].secondary) : (-xdrReadsSeries[readIndex].data[i].secondary));
                        xdrReadsSeries[xdrReadsTotalTPSIndex].data[i].y = xdrReadsSeries[xdrReadsTotalTPSIndex].data[i].y + (isEnabled ? (xdrReadsSeries[readIndex].data[i].y) : (-xdrReadsSeries[readIndex].data[i].y));
                    }
                }

                if(xdrWritesSeries[xdrWritesTotalTPSIndex] != null){
                    for(var i = 0; i < xdrWritesSeries[xdrWritesTotalTPSIndex].data.length; i++){
                        xdrWritesSeries[xdrWritesTotalTPSIndex].data[i].secondary = xdrWritesSeries[xdrWritesTotalTPSIndex].data[i].secondary + (isEnabled ? (xdrWritesSeries[readIndex].data[i].secondary) : (-xdrWritesSeries[readIndex].data[i].secondary));
                        xdrWritesSeries[xdrWritesTotalTPSIndex].data[i].y = xdrWritesSeries[xdrWritesTotalTPSIndex].data[i].y + (isEnabled ? (xdrWritesSeries[readIndex].data[i].y) : (-xdrWritesSeries[readIndex].data[i].y));
                    }
                }

                if(queriesSeries[queriesTotalTPSIndex] != null){
                    for(var i = 0; i < queriesSeries[queriesTotalTPSIndex].data.length; i++){
                        queriesSeries[queriesTotalTPSIndex].data[i].secondary = queriesSeries[queriesTotalTPSIndex].data[i].secondary + (isEnabled ? (queriesSeries[readIndex].data[i].secondary) : (-queriesSeries[readIndex].data[i].secondary));
                        queriesSeries[queriesTotalTPSIndex].data[i].y = queriesSeries[queriesTotalTPSIndex].data[i].y + (isEnabled ? (queriesSeries[readIndex].data[i].y) : (-queriesSeries[readIndex].data[i].y));
                    }
                }

                if(scansSeries[scansTotalTPSIndex] != null){
                    for(var i = 0; i < scansSeries[scansTotalTPSIndex].data.length; i++){
                        scansSeries[scansTotalTPSIndex].data[i].secondary = scansSeries[scansTotalTPSIndex].data[i].secondary + (isEnabled ? (scansSeries[readIndex].data[i].secondary) : (-scansSeries[readIndex].data[i].secondary));
                        scansSeries[scansTotalTPSIndex].data[i].y = scansSeries[scansTotalTPSIndex].data[i].y + (isEnabled ? (scansSeries[readIndex].data[i].y) : (-scansSeries[readIndex].data[i].y));
                    }
                }

                if(udfsSeries[udfsTotalTPSIndex] != null){
                    for(var i = 0; i < udfsSeries[udfsTotalTPSIndex].data.length; i++){
                        udfsSeries[udfsTotalTPSIndex].data[i].secondary = udfsSeries[udfsTotalTPSIndex].data[i].secondary + (isEnabled ? (udfsSeries[readIndex].data[i].secondary) : (-udfsSeries[readIndex].data[i].secondary));
                        udfsSeries[udfsTotalTPSIndex].data[i].y = udfsSeries[udfsTotalTPSIndex].data[i].y + (isEnabled ? (udfsSeries[readIndex].data[i].y) : (-udfsSeries[readIndex].data[i].y));
                    }
                }

                if(batchReadsSeries[batchReadsTotalTPSIndex] != null){
                    for(var i = 0; i < batchReadsSeries[batchReadsTotalTPSIndex].data.length; i++){
                        batchReadsSeries[batchReadsTotalTPSIndex].data[i].secondary = batchReadsSeries[batchReadsTotalTPSIndex].data[i].secondary + (isEnabled ? (batchReadsSeries[readIndex].data[i].secondary) : (-batchReadsSeries[readIndex].data[i].secondary));
                        batchReadsSeries[batchReadsTotalTPSIndex].data[i].y = batchReadsSeries[batchReadsTotalTPSIndex].data[i].y + (isEnabled ? (batchReadsSeries[readIndex].data[i].y) : (-batchReadsSeries[readIndex].data[i].y));
                    }
                }

                var updateNow = false;
                for(var eachNode in readSeries){
                    if(!readSeries[eachNode].disabled){
                        updateNow = true;
                        break;
                    }
                }

                if(updateNow){
                    clusterModel.throughputModel.updateCharts(clusterModel.throughputModel);
                }

            }catch(e){
                console.info('ERRRRRRRRORRRR');
            }
        },
        //STOP POllING FOR NODES & XDR
        stopNodesXDRPolling: function(){
            try{
                var clusterModel;
                clusterModel = window.AMCGLOBALS.activePageModel;
                this.stopCollectionPolling(clusterModel.nodeCollection);
                this.stopCollectionPolling(clusterModel.xdrCollection);
            }catch(e){
                console.info('ERROR IN STOPPING_1')
            }
        },
        stopCollectionPolling: function(collection){
            try{
                var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['cluster']);
                var models = collection.models;
                var model, modelI, tempPoller;
                for(var modelI in models){
                    var model = models[modelI];
                    tempPoller = Util.initPoller(model,polOptions);
                    tempPoller.stop();
                }
            }catch(e){
                console.info('ERROR IN STOPPING_2')
            }
        },
        startNodesXDRPolling: function(){
            try{
                var clusterModel = window.AMCGLOBALS.activePageModel;
                var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['nodes']);
                this.startCollectionPolling(clusterModel.nodeCollection, polOptions);
                polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['xdr']);
                this.startCollectionPolling(clusterModel.xdrCollection, polOptions);
            }catch(e){
                console.info('ERROR IN STARTING_3')
            }
        },
        startCollectionPolling: function(collection, polOptions){
            try{
                var models = collection.models;
                var model, modelI, tempPoller;
                for(var modelI in models){
                    var model = models[modelI];
                    tempPoller = Util.initPoller(model,polOptions);
                    tempPoller.start();
                }
            }catch(e){
                console.info('ERROR IN STARTING_4')
            }
        },
        addJobToClusterModel: function(clusterModel, nodeAddr){
            try{
                var nodeModelI = clusterModel.nodeCollection.models.length;
                Util.createNewJobModel(clusterModel, clusterModel.nodeCollection, nodeModelI, nodeAddr, 2, 'jobs');

            }catch(e){
                console.info('error in addNodeToClusterModel')
            }
        },
        addNodeToClusterModel: function(clusterModel, nodeAddr){
            try{

                var xdrModelI = clusterModel.xdrCollection.models.length;
                var nodeModelI = clusterModel.nodeCollection.models.length;
                Util.toggleNodeThroughput(clusterModel, nodeAddr, true);
                Util.createNewModel(clusterModel, clusterModel.nodeCollection, nodeModelI, nodeAddr, 2, 'nodes');
                Util.createNewModel(clusterModel, clusterModel.xdrCollection, xdrModelI, nodeAddr, 2, 'xdr', window.AMCGLOBALS.persistent.xdrPort);
                if(window.AMCGLOBALS.pageSpecific.selectedNamespace !== null){
                    var identifierValue = nodeAddr;
                    var model = Util.findSelectedNamespaceModel(clusterModel);
                    var namespaceModelI = model.namespaceCollection.models.length;
                    Util.createNewModel(clusterModel, model.namespaceCollection, namespaceModelI, identifierValue, 2, 'namespaces');
                }
            }catch(e){
                var nodeModelI = clusterModel.nodeCollection.models.length;
                Util.createNewModel(clusterModel, clusterModel.nodeCollection, nodeModelI, nodeAddr, 2, 'jobs');
                console.info('error in addNodeToClusterModel')
            }
        },
        createNewModel: function(clusterModel, collection, modelIndex, nodeAddr, totalNodes, polOptionsStr, xdrPort){
            try{
                var clusterID = clusterModel.clusterID;
                var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval[polOptionsStr]);
                collection.addModel(modelIndex, nodeAddr, clusterID, totalNodes, xdrPort);

                if(polOptionsStr !== "nodes" && polOptionsStr !== "namespaces" && polOptionsStr !== "xdr" && polOptionsStr !== "latency"){                //INCREMENTAL UPDATE
                    var model = collection.models[modelIndex];
                    var tempPoller = Util.initPoller(model,polOptions);
                    model.rowView.renderLoading(model);
                    tempPoller.start();
                }
            }catch(e){
                console.log(e);
                console.info('error in creating new model');
            }
        },
        createNewJobModel: function(clusterModel, collection, modelIndex, nodeAddr, totalNodes, polOptionsStr, xdrPort){
            try{
                var clusterID = clusterModel.clusterID;
                var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval[polOptionsStr]);
                collection.addModel(modelIndex, nodeAddr, clusterID, totalNodes, xdrPort);
                var model = collection.models[modelIndex];
                var tempPoller = Util.initPoller(model,polOptions);
                tempPoller.start();
            }catch(e){
                console.info('error in creating new model');
            }
        },
        createNewModelWithoutPoller: function(clusterModel, collection, modelIndex, nodeAddr, totalNodes, xdrPort){
            try{
                collection.addModel(modelIndex, nodeAddr, clusterModel.clusterID, totalNodes, xdrPort);
            }catch(e){
                console.info('error in creating new model');
            }
        },
        initCollectionPoller: function(collection, polOptionsStr){
            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval[polOptionsStr]);
            collection.each(function(model) {
                model.poller = Poller.get(model, _.extend(polOptions, {
                                    continueOnError : true,
                                    autostart : true,
                                    success : function(model){model.fetchSuccess()},
                                    error : function(model){model.fetchError()}
                                }));
            });
        },
        updatePoller: function(poller, polOptionsStr){
            var updateInterval = AppConfig.updateInterval[polOptionsStr];
            poller.set({continueOnError : true, delay: updateInterval}).start();
        },
        deleteNamespaceFromClusterModel: function(clusterModel, namespaceName){
            try{
                Util.deleteModel(clusterModel.namespaceCollection, AppConfig.namespace.namespaceClusterWideTableDiv, namespaceName, 'name');
                if(window.AMCGLOBALS.pageSpecific.selectedNamespace !== null){
                    if(window.AMCGLOBALS.pageSpecific.selectedNamespace === namespaceName){
                        $(AppConfig.namespace.namespaceListCloseButton).click();
                    }
                }
            }catch(e){
                console.info('error in deleteNodeFromClusterModel');
            }
        },
        deleteJobFromClusterModel: function(clusterModel, nodeAddr){
            try{
                Util.deleteModel(clusterModel.nodeCollection, AppConfig.node.nodeTableDiv, nodeAddr, 'address');
                Util.deleteModel(clusterModel.nodeCollection, AppConfig.job.nodeTableCompletedJobsDiv, nodeAddr, 'address');
            } catch (e) {
                console.info('error in deleteNodeFromClusterModel');
            }
        },
        deleteNodeFromClusterModel: function(clusterModel, nodeAddr){
            try{
                Util.toggleNodeThroughput(clusterModel, nodeAddr, false);
                // Util.deleteModel(clusterModel.nodeCollection, AppConfig.node.nodeTableDiv, nodeAddr, 'address');
                // Util.deleteModel(clusterModel.xdrCollection, AppConfig.xdr.xdrTableDiv, nodeAddr, 'address');
                if(window.AMCGLOBALS.pageSpecific.selectedNamespace !== null){
                    var identifierValue = nodeAddr;
                    var model = Util.findSelectedNamespaceModel(clusterModel);
                    Util.deleteModel(model.namespaceCollection, model.namespaceCollection.parent.get("containerDiv"), identifierValue, 'address');
                }
            }catch(e){
                Util.deleteModel(clusterModel.nodeCollection, AppConfig.node.nodeTableDiv, nodeAddr, 'address');
                console.info('error in deleteNodeFromClusterModel');
            }
        },

        validateNodeThroughput : function(clusterModel){
            console.info("validating");
            var nodeList = clusterModel.nodeList;
            nodeList = nodeList.concat( AMCGLOBALS.pageSpecific.charts.clusterwideSeries );
            var readRemoveIndex = [];
            var writeRemoveIndex = [];

            for(var i=0; i<clusterModel.throughputModel.readsDataWithOptions.length; i++){
                var j;
                for(j=0; j<nodeList.length; j++){
                    if(clusterModel.throughputModel.readsDataWithOptions[i].name === nodeList[j])
                        break;
                }

                if(j == nodeList.length)
                    readRemoveIndex.push(i);

                for(j=0; j<nodeList.length; j++){
                    if(clusterModel.throughputModel.writesDataWithOptions[i].name === nodeList[j])
                        break;
                }

                if(j == nodeList.length)
                    writeRemoveIndex.push(i);
            }


            for(var i=0; i<readRemoveIndex.length; i++){
                clusterModel.throughputModel.readsDataWithOptions.splice(readRemoveIndex[i] - i,1);
            }

            for(var i=0; i<writeRemoveIndex.length; i++){
                clusterModel.throughputModel.writesDataWithOptions.splice(writeRemoveIndex[i] - i,1);
            }
        },

        findSelectedNamespaceModel: function(clusterModel){
                for(var modelI in clusterModel.namespaceCollection.models){
                    var model = clusterModel.namespaceCollection.models[modelI];
                    if(window.AMCGLOBALS.pageSpecific.selectedNamespace === model.name){
                        return model;
                    }
                }

        },
        deleteModel: function(collection, gridContainer, nodeToRemove, identifier){
            var polOptions = AppConfig.pollerOptions();
            this.deleteGridModel(collection, [nodeToRemove], gridContainer, identifier, polOptions);
        },
        deleteGridModel: function(collection, deletedList, gridContainer, identifier, polOptions){
                try{
                    var modelsToBeDeleted = [];
                    modelsToBeDeleted = this.getModelsToBeDeleted(collection, deletedList, identifier);
                    this.destroyModels(collection, gridContainer, modelsToBeDeleted, polOptions);
                    if(deletedList.length > 0){
                        this.refreshGrid(collection, gridContainer);
                    }
                }catch(e){
                    console.error(e);
                }
        },
        getModelsToBeDeleted: function(collection, deletedList, identifier){
                var deleteI = 0;
                var modelsToBeDeleted = [];
                for(var index in deletedList){
                    var name = deletedList[index];
                    for(var model in collection.models){
                        if(name === collection.models[model][identifier]){
                            var rowID = collection.models[model].attributes['row_id'];
                            modelsToBeDeleted[deleteI] = [];
                            modelsToBeDeleted[deleteI][0] = collection.models[model];
                            modelsToBeDeleted[deleteI][1] = +rowID;
                            deleteI++;
                            break;
                        }
                    }
                }
                return modelsToBeDeleted;
        },
        destroyModels: function(collection, gridContainer, modelsToBeDeleted, polOptions){
                for(var k in modelsToBeDeleted){
                        var model = modelsToBeDeleted[k][0];
                        var rowID = modelsToBeDeleted[k][1];
                        Util.destroyModel(model);
                        collection.remove(model);
                }
        },
        refreshGrid: function(collection, gridContainer){
                $(gridContainer).jqGrid("clearGridData");
                for(var modelI in collection.models){
                        collection.models[modelI].attributes['row_id'] = modelI;
                        $(gridContainer).jqGrid("clearGridData");
                }
                $(gridContainer).jqGrid("clearGridData");
                for(var modelI in collection.models){
                        var model = collection.models[modelI];
                        //model.rowView.renderLoading(model);
                        try{
                            model.rowView.render(model, model.attributes);
                        } catch(e){
                        }
                }
        },
        updateTabLinks: function(seedNodeStr){
            try{
                if(typeof seedNodeStr === 'undefined'){
                    seedNodeStr = window.AMCGLOBALS.persistent.seedNode;
                }
                if(seedNodeStr !== null){
                    var nodeListStr = '';
                    var nodesAvailable = true;

                    if(AMCGLOBALS.persistent.selectedNodes != null && AMCGLOBALS.persistent.selectedNodes.length > 0){
                        nodeListStr = '/nodelist/'+window.AMCGLOBALS.persistent.selectedNodes;
                        window.AMCGLOBALS.persistent.selectedNodesStr = window.AMCGLOBALS.persistent.selectedNodes.toString();
                    } else if(typeof window.AMCGLOBALS.persistent.selectedNodesStr !== 'undefined' && window.AMCGLOBALS.persistent.selectedNodesStr !== null){
                        nodeListStr = '/nodelist/'+window.AMCGLOBALS.persistent.selectedNodesStr;
                    } else {
                        nodesAvailable = false;
                    }

                    var newTabUrl = '#dashboard/' + seedNodeStr + "/" + (window.AMCGLOBALS.persistent.snapshotTime != null? window.AMCGLOBALS.persistent.snapshotTime : "30");
                    if(nodesAvailable){
                        newTabUrl += (window.AMCGLOBALS.persistent.selectedNodesStr != null? ("/" + window.AMCGLOBALS.persistent.selectedNodesStr) : '');
                    }
                    $("#dasboardTabLink").attr("href", newTabUrl);

                    var hashStr = seedNodeStr + nodeListStr;

                    newTabUrl = '#jobs/' + hashStr;
                    $("#jobsTabLinks").attr("href", newTabUrl);


                    newTabUrl = '#statistics/' + hashStr;
                    if(nodesAvailable){
                        newTabUrl += (window.AMCGLOBALS.persistent.showAttributesFor != null && window.AMCGLOBALS.persistent.showAttributesFor !== 'udf'? ('/' + window.AMCGLOBALS.persistent.showAttributesFor) : '/nodes')
                        if(window.AMCGLOBALS.persistent.showAttributesFor === "namespace" && window.AMCGLOBALS.persistent.namespaceName !== 'null' && window.AMCGLOBALS.persistent.namespaceName !== null){
                            newTabUrl += '/'+window.AMCGLOBALS.persistent.namespaceName;
                        } else if(window.AMCGLOBALS.persistent.showAttributesFor === "xdr" && window.AMCGLOBALS.persistent.xdrPort !== 'null' && window.AMCGLOBALS.persistent.xdrPort !== null){
                            newTabUrl += '/'+window.AMCGLOBALS.persistent.xdrPort;
                        }
                    }
                    $("#statTabLink").attr("href", newTabUrl);

                    newTabUrl = '#definitions/' + hashStr;
                    if(nodesAvailable){
                        newTabUrl += (window.AMCGLOBALS.persistent.showAttributesFor === 'namespace' || window.AMCGLOBALS.persistent.showAttributesFor === 'udf' ? ('/' + window.AMCGLOBALS.persistent.showAttributesFor) : '/namespace')
                                  +(window.AMCGLOBALS.persistent.showAttributesFor === "namespace" && window.AMCGLOBALS.persistent.namespaceName !== 'null' && window.AMCGLOBALS.persistent.namespaceName !== null? ('/'+window.AMCGLOBALS.persistent.namespaceName) : '');
                    }
                    $("#defTabLink").attr("href", newTabUrl);

                    newTabUrl = '#admin-console/' + hashStr;
                    if(nodesAvailable ){
                        if((typeof window.AMCGLOBALS.persistent.showAttributesFor !== 'undefined') && window.AMCGLOBALS.persistent.showAttributesFor !== null && window.AMCGLOBALS.persistent.showAttributesFor !== "sindex"){
                            newTabUrl += (window.AMCGLOBALS.persistent.showAttributesFor !== 'udf'? ('/' + window.AMCGLOBALS.persistent.showAttributesFor) : '/nodes');
                            if(window.AMCGLOBALS.persistent.showAttributesFor === "namespace" && window.AMCGLOBALS.persistent.namespaceName !== 'null' && window.AMCGLOBALS.persistent.namespaceName !== null){
                                newTabUrl += '/'+window.AMCGLOBALS.persistent.namespaceName;
                            } else if(window.AMCGLOBALS.persistent.showAttributesFor === "xdr" && window.AMCGLOBALS.persistent.xdrPort !== 'null' && window.AMCGLOBALS.persistent.xdrPort !== null){
                                newTabUrl += '/'+window.AMCGLOBALS.persistent.xdrPort;
                            }
                        }
                    }
                    $("#adminConsoleTabLinks").attr("href", newTabUrl);

                    newTabUrl = '#latency/' + seedNodeStr + nodeListStr;
                    $("#latencyTabLink").attr("href", newTabUrl);

                    $("#tabListContainer li.selected").removeClass("selected");

                    if(window.location.hash.indexOf("dashboard") != -1 || window.location.hash === ""){
                        $("#dasboardTabLink").parent().addClass("selected");
                    }else if(window.location.hash.indexOf("statistics") != -1){
                        $("#statTabLink").parent().addClass("selected");
                    }else if(window.location.hash.indexOf("definitions") !== -1){
                        $("#defTabLink").parent().addClass("selected");
                    }else if(window.location.hash.indexOf("jobs") != -1){
                        $("#jobsTabLinks").parent().addClass("selected");
                    }else if(window.location.hash.indexOf('latency') != -1){
                        $("#latencyTabLink").parent().addClass("selected");
                    }else if(window.location.hash.indexOf("admin-console") != -1){
                        $("#adminConsoleTabLinks").parent().addClass("selected");
                    }
                }
            }catch(e){

            }
        },
        initAllStatsLinks: function(){
            var seedNodeStr = window.AMCGLOBALS.persistent.seedNode;
            var nodeListStr = '/nodelist/'+window.AMCGLOBALS.persistent.nodeList;
            var hashStr = seedNodeStr + nodeListStr;

            var newTabUrl = '';

            newTabUrl = '#statistics/' + hashStr + '/nodes';
            $("#allStatsLinkNodes").attr("href", newTabUrl);

            newTabUrl = '#statistics/' + hashStr + '/namespace/-';
            $("#allStatsLinkNamespaces").attr("href", newTabUrl);

            newTabUrl = '#statistics/' + hashStr + '/namespace/' + window.AMCGLOBALS.pageSpecific.selectedNamespace;
            $("#allStatsLinkSpecificNamespace").attr("href", newTabUrl);

            newTabUrl = '#statistics/'+hashStr+'/xdr/'+window.AMCGLOBALS.persistent.xdrPort;
            $("#allStatsLinkXDR").attr("href", newTabUrl);
        },
        updateAllStatsLinks: function(){
            var seedNodeStr = window.AMCGLOBALS.persistent.seedNode;
            var nodeListStr = '/nodelist/'+window.AMCGLOBALS.persistent.nodeList;
            var hashStr = seedNodeStr + nodeListStr;

            var newTabUrl = '';

            newTabUrl = '#statistics/' + hashStr + '/nodes';
            $("#allStatsLinkNodes").attr("href", newTabUrl);

            newTabUrl = '#statistics/' + hashStr + '/namespace/' + (window.AMCGLOBALS.pageSpecific.selectedNamespace || "-");
            $("#allStatsLinkNamespaces").attr("href", newTabUrl);
        },
        setDefUrl: function(){
            var hashStr = window.AMCGLOBALS.activePage + "/" + window.AMCGLOBALS.persistent.seedNode ;
            if(window.AMCGLOBALS.persistent.selectedNodesStr !== null){
                hashStr += '/nodelist/' + window.AMCGLOBALS.persistent.selectedNodesStr;
            }else{
                hashStr += '/nodelist/no-nodes-selected';
            }
            hashStr +=  "/" + window.AMCGLOBALS.persistent.showAttributesFor;
            if(window.AMCGLOBALS.persistent.showAttributesFor === 'namespace'){
                if(window.AMCGLOBALS.persistent.namespaceName !== null){
                    hashStr = hashStr + '/'+window.AMCGLOBALS.persistent.namespaceName;
                }
            }
            window.location.hash = hashStr;
        },
        setStatUrl: function(){
            window.AMCGLOBALS.persistent.selectedNodesStr = window.AMCGLOBALS.persistent.selectedNodes.toString();
            var hashStr = window.AMCGLOBALS.activePage + "/" +  window.AMCGLOBALS.persistent.seedNode + '/nodelist/' + window.AMCGLOBALS.persistent.selectedNodesStr +"/" + window.AMCGLOBALS.persistent.showAttributesFor;

            if(window.AMCGLOBALS.persistent.showAttributesFor === 'namespace'){
                if(window.AMCGLOBALS.persistent.namespaceName !== null){
                    hashStr = hashStr + '/'+window.AMCGLOBALS.persistent.namespaceName;
                }
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'xdr'){
                hashStr = hashStr +'/'+window.AMCGLOBALS.persistent.xdrPort;
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'sindex'){
                if(window.AMCGLOBALS.persistent.namespaceName !== null){
                    hashStr = hashStr + '/'+window.AMCGLOBALS.persistent.namespaceName;
                }
                if(window.AMCGLOBALS.persistent.indexName !== null){
                    hashStr = hashStr + '/'+window.AMCGLOBALS.persistent.indexName;
                }
            }
            window.location.hash = hashStr;
        },
        setSeedNodeDialogValues: function(address){
            if(address.indexOf(",") === -1){
                address = /(.*):(\d+)/.exec(address).slice(1,3);
            } else{
                address = address.split(",");
            }

            $("#ip_dialog").val(address[0]);
            $("#port_dialog").val(address[1]);
            return address;
        },
        checkRadioButton: function(value){
            $('input:radio[name="attribute-radio"][value="'+value+'"]').prop('checked', true);
        },
        setIfDefined: function(desti, available){
            var source;
            if (typeof desti !== 'undefined') {
                source = desti;
            }else if(typeof available !== 'undefined'){
                source = available;
            }else {
                source = null;
            }
            return source;
        },

        setAndValidateXdrPort: function(xdrPort){
            if(!Util.validatePort(xdrPort)){
                xdrPort = '3004';
            }
            return xdrPort;
        },
        validatePort:function(port){
            var portRegex = /^\d{1,5}$/;
            if (typeof port === 'undefined' || !$.trim(port) || port.match(portRegex) === null || port > 65535) {
                $("#error_message").text("Invalid Port number");
                return false;
            }else{
                return true;
            }
        },
        isBelowVersion3: function(build){

            try{
                var version = +build.substr(0,1);
                var isOld = false;
                if(version < 3){
                    isOld = true;
                }
                return isOld;
            }catch(e){
                console.log(e);
                return true;
            }
        },
        displayOldVersionMsg: function(container,className){
            $(container).empty();
            if(typeof className === 'undefined'){
                className = "old-version-msg";
            }

            var oldVersionMsgHtml = '<div class="'+ className +'">This feature is available in Aerospike 3.0 onwards</div>';
            $(container).html(oldVersionMsgHtml);
        },
        initAlertDropdown: function(){
            var that = this;
            var container = $('#alerts-notify');
            $(document).mouseup(function (e){
                if (!container.is(e.target) && container.has(e.target).length === 0){
                        $('#alerts-notify .alert-notify-dropdown').hide();
                        $('#alerts-notify .alert-notify-button.enabled').removeClass('enabled');
                }
            });
            $('#AlertDropdownButton').on('click',function(){
                var enabled = ($('#alerts-notify .alert-notify-button.enabled')).length > 0 ? true : false;
                if(enabled){
                    $('#alerts-notify .alert-notify-dropdown').hide();
                    $('#alerts-notify .alert-notify-button.enabled').removeClass('enabled');
                }else{
                    $('#alerts-notify .alert-notify-dropdown').show();
                    $('#alerts-notify .alert-notify-button').addClass('enabled');
                    $('#noty_topCenter_layout_container').remove();

                    var shownAlerts = that.getCookie("shownAlerts") || "";

                    var liList = $('.alert-notify-li');
                    for(var i=0;i<liList.length;i++){
                        if(shownAlerts.indexOf($(liList[i]).attr('name')) == -1)
                            shownAlerts += ($(liList[i]).attr('name')) + ";" ;
                    }
                    that.setCookie("shownAlerts",shownAlerts,30, "/");
                }
                $('.alert-notify-li').addClass("alert-notify-shown");
                $("#alerts-notify .alert-notify-count").css("display","none");
                $("#alerts-notify .alert-notify-count").html("0");

            });

        },

        setCookie : function(c_name,value,exMinutes,path){
                var exdate=new Date();
                exdate.setDate(exdate.getTime() + exMinutes*60000);
                var c_value=escape(value) + ((exMinutes==null) ? "" : "; expires="+exdate.toUTCString());
                c_value= c_value + ((path == null) ? "" : "; path=" + path);
                document.cookie=c_name + "=" + c_value;
        },

        getCookie : function(c_name){
                var c_value = document.cookie;
                var c_start = c_value.indexOf(" " + c_name + "=");
                if (c_start == -1){
                        c_start = c_value.indexOf(c_name + "=");
                }
                if (c_start == -1) {
                        c_value = null;
                } else {
                        c_start = c_value.indexOf("=", c_start) + 1;
                        var c_end = c_value.indexOf(";", c_start);
                        if (c_end == -1) {
                                c_end = c_value.length;
                        }
                        c_value = unescape(c_value.substring(c_start,c_end));
                }
                return c_value;
        },
        setUpdateInterval: function(globalUpdateInterval){

            if(Util.isMobile.any()){ //Check for mobile or resetting to default if undefined
                globalUpdateInterval = 10;
            } else if(typeof globalUpdateInterval === 'undefined'){
                globalUpdateInterval = 5;
            }

            globalUpdateInterval *= 1000;

            var statsUpdateInterval = Util.isMobile.any() ? 10000 : AppConfig.updateInterval['stat'];
            var latencyUpdateInterval = AppConfig.updateInterval['latency'];
            AppConfig.updateInterval = {
                'cluster': globalUpdateInterval,
                'jobs': globalUpdateInterval,
                'alerts': globalUpdateInterval,
                'throughput': globalUpdateInterval,
                'nodes': globalUpdateInterval,
                'xdr': globalUpdateInterval,
                'namespaces': globalUpdateInterval,
                'latency': latencyUpdateInterval,
                'stat': statsUpdateInterval,
                'backup': globalUpdateInterval,
                'restore': globalUpdateInterval,
                'def': 10000
            };

            window.AMCGLOBALS.persistent.updateInterval = globalUpdateInterval;
            $('#updateTimeIntervalInput').removeAttr("disabled");
            $('#updateTimeIntervalInput').val(globalUpdateInterval/1000);
            if(AMCGLOBALS.activePage === "dashboard")
                Util.updateSelectHistory(globalUpdateInterval/1000);
        },
        updateSelectHistory: function(multiplier){
            var selectHistoryInnerHtml = '';
            selectHistoryInnerHtml += Util.createSelectHistoryOption(30, multiplier);
            selectHistoryInnerHtml += Util.createSelectHistoryOption(60, multiplier);
            selectHistoryInnerHtml += Util.createSelectHistoryOption(600, multiplier);
            selectHistoryInnerHtml += Util.createSelectHistoryOption(900, multiplier);
            selectHistoryInnerHtml += Util.createSelectHistoryOption(1800, multiplier);
            $(AppConfig.throughput.historySelect).html(selectHistoryInnerHtml);
            $(AppConfig.throughput.historySelect).find("option[value='" + window.AMCGLOBALS.persistent.snapshotTime + "']").prop('selected', true);
        },
        createSelectHistoryOption: function(value, multiplier){
            var secondsAndStr = Util.secToString(value);
            var numberOfDataPoints = value;///multiplier;
            var optionHtml = '<option value="'+numberOfDataPoints+'">'+secondsAndStr[1]+'</option>';;
            return optionHtml;
        },

        initVerticleTabs: function(){
            var items = window.$('#v-nav>ul>li');
            var divs = window.$('#v-nav>div.tab-content');
            items.off("click").on("click",function () {
                var that = this;
                //remove previous class and add it to clicked tab
                if(!$(this).hasClass('current')){

                    if( items.filter(".current").length > 0 ){
                        divs.eq(items.index(items.filter(".current"))).slideUp(100);
                    }

                    setTimeout(function(){
                        divs.eq(items.index($(that))).slideDown(100).trigger("createGrid");
                    }, 200);

                    items.removeClass('current').css('cursor','pointer');
                    $(this).addClass('current').css('cursor','default');
                    //hide all content divs and show current one
                }
               });

            Util.triggerManageFirstTab();
        },

        triggerManageFirstTab: function(){
            window.$("#v-nav ul li:not(.outside-assigned-roles):visible:first").trigger("click");
        },

        initAddNewNode :function(container){
            var that = this;
            var button = $(container);
            button.off("click");

            button.on("click", function(){


                if(typeof window.modal === 'undefined'){
                    window.modal = false;
                }

                function modal(){
                    if(!window.modal){
                        $("#credentialModalDialog").remove();
                        var htmlstr = '<div id="credentialModalDialog" class="NodeAddForm"> <div class="title-bar"> <div class="icon-seed-node-dialog img-icon-seed-id"></div>Add node entry in AMC</div>' +
                                '<div align="center">' +
                                    '<div class="user-popup-container">' +
                                        '<div class="user-popup">' +
                                            '<label style="width : 60px;">Node IP</label>' +
                                            '<input id="node_ip" class="input_textbox" name="node_ip" placeholder="Host Name or IP" title="Node IP" type="text" style="width : 170px; display : inline-block; margin-right : 5px;">' +
                                            '<input class="input_textbox" name="node_port" placeholder="PORT" value="3000" title="Node IP" type="number" style="width : 55px; display : inline-block;">' +
                                            '<br>' +
                                            '<div id="errorContainer" class="status_message error_message">Error : Invalid Node IP and PORT combination.</div>' +
                                        '</div>' +
                                        '<br>' +
                                        '<input id="credentialsModalSubmit" class="blue_btn btn" value="Add" type="submit">' +
                                        '<input id="modalCancel" class="clear_btn btn" value="Cancel" type="submit">' +
                                        '<br>' +
                                    '</div>' +
                                '</div>' +
                            '</div>';

                        $("body").append(htmlstr);

                        $("#credentialModalDialog").dialog({
                            dialogClass: "no-dialog-title",
                            modal: true,
                            width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                            closeOnEscape: false,
                            resizable: false,
                            create : function(){
                                $("#node_ip").focus();
                            }
                        });

                        Util.enterKeyEventForDialog("#credentialModalDialog", "#credentialsModalSubmit");

                        Util.numbericInputValidation("#credentialModalDialog input[name='node_port']", "#credentialsModalSubmit");

                        $("#credentialsModalSubmit").on("click",function(e){
                            e.stopPropagation();
                            var formdata = {};
                            var ip = $("#credentialModalDialog input[name='node_ip']").val();
                            var port = $("#credentialModalDialog input[name='node_port']").val();

                            if(ip !== "" && Util.validatePort(port)){
                                formdata.address = ip + ":" + port;
                                $("#credentialModalDialog").off("keyup");
                                $("#credentialModalDialog").dialog('destroy');
                                $("#credentialModalDialog").remove();


                                AjaxManager.sendRequest(AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + "/add_node",
                                        {data : formdata, type:AjaxManager.POST,async:false},
                                        function(response){
                                           var msg = '';
                                            var data = response;
                                            var alertType = '';
                                            if(data.status === 'success'){
                                                if(window.AMCGLOBALS.persistent.selectedNodes.length + window.AMCGLOBALS.pageSpecific.toBeSelected.length < AppConfig.maxStartNodes)
                                                    window.AMCGLOBALS.pageSpecific.toBeSelected.push(formdata.address);

                                                msg = 'Node ' + formdata.address + ' successfully added';
                                                alertType = 'green';
                                                Notification.toastNotification(alertType,msg,5000);
                                                //toastNotification.noty({text : msg, type : alertType, timeout : '5000'});
                                            }else if(data.status === 'failure') {
                                                if(typeof data.error !== 'undefined'){
                                                    msg = 'Cannot add node ' + formdata.address;
                                                    msg += "<br/>Server Message : " + data.error;
                                                    alertType = 'red';
                                                    Notification.toastNotification(alertType,msg,5000);
                                                //  noty({text : msg, type : alertType, timeout : '5000'});
                                                }
                                            } else {
                                                //Different cluster
                                                Util.showClusterDivertPopup(data.status);
                                            }
                                });

                                window.modal = false;
                            } else{
                                if($("#credentialModalDialog #errorContainer").css("display") === "block")
                                    $("#credentialModalDialog #errorContainer").toggle();
                                $("#credentialModalDialog #errorContainer").slideToggle();
                            }

                        });

                        $("#modalCancel").on("click",function(e){
                            e.stopPropagation();
                            $("#modalCancel").off("click");
                            $("#credentialsModalSubmit").off("click");
                            $("#credentialModalDialog").off("keyup");
                            $("#credentialModalDialog").dialog('destroy');
                            $("#credentialModalDialog").remove();

                            window.modal = false;
                        });
                    } else{
                        setTimeout(function(){ modal(); }, 1000);
                    }
                }
                modal();
            });
        },

        enterKeyEventForDialog: function(container, btn){
            $(container).off("keyup").on("keyup",function(e) {
                if (e.keyCode === 13) {
                    $(btn).trigger('click');
                }
            });
        },

        showClusterDivertPopup: function(incomingAlert){

            var that = this;
            var start = incomingAlert.indexOf('<strong>') + 8;
            var len = incomingAlert.indexOf('</strong>') - start;
            var nodeAddress = incomingAlert.substr(start, len);

            if(typeof window.modal === 'undefined'){
                    window.modal = false;
            }

            function modal(){
                if(!window.modal){

                    if($("#clusterDivertDialog").closest('.ui-dialog').is(':visible')){
                        $("#clusterDivertDialog").off("click keyup").dialog('destroy').remove();
                    }

                    var htmlstr = '<div id="clusterDivertDialog" class="divertDialog"> <div class="title-bar"> <div class="icon-seed-node-dialog img-icon-seed-id"></div>Cluster Mismatch</div>' +
                                '<div align="center">' +
                                    '<div class="user-popup">' +
                                        '<span class="modalStatement">' + incomingAlert + '</span>' +
                                        '<br>' +
                                        '<br/>' +
                                        "<span class='modalStatement'>Do you want to monitor it in a new tab?</span>" +
                                        '<br/>' +
                                        '</br/>' +
                                        '<input id="modalSubmit" class="blue_btn btn" value="Yes" type="submit">' +
                                        '<input id="modalCancel" class="clear_btn btn" value="Cancel" type="submit">' +
                                        '<br>' +
                                    '</div>' +
                                '</div>' +
                            '</div>';

                    $("body").append(htmlstr);

                    $("#clusterDivertDialog").dialog({
                        dialogClass: "no-dialog-title",
                        modal: true,
                        width:(innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                        closeOnEscape: false,
                        resizable: false
                    });

                    Util.enterKeyEventForDialog("#clusterDivertDialog", "#modalSubmit");

                    $("#modalSubmit").on("click",function(e){
                        e.stopPropagation();
                        $("#clusterDivertDialog").off("click keyup").dialog('destroy').remove();

                        window.open(window.location.origin + "/#/" + nodeAddress,'_blank');
                        window.modal = false;
                    });

                    $("#modalCancel").on("click",function(e){
                        e.stopPropagation();
                        $("#modalCancel").off("click");
                        $("#clusterDivertDialog").off("click keyup").dialog('destroy').remove();

                        window.modal = false;
                    });
                } else{
                    setTimeout(function(){ modal(); }, 1000);
                }
            }
            modal();

        },

        clusterIDReset : function(){
            Util.pauseAllActivePollers(false, true);
            Notification.toastNotification("red","Cluster not available! Cluster removed from current session", false);
            window.$(document).trigger("app:refreshGlobal");
            window.location.hash = "dashboard";
        },

        unauthorizedAccessAction : function(){
            Notification.toastNotification("red","Unauthorized Access");
        },

        renderTemplate : function(template){
            var renderedString = "";

            if(_.isArray(template)){
                for(var i=0; i<template.length; i++){
                    renderedString += Util.renderTemplate(template[i]);
                }
            } else if(_.isObject(template)){
                var templateRenderer = null;
                if(template.templateId === "custom"){
                    templateRenderer = _.template(template.template);
                } else{
                    templateRenderer = _.template($("#" + template.templateId).text());
                }

                _.each(template,function(value, key, list){
                    if( _.isObject(value) || _.isArray(value) ){
                        template[key] = Util.renderTemplate(value);
                    }
                });

                console.info(template);

                renderedString += templateRenderer(template);
            } else if( _.isString(template)){
                renderedString += template;
            }

            return renderedString;
        },

        showModalDialog : function(DOM, modalSettings, submit, cancel){
          modal.showModalDialog(DOM, modalSettings, submit, cancel);
        },

        hideModalDialog : function(){
          modal.hideModalDialog();
        },

        startCluster : function(page, callback){

//             if(ServiceManager.isSecurityEnable() && !ServiceManager.isUserHasModuleAccess(page)){
//                 noty({text : "You don't have access to this module, Going back to home page.",
//                     type : 'red', layout: "center", timeout: 2000});
//                 UserManager.showUserHomePage();
//                 return;
//             }

            Util.initMobileOps();

            $("#wrap").removeClass("fullScreen");
            $("#headerButtonsContainer").fadeIn(200);

            if(window.AMCGLOBALS.activePageModel !== null && (window.AMCGLOBALS.activePage !== page || !window.AMCGLOBALS.clusterInitiated)){
                Poller.reset();
                var poller = Poller.get(window.AMCGLOBALS.persistent.models.alertModel, AppConfig.pollerOptions(AppConfig.updateInterval['alerts']));
                if(!poller.active()){
                    poller.off("success").on('success', window.AMCGLOBALS.persistent.models.alertModel.fetchSuccess);
                    poller.off("error").on('error', window.AMCGLOBALS.persistent.models.alertModel.fetchError);
                    poller.start();
                }
                window.$.event.trigger("view:Destroy",window.AMCGLOBALS.activePage);
                delete window.AMCGLOBALS.activePageModel;
                delete window.AMCGLOBALS.pageSpecific;
                window.AMCGLOBALS.pageSpecific = {};
                $("#tabListContainer a").removeAttr("href");
                window.AMCGLOBALS.currentCID++;
                window.$(document).off("view:Destroy");
            }

            if(page === "definitions"){
                $("#SelectNodesButton").fadeOut();
            } else{
                $("#SelectNodesButton").fadeIn();
            }

            if(page === "admin-console"){
                page = "configs";
            }

            var CID = window.AMCGLOBALS.currentCID;

            require(["models/" + page + "/clustermodel"], function(ClusterModel){
                if(CID == window.AMCGLOBALS.currentCID){
                    function startCluster(){
                        try{
                            Util.setEnviromentSetupUI();
                            AMCGLOBALS.pageSpecific.GlobalPollingActive = true;
                            Util.initSelectNodesToggling('.title-bar');
                            window.AMCGLOBALS.activePageModel = new ClusterModel({"update_interval" : 5});
                            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['cluster']);
                            Util.initPoller(window.AMCGLOBALS.activePageModel, polOptions).start();
                            Util.BlockAccessToInacessibleModules();
                            if(typeof callback !== 'undefined'){
                                callback();
                            }
                        } catch(e){
                            console.error(e);
                        }
                    }

                    if((window.AMCGLOBALS.activePage !== page && !(window.AMCGLOBALS.activePage === 'admin-console' && page === 'configs')) || !window.AMCGLOBALS.clusterInitiated){
                        window.AMCGLOBALS.clusterInitiated = true;
                        var mainContainer = $("#mainContainer");

                        window.AMCGLOBALS.activePage = page;

                        if(page === "configs"){
                            window.AMCGLOBALS.activePage = "admin-console";
                        }

                        mainContainer.attr("class","container_16 main-container " + window.AMCGLOBALS.activePage);
                        $("body").scrollTop(0);

                        mainContainer.fadeOut(100,function(){
                            mainContainer.empty();
                            Notification.cleanUp();
                            mainContainer.html($("#" + page).text()).ready(function(){
                                mainContainer.fadeIn(100,function(){
                                    ServiceManager.showComponentsInActivePage(window.AMCGLOBALS.activePage);
                                    startCluster();
                                    if(Util.isMobile.iOS()){
                                        Util.handleIOSScroll("#wrap");
                                    }
                                    if(Util.isMobile.any()){
                                        Util.setClosedState();
                                    }
                                });
                            });
                        });
                    }
                }
            });
        },

        createConstant : function(parentObject, propertyName,constantValue){
            Object.defineProperty( parentObject, propertyName, {
                writable: false,
                enumerable: false,
                configurable: false,
                value : constantValue
            });
        },

        mainChartPreProcessor : function(data){
            for(var i = data.length - 1; i >= 0 ; i--){
                if(data[i].title.indexOf("Total Ops") !== -1){
                    data[i].disabled = false;
                    break;
                }
            }
            return data;
        },

        isMobile : {
            Android: function() {
                return navigator.userAgent.match(/Android/i);
            },
            BlackBerry: function() {
                return navigator.userAgent.match(/BlackBerry/i);
            },
            iOS: function() {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i);
            },
            Opera: function() {
                return navigator.userAgent.match(/Opera Mini/i);
            },
            Windows: function() {
                return navigator.userAgent.match(/IEMobile/i);
            },
            any: function() {
                return (Util.isMobile.Android() || Util.isMobile.BlackBerry() || Util.isMobile.iOS() || Util.isMobile.Opera() || Util.isMobile.Windows());
            }
        },

        initMobileOps : function(){
            $("#mainContainerTouchPanel").remove();
//             if (window.innerWidth <= 755) {
//                 $("#mainContainer").css("margin-left", "0px").css("margin-right", "0px");
//                 $("#tabListContainer").removeClass("open").find("ul").hide();
//                 $("#headerButtonsContainer").removeClass("open").find("ul").hide();
//             } else {
//                 $("#tabListContainer ul").show();
//                 $("#headerButtonsContainer ul").show();
//             }

            if(Util.isMobile.any()){
                window.jQuery.fx.off = true;
                $(".header-container").css("position", "relative");
                $(".main-container").css("padding-top", 0);
                $(".footer-container").css("position", "relative");

            }
        },

        initGlobalEvents : function(){
            if(Util.isMobile.any()){
                $(document).on("touchstart touchmove touchend", function(){
                    $(".tooltip").add(".bubble.container").remove();
                });


                /*Style Rules Injection for mobile*/
                $("#mobileStyleInject").remove();
                $("head")
                .append(
                    "<style id='mobileStyleInject'>"+
                        "#nodesLatencyChartsContainer .sub-title-bar:not(.selected), .dashboard .title-bar:not(.cluster_overview_title){"+
                            "border-radius : 5px;"+
                        "}"+
                        "#nodesLatencyChartsContainer .box-container,   .dashboard .box-container:not(.cluster_overview_body){"+
                            "display: none;"+
                        "}"+
                    "</style>"
                );

                if(Util.isMobile.iOS()){
                    Util.enableTouchListener();
                }
            }

            $(document).on("click scroll mousewheel", function(){
                $(".tooltip").add(".bubble.container").remove();
            });

        },

        setClosedState : function(){
            $("#nodesLatencyChartsContainer .sub-title-bar:not(.selected), .dashboard .title-bar:not(.cluster_overview_title)")
                .trigger("")
                .addClass("closed")
                .find(".toggle-to-state")
                .text("(Show)");
        },

        enableTouchListener: function(){
            var ongoingTouches = new Array();

            function copyTouch(touchEvt){
                var touch = {};
                for(var prop in touchEvt){
                    touch[prop] = touchEvt[prop];
                }
                return {id : touchEvt.identifier, evt: touch};
            }

            function handleStart(evt) {
              //evt.preventDefault();
              var touches = evt.touches;
              for (var i=0; i < touches.length; i++) {
                var touchCopy = copyTouch(touches[i])
                ongoingTouches[touchCopy.id] = touchCopy.evt;
              }
            }

            function handleMove(evt) {
              //evt.preventDefault();
              var touches = evt.changedTouches;
              for (var i=0; i < touches.length; i++) {
                var idx = ongoingTouches[touches[i].identifier] != null ? touches[i].identifier : -1;
                if(idx >= 0) {
                  var dx = touches[i].clientX - ongoingTouches[idx].clientX;
                  var dy = touches[i].clientY - ongoingTouches[idx].clientY;

                  if(dx === 0){
                      window.$(document).trigger("verticalSwipe", [evt, dy, (dy > 0? "down" : "up")]);
                  } else{
                      var div = dy/dx;
                      if(Math.abs(div) < 1){
                          window.$(document).trigger("horizontalSwipe", [evt, dx, (dx > 0? "right" : "left")]);
                      } else{
                          window.$(document).trigger("verticalSwipe", [evt, dy, (dy > 0? "down" : "up")]);
                      }
                  }

                  var touchCopy = copyTouch(touches[i]);
                  ongoingTouches.splice(idx, 1, touchCopy.evt);
                } else {
                  console.log("can't figure out which touch to continue");
                }
              }
            }

            function handleEnd(evt) {
              //evt.preventDefault();
              var touches = evt.changedTouches;

              for (var i=0; i < touches.length; i++) {
                 var idx = ongoingTouches[touches[i].identifier] != null ? touches[i].identifier : -1;

                if(idx >= 0) {
                  ongoingTouches.splice(idx, 1);
                } else {
                  console.log("can't figure out which touch to end");
                }
              }
            }

            (function(){
              document.addEventListener("touchstart", handleStart, false);
              document.addEventListener("touchend", handleEnd, false);
              // document.addEventListener("touchcancel", handleCancel, false);
              document.addEventListener("touchleave", handleEnd, false);
              document.addEventListener("touchmove", handleMove, false);
              console.log("initialized.");
            }).call();
        },

        handleIOSScroll: function(containerSelector){
            window.$(document).off("verticalSwipe").on("verticalSwipe", function(event, originalEvent, delta, direction){
                var avoidOn = $(".ui-dialog, .overlay");
                if(!avoidOn.is(containerSelector) && avoidOn.find(containerSelector).length === 0){
                    originalEvent.preventDefault();
                    var container = $(containerSelector);
                    container.scrollTop(container.scrollTop() - delta);
                }
            });
        },

        updateModelsImmediately: function(){
            Util.pauseAllActivePollers(false);
            Util.resumeAllActivePollers(false);
        },

        pauseAllActivePollers: function(avoidBasePoller, noResume) {
            AMCGLOBALS.pageSpecific.noResume = noResume || false;

            if(AMCGLOBALS.pageSpecific.GlobalPollingActive == null || AMCGLOBALS.pageSpecific.GlobalPollingActive){
                AMCGLOBALS.pageSpecific.activePoller = _.filter(Poller.pollerList, function(poller) {
                    return poller.active();
                });
                if (avoidBasePoller) {
                    var basePoller = _.filter(AMCGLOBALS.pageSpecific.activePoller, function(poller){
                        return poller.model === AMCGLOBALS.persistent.models.alertModel;
                    });
                    AMCGLOBALS.pageSpecific.activePoller = _.difference(AMCGLOBALS.pageSpecific.activePoller, basePoller);
                }
                _.each(AMCGLOBALS.pageSpecific.activePoller, function(poller) {
                    poller.stop();
                });
                AMCGLOBALS.pageSpecific.GlobalPollingActive = false;
                document.dispatchEvent(new CustomEvent("pollerPaused"));
            }
        },

        resumeAllActivePollers : function(forceResume){
            if(forceResume === true) AMCGLOBALS.pageSpecific.noResume = false;

            if(AMCGLOBALS.pageSpecific.GlobalPollingActive != null && !AMCGLOBALS.pageSpecific.GlobalPollingActive && AMCGLOBALS.pageSpecific.activePoller != null && !AMCGLOBALS.pageSpecific.noResume){
                _.each(AMCGLOBALS.pageSpecific.activePoller, function(poller){
                    poller.start();
                });

                delete AMCGLOBALS.pageSpecific.activePoller;
                AMCGLOBALS.pageSpecific.GlobalPollingActive = true;
                document.dispatchEvent(new CustomEvent("pollerResume"));
            }
        },

        showAMCNEErrorAlert : function(){
            if(!Util.isToastMessegeVisible){
                Util.toastMsg = noty({text : 'Connection lost with the server', type : 'red', layout: "center", timeout: false, modal:true,closeWith:[]});
                Util.isToastMessegeVisible = true;
            }

        },
        hideAMCNEErrorAlert : function(){
            if(Util.toastMsg){

                if ($("#" + Util.toastMsg.options.id).parent()) {
                    $("#" + Util.toastMsg.options.id).parent().remove();
                }
                Util.toastMsg.close();
                Util.isToastMessegeVisible = false;

            }

        },

        getSeedNodeFromAddress:function(){
            var loc = window.location.hash;
            var start = loc.indexOf("/",loc.indexOf("#"));
            var seed = null;
            if(start != -1){
                var end = loc.indexOf("/",start + 1);
                if(end == -1){
                    end = loc.length;
                }
                seed = loc.substr(start + 1, end - start - 1);
            }
            return seed;
        },

        checkVisibilityAndCall : function(view, callback, flow, scroller){

            if(!view.visibilityCheck){
                view.visibilityCheck = function(){
                    if( (!view.element || view.element.length === 0) && (view.element = $(view.el)).length === 0 ){
                        return true;
                    }
                    var viewBox = view.element.offset();
                    viewBox.bottom = viewBox.top;
                    viewBox.right = viewBox.left;
                    view.element.each(function(index, el){
                        var element = $(el);
                        viewBox.bottom += (+element.css("height").split("px")[0]);
                        viewBox.right += (+element.css("width").split("px")[0] );
                    });

                    if( (!flow || flow === "both") && (viewBox.bottom > 0 && viewBox.top < window.innerHeight) && (viewBox.right > 0  && viewBox.left < window.innerWidth) ){
                        return true;
                    } else if( ( flow === "vertical" && (viewBox.bottom > 0 && viewBox.top < window.innerHeight) ) ||
                             ( ( flow === "horizontal") && (viewBox.right > 0  && viewBox.left < window.innerWidth) ) ){
                        return true;
                    }

                    return false;
                }
            }

            if(!view.callOnSuccessAndUnbind){
                clearInterval((view.scrollStopTimer = view.scrollStopTimer || null));
                view.callOnSuccessAndUnbind = function(){
                    clearInterval( view.scrollStopTimer );
                    view.scrollStopTimer = setTimeout( function(){
                        if(!view.element.is(":visible")){
                            //console.log(view.el + " " + "unbind");
                            $("#wrap").off("scroll", view.callOnSuccessAndUnbind);
                        } else if(view.visibilityCheck()){
                            //console.log(view.el + " " + "update and unbind");
                            callback.apply(view);
                            $("#wrap").off("scroll", view.callOnSuccessAndUnbind);
                        }
                    }, 200);
                }
            }

            delete view.element;

            if(view.visibilityCheck()){
                //console.log(view.el + " " + "update");
                callback.apply(view);
            }else {
                //console.log(view.el + " " + "bind");
                $(scroller || "#wrap").off("scroll", view.callOnSuccessAndUnbind).on("scroll", view.callOnSuccessAndUnbind);
            }
        },

        updateSelectAllToggle: function(){
            var container = $("#nodeListSelectable"), button = $("#selectAllToggle");
            if(container.find("li.ui-selected").length === 0){
                button.attr("class", "selectedNone").attr("title", "Select All Nodes");
            } else if(container.find("li").not(".ui-selected").length === 0){
                button.attr("class", "selectedAll").attr("title", "Unselect All Nodes");
            } else{
                button.attr("class", "selectedFew").attr("title", "Unselect All Nodes");
            }
        },

        showUserSessionInvalidateError : function(seedNode){
            var that =this;
            require(["helper/authmanager"], function(AuthManager){
                seedNode = (typeof seedNode !== "undefined") ? seedNode : window.AMCGLOBALS.persistent.seedNode;
                AuthManager.executeLogoutRequest(window.AMCGLOBALS.persistent.clusterID);
                Util.pauseAllActivePollers(false, true);
                window.$.event.trigger("view:Destroy",window.AMCGLOBALS.activePage);
                $("#mainContainer").empty();
                AuthManager.showUserLoginPopup({
                        "seedNode" : seedNode,
                        "modalClass" : "session-error",
                        "title" : "Invalid Session!"
                    },function(){
                    window.$.event.trigger({type: "app:refreshGlobal"});
                    window.AMCGLOBALS.clusterInitiated = false;
                    window.location.hash = "dashboard/" + seedNode;
                },true);
            });
         },

         updateClusterName : function(event){
            var seedNode = null, clusterName = null;
            var target = $(event.target).parent().parent();

            function updateName(seedNode, clusterName){
                if(seedNode != null && seedNode != "" && clusterName != null && clusterName != ""){
                    AjaxManager.sendRequest(
                        AppConfig.baseUrl + "get-cluster-id",
                        { async: true, type:'POST', data : {seed_node : seedNode, cluster_name : clusterName} },
                        function(response){
                            if(response.status === "success"){
                                target.find("span.cluster_info").text(clusterName);
                                if(response["cluster_id"] === window.AMCGLOBALS.persistent.clusterID)
                                    $("#clusterID .attribute-value").text(clusterName);
                            }
                        },
                        function(response){

                        }
                    );
                }
            }

            if(event == null){
                seedNode = window.AMCGLOBALS.persistent.seedNode;
                clusterName = clusterName;
                updateName(seedNode, clusterName);
            } else if(event.seedNode != null && event.clusterName != null){
                seedNode = event.seedNode.trim();
                clusterName = event.clusterName.trim();
                updateName(seedNode, clusterName);
            } else {
                // seedNode = target.attr("data-seednode") || "";
                seedNode = target.attr("data-seednode") || window.AMCGLOBALS.persistent.seedNode || "";
                clusterName = target.attr("data-clustername") || "";
                openClusterDialog(
                    {
                        connectButtonValue : 'Set',
                        cancelButton : 'enable',
                        seedNode : target.attr('data-seednode'),
                        postDialog : function(){
                            $("#ip_dialog").attr("disabled", "disabled").val(seedNode.split(":")[0]);
                            $("#port_dialog").attr("disabled", "disabled").val(seedNode.split(":")[1]);
                            $("#cluster_name_dialog").val(clusterName).attr("placeholder","Cluster Label").focus();
                        },
                        connect : function(){
                            var ipAddress = $("#ip_dialog").removeAttr("disabled").val().trim();
                            var portNumber = $("#port_dialog").removeAttr("disabled").val().trim();
                            seedNode = ipAddress + ":" + portNumber;
                            clusterName = $("#cluster_name_dialog").val().trim();
                            updateName(seedNode, clusterName);
                            $("#ModalWrapper").remove();
                        }
                    }
                );
            }
         },

         removeClusterFromSession : function(event){
            var clusterId = window.AMCGLOBALS.persistent.clusterID;

            if(clusterId != null && clusterId !== ""){
                AjaxManager.sendRequest(AppConfig.baseUrl + clusterId + AppConfig.urls.REMOVE_CLUSTER, { async: true, type:'POST'}, function(response){
                    if(response.status === "success"){
                        for(var index in window.AMCGLOBALS.persistent.currentlyMonitoringCluster){
                            if(window.AMCGLOBALS.persistent.currentlyMonitoringCluster[index]["cluster_id"] === clusterId){
                                window.AMCGLOBALS.persistent.currentlyMonitoringCluster.splice(index,1);
                            }
                        }

                        if( window.AMCGLOBALS.persistent.currentlyMonitoringCluster.length === 0 ){
                            require(["helper/authmanager"], function(AuthManager){
                                AuthManager.executeLogoutRequest();

                                Util.pauseAllActivePollers(false, true);
                                window.$.event.trigger("view:Destroy",window.AMCGLOBALS.activePage);
                                window.AMCGLOBALS.persistent.seedNode = null;
                                window.location.hash = "";
                            });
                        } else {
                            var changeClusterBtn = $("#changeClusterButton");
                            if (changeClusterBtn !== null) {
                                changeClusterBtn.trigger("click");
                            }
                        }
                    }
                }, function(response){

                });
            }
         },

         updateCurrentlyMonitoringCluster : function(clusterList, displaySessionInfo, callback){

            function createClusterInfoHTML(monitoringCluster){

                var currentClusterDiv = "", currentClass = "";
                if(window.AMCGLOBALS.persistent.clusterID === monitoringCluster["cluster_id"]){
                    currentClusterDiv = "<div style='font-size: 0.8em;text-align:center;color:#65A4BE;width:100px;margin-left:auto;margin-right:auto;'>Current Cluster</div>";
                    currentClass = "current-cluster";
                }

                var html = "<div data-seednode='"+monitoringCluster["seed_node"]+"' " +
                           ( monitoringCluster["cluster_name"] != null ? ( "data-clustername='" + monitoringCluster["cluster_name"] + "'") : "") +
                           " class='"+ monitoringCluster["cluster_id"] + "' ";

                if(monitoringCluster["roles"] != null && monitoringCluster["roles"].length > 0) {
                    html += " data-roles='"+monitoringCluster["roles"]+"'";
                }

                html += ">";

                html += "<div style='float:right;'>";
                html += "<div class='cluster_button sprite edit' title='edit cluster label'></div>";
                html += "<div class='cluster_button sprite remove' title='remove cluster'></div>";

                html += "</div>";

                html += currentClusterDiv;

                var username = null;
                if(monitoringCluster["username"] == null && monitoringCluster["roles"] == null)
                    username = "[Non-Secured Cluster]";
                else
                    username = (monitoringCluster["username"] || "[Non-Secured Cluster]");

                html += "<span class='cluster_user'>" + username + "</span><br/>";

                html += "<span style='width : 55px; display : inline-block;'>Cluster : </span><span class='cluster_info'>" + (monitoringCluster["cluster_name"] || monitoringCluster["cluster_id"]) + "</span><br/>" +
                        "<span style='width : 55px; display : inline-block;'>Seed : </span><span class='cluster_seed'>" + monitoringCluster["seed_node"] + "</span><br/>" +
                        "</div>";

                var url = window.location.protocol + "//"+window.location.host + "/#dashboard/"+monitoringCluster["seed_node"];
                if(!(monitoringCluster["roles"] == null)){
                    url = UserManager.getUserHomePageByRoles(monitoringCluster["roles"])+"/"+monitoringCluster["seed_node"];
                }

                html = "<a class='cluster_link "+ monitoringCluster["cluster_id"] + " " + currentClass + "' href='" + url + "'>" + html + "</a>";

                return html;

             }

             function clusterSelectHandler(event){
                    if( $("#multiple-cluster-list-holder a.cluster_link div.cluster_button.edit").is(event.target) ){
                        event.preventDefault();

						//$(AppConfig.header.multipleClusterListContainer).fadeOut(0);
                    	$("#headerButtons .button.active").removeClass("active");
                        Util.updateClusterName(event);
                    // } else if( $("#multiple-cluster-list-holder a.cluster_link div.cluster_button.remove").is(event.target) ){
                    } else if( $("#renameClusterBtn").is(event.target) ){
                        $("#userMenuContainer").css("display", "none");
                        Util.updateClusterName(event);
                    } else if( $("#removeClusterBtn").is(event.target) ){
                        $("#userMenuContainer").css("display", "none");
                        event.preventDefault();
                        Util.removeClusterFromSession(event);
                    } else{
                        $("#userMenuContainer").css("display", "none");
						Util.closeRightPanel();
					}
                }

             function setEventListeners(container){
                $(container).off("click").on("click",clusterSelectHandler);
             }

             UserManager.getCurrentMonitoringCluster(function(response){
                 window.AMCGLOBALS.persistent.currentlyMonitoringCluster = clusterList = response || [];
                 $(AppConfig.header.multipleClusterListHolder).empty();
                 if( displaySessionInfo )
                    Util.displayCurrentSessionInfo();
                    setEventListeners("#removeClusterBtn");
                    setEventListeners("#renameClusterBtn");
                 /*if(clusterList && clusterList.length > 0) {
                     for(var clusterIndex in clusterList){
                         var html = createClusterInfoHTML(clusterList[clusterIndex]);
                         if(window.AMCGLOBALS.persistent.clusterID === clusterList[clusterIndex]["cluster_id"]){
                            $(AppConfig.header.multipleClusterListHolder).prepend(html);
                         } else {
                            $(AppConfig.header.multipleClusterListHolder).append(html);
                         }
                     }
                     setEventListeners("#multiple-cluster-list-holder a.cluster_link");
                 }*/
                 callback && callback(window.AMCGLOBALS.persistent.currentlyMonitoringCluster);
             },function(response){
                setEventListeners("#removeClusterBtn");
                setEventListeners("#renameClusterBtn");
                /* $(AppConfig.header.multipleClusterListHolder).empty();
                 if(clusterList && clusterList.length > 0) {
                     for(var clusterIndex in clusterList){
                         var html = createClusterInfoHTML(clusterList[clusterIndex]);
                         if(window.AMCGLOBALS.persistent.clusterID === clusterList[clusterIndex]["cluster_id"]){
                            $(AppConfig.header.multipleClusterListHolder).prepend(html);
                         } else {
                            $(AppConfig.header.multipleClusterListHolder).append(html);
                         }
                     }
                     setEventListeners("#multiple-cluster-list-holder a.cluster_link");
                 }*/
                 callback && callback([]);
             });
         },

		 showCurrentlyMonitoringCluster : function(modal, exitIfNoneExist, callback){
			 $(AppConfig.header.multipleClusterListHolder).empty();

			 function show(){
				 if(modal === true){
					$(AppConfig.header.multipleClusterListContainer).dialog({
						modal: true,
						resizable: false,
						dialogClass : "cluster-list-modal",
						width:(innerWidth < 400 ? "100%" : 400),
						closeOnEscape : false
					});
				 }
			 }

			 if(exitIfNoneExist){
			 	Util.updateCurrentlyMonitoringCluster(window.AMCGLOBALS.persistent.currentlyMonitoringCluster, false, function(response){
					if(response.length > 0){
						show();
						callback && callback(true);
					} else {
						callback && callback(false);
					}
				});
			 } else {
				Util.updateCurrentlyMonitoringCluster(window.AMCGLOBALS.persistent.currentlyMonitoringCluster, true);
				//$(AppConfig.header.multipleClusterListContainer).slideDown(200);
				callback && callback(true);
			 }
		 },

		 cleanAlerts : function(){
			 $("#alertNotifyList").empty();
         	 $("#alertNotifyList").append('<li class="alert-notify-no-alerts">No Alerts</li>');
         	 var alertNotifyCountEl = $("span.alert-notify-count");
         	 alertNotifyCountEl.html("0").css("display", "none");
             this.hideAMCNEErrorAlert();
		 },


        setGlobalClusterInfo: function(update){

            if(window.AMCGLOBALS.persistent.globalClusterInfo == null){
                window.AMCGLOBALS.persistent.globalClusterInfo = {};
            }

            if( update == null || _.isEmpty(window.AMCGLOBALS.persistent.globalClusterInfo) ){
                window.AMCGLOBALS.persistent.globalClusterInfo.GlobalInfoFetchInProcess = true;

                AjaxManager.sendRequest(AppConfig.baseUrl + AMCGLOBALS.persistent.clusterID, {cache : false},
                    function(response){
                        //success
                        if(response.error == null){
                            window.AMCGLOBALS.persistent.globalClusterInfo.clusters = response;
                            window.AMCGLOBALS.persistent.globalClusterInfo.GlobalInfoFetchInProcess = false;
                        }
                    });

                AjaxManager.sendRequest( AppConfig.baseUrl + AMCGLOBALS.persistent.clusterID + AppConfig.cluster.resourceUrl, {cache : false},
                    function(response){
                        //success
                        if(response.error == null){
                            window.AMCGLOBALS.persistent.globalClusterInfo.basic = response;
                            window.AMCGLOBALS.persistent.globalClusterInfo.GlobalInfoFetchInProcess = false;
                        }
                    });
            } else if(window.AMCGLOBALS.persistent.globalClusterInfo.GlobalInfoFetchInProcess === false){
                window.AMCGLOBALS.persistent.globalClusterInfo[update.type] = _.pick(update.attributes, _.keys(window.AMCGLOBALS.persistent.globalClusterInfo[update.type]) );
            }
        },

        setGlobalClusterInfoInModel: function(type, model){
            if(!!window.AMCGLOBALS.persistent.globalClusterInfo && window.AMCGLOBALS.persistent.globalClusterInfo[type] != null){
                model.set(window.AMCGLOBALS.persistent.globalClusterInfo[type]);
                return true;
            }

            return false;
        },

        displayCurrentSessionInfo : function(){
            var details = ( _.filter( window.AMCGLOBALS.persistent.currentlyMonitoringCluster, function(cluster){
                                return cluster["cluster_id"] === window.AMCGLOBALS.persistent.clusterID;
                            }) )[0] || {};

            var seed = details["seed_node"] || window.AMCGLOBALS.persistent.seedNode,
                clusterID = details["cluster_name"] || details["cluster_id"] || window.AMCGLOBALS.persistent.clusterID,
                user = details["username"] || "[Non-Secured Cluster]";

            $("#clusterSeed .attribute-value").text(seed);
            $("#clusterID .attribute-value").text(clusterID);
            $("#clusterUser .attribute-value").text(user);

            if(!$("#changeClusterButton").hasClass("active")){
                if(window.location.hash.indexOf("/") == -1){
                    $(AppConfig.header.subHeader).slideDown(0);
                }else {
                    $(AppConfig.header.subHeader).slideDown(500);
                }
            }
        },

        setGlobalEventListeners : function(){
            Util.numbericInputValidation("#updateTimeIntervalInput", '#setUpdateTimeInterval');
            //Util.numbericInputValidation("#logging_duration", '.activity-logger.log-start');
            $('#setUpdateTimeInterval').off("click").on('click',function(){
                $('#updateIntervalErrorMsg').hide();
                var postData = {};
                postData['update_interval'] =  +$('#updateTimeIntervalInput').val();
                if(!_.isNaN(postData['update_interval']) && postData['update_interval'] >= 1 && postData['update_interval'] <= 10 && postData['update_interval'] % 1 == 0){

                    AjaxManager.sendRequest(AppConfig.urls.SET_UPDATE_INTERVAL+"/"+window.AMCGLOBALS.persistent.clusterID,{type: AjaxManager.POST,data:postData},function(data){
                      if(data.status === 'success'){
                          Notification.toastNotification('green','Update interval changed successfully');
                        }else if(data.status === 'invalid'){
                            Notification.toastNotification('red', 'Error! Invalid update interval.', '5000');
                        } else{
                            Notification.toastNotification('red',
                            'Error! Update interval not changed. Unknown server error. Please check AMC log file for more details.', '5000');
                        }
                    },function(){
                        Notification.toastNotification('red','Can\'t connect to server');
                    });
                }else{
                    $('#updateIntervalErrorMsg').show(200);
                }

            });
			$('#setUpdateLocalTimeZoneInput').off("click").on('click',function(){
                Util.setCookie("useLocalTimeZone", $('#setUpdateLocalTimeZoneInput').is(':checked'), 43200, "/");
                Util.setTimezoneLabel();
			});

            $("#selectNodesGrid")
                .off("panel:activate").on("panel:activate", function(){
                    Util.selectSelectableElementList("#nodeListSelectable");
                    Util.updateSelectAllToggle();
                    $(this).addClass("active");
                })
                .off("panel:deactivate").on("panel:deactivate", function(){
                    $(this).removeClass("active");
                });

            $("#multiple-cluster-list-container")
                .off("panel:activate").on("panel:activate", function(){
                    $(AppConfig.header.multipleClusterListContainer).addClass("active");
                    if(!$("#wrap").hasClass('fullScreen'))
                        $("#wrap").addClass('fullScreen');

                    $("#rightPanelCloseButton").css('display', 'none');
                    if(window.location.hash.indexOf("/") == -1){
                        $(AppConfig.header.subHeader).slideUp(0);
                    }else{
                        $(AppConfig.header.subHeader).slideUp(200);
                    }

                    $("#rightPanel").removeClass("active");
                    //Util.showCurrentlyMonitoringCluster();
                    openMulticlusterView();
                })
                .off("panel:deactivate").on("panel:deactivate", function(){
                    $(AppConfig.header.multipleClusterListContainer).removeClass("active");
                    $(AppConfig.header.subHeader).slideDown(500);
                });

            $("#AMCSettings")
                .off("panel:activate").on("panel:activate", function(){
                    $(this).addClass("active");
                    $('#updateIntervalErrorMsg').hide(200);
                    $('#updateTimeIntervalInput').val(window.AMCGLOBALS.persistent.updateInterval/1000);
                    $('#setUpdateLocalTimeZoneInput').attr('checked', Util.useLocalTimezone());
                })
                .off("panel:deactivate").on("panel:deactivate", function(){
                    $(this).removeClass("active");
                });

            var AlertEmailInitialized = false;
            $("#AlertEmails")
                .off("panel:activate").on("panel:activate", function(){
                    $(this).addClass("active");
                    if(AlertEmailInitialized) {
                      return;
                    }

                    AlertEmailInitialized = true;
                    var model = new AlertEmailsModel();
                    var view = new AlertEmailsView({model: model});
                    view.render();
                    $('#email-container').html(view.el);
                })
                .off("panel:deactivate").on("panel:deactivate", function(){
                    $(this).removeClass("active");
                });

            $("#addAnotherClusterBtn").parent()
                .attr("href",/*window.location.protocol + "//"+window.location.host +*/ "#addcluster")
                .off("click")
                .on("click", function(event){
                    event.preventDefault();
                    //window.$(".button.active").trigger("click");
                    //window.$.event.trigger("view:multiclusterDestroy","Stop multicluster polling");

                    if(window.location.hash.indexOf("/") == -1){
                        addCluster(false);
                    }else{
                        addCluster(true);
                    }
                });

            $("#UserDropdownButton").off("click").on("click", function() {
                var container = $("#userLogoutButton");

                if ($("#userMenuContainer").css("display") === "none") {
                    $("#userMenuContainer").css('display', 'block');
                } else {
                    $("#userMenuContainer").css('display', 'none');
                }

                // $("#AlertDropdownButton .alert-notify-count").html("").css("display", "none");
            });

            // $("#logoutBtn").off("click").on("click", function() {
            //     console.log('logout button pressed!');
            //     logoutUser();
            // });

            $("#terminateSessionBtn").off("click").on("click", function() {
                terminateSession();
            });

            // $("#renameClusterBtn").off("click").on("click", function() {
            //     console.log('We are here!');
            //     if (window.AMCGLOBALS.persistent.currentlyMonitoringCluster !== null) {
            //         window.AMCGLOBALS.persistent.currentlyMonitoringCluster.cluster_name = "Renamed Cluster";
            //         Util.updateCurrentlyMonitoringCluster(window.AMCGLOBALS.persistent.currentlyMonitoringCluster, true);
            //     }
            // });


            $("#rightPanelButton").off("click").on("click", function(e){
                var button = $(this);
                var panel = $("#rightPanel");
                if(button.hasClass("active")){
                    $(".slide-out-button.active").trigger("click");
                    button.removeClass("active");
                    panel.removeClass("active");
                    /*to disable the close button*/
                    //$("#rightPanelCloseButton").css('display', 'none');
                    //$(".cluster-handling-buttons").css('display', 'none');
                } else {
                    button.addClass("active");
                    panel.addClass("active");
                    //$("#rightPanelCloseButton").css('display', 'block');
                    //$(".cluster-handling-buttons").css('display', 'block');
                }
            });

            $("#tabListContainer").off("click").on("click", function(e) {
                var button = $(this);
                if (button.hasClass("active")) {
                    button.removeClass("active");
                } else {
                    button.addClass("active");
                }
            });

//             $(document).off("mouseup:changecluster").on("mouseup:changecluster", function(tEvent, e) {
//                 var container = $(AppConfig.header.multipleClusterListContainer).add("#changeClusterButton").add(".ui-widget-overlay");
//                 if ((container.find(e.target)).length === 0 && !container.is(e.target) && !container.hasClass("ui-dialog-content")) {
//                     if ($(AppConfig.header.multipleClusterListContainer).css("display") === "block") {
//                         //$(AppConfig.header.multipleClusterListContainer).fadeOut(200);
//                         $("#headerButtons .button.active").removeClass("active");
//                     }
//                 }
//             });

            function panelResizeHandler() {
                $("#rightPanelSlideOut").css("width", (innerWidth - 240));
            }

            $("#rightPanel .slide-out-button").off("click").on("click", function(event){
                var button = $(this);
                var panel = $("#rightPanelSlideOut");
                if(button.hasClass("active")){
                    button.removeClass("active");

                    if (button.attr("data-for-id") != null) {
                        $("#" + button.attr("data-for-id")).trigger("panel:deactivate");
                    } else if (button.attr("data-on-document") != null) {
                        $(document).trigger(button.attr("data-on-document") + ":deactivate");
                    }

                    $("#wrap").removeClass("fullScreen");
                    window.$.event.trigger("view:multiclusterDestroy","Stop multicluster polling");

                    panel
                        .removeClass("active")
                        .css("width", 0);

                    window.removeEventListener("resize", panelResizeHandler,true);
                } else {
                    var panelAlreadyActive = panel.hasClass("active");
                    var timeout = 0;

                    button.parent().find("li.active").removeClass("active").each(function(index, indButton) {
                        if (indButton.getAttribute("data-for-id") != null) {
                            $("#" + indButton.getAttribute("data-for-id")).trigger("panel:deactivate");
                        } else if (indButton.getAttribute("data-on-document")) {
                            $(document).trigger(indButton.getAttribute("data-on-document") + ":deactivate");
                        }
                    });

                    $("#rightPanelSlideOut .overlay").removeClass("active");
                    panel.css("width", 0).removeClass("active");
                    window.removeEventListener("resize", panelResizeHandler,true);
                    button.addClass("active");

                    if(panelAlreadyActive){
                        timeout = 250;
                    }

                    setTimeout(function() {
                        if (button.attr("data-for-id") != null) {
                            panel.addClass("active").css("width", (innerWidth - 240));
                            window.addEventListener('resize', panelResizeHandler, true);
                            $("#" + button.attr("data-for-id")).trigger("panel:activate");
                        } else if (button.attr("data-on-document") != null) {
                            $(document).trigger(button.attr("data-on-document") + ":activate");
                        }
                    }, timeout);

                    $("#" + button.attr("data-for-id")).trigger("panel:activate");
                }
            });




            function bindButtonRelease(){
                Util.initMobileOps();

                $(document).off("mouseup touchstart");

                $(document).on("mouseup touchstart",function(event){
                    var target = $(event.target);
                    if( target.parents("svg").length == 0 && target.parents(".setup_overview").length == 0 && !target.is(".setup_overview") && !target.is(".cluster-overview svg")){
                        $(".tooltip").remove();
                    }
                });

                $(document).on("mouseup touchstart hidden", function(e){
                    if(e.button == 0 || e.type.indexOf("touch") !== -1 || e.type.indexOf("hidden") !== -1){
                        var target = $(e.target);

                        $(document).trigger("mouseup:alerts",[e]);

                        var container = $("#rightPanel").add("#rightPanelSlideOut").add("#rightPanelButton").add(".ui-dialog.ui-widget, .ui-widget-overlay.ui-front");
                        if( document.contains(e.target) &&
                            ((!(container.is(target) || container.has(target).length > 0) && $("#rightPanelButton").hasClass("active")) ||
                             $("#rightPanelCloseButton").is(target) || $("#multiClusterCloseBtn").is(target)) ){
                            Util.closeRightPanel();
                            $(document).trigger("mouseup:nodeselect",[e]).trigger("mouseup:changecluster",[e]).trigger("mouseup:user-setting",[e]);
                        }

                        // if (window.innerWidth <= 755) {
                        //     $(document).on("mouseup", function(event) {
                        //         if (event.button == 0) {
                        //             var target = $(event.target);
                        //             var containers = $("#tabListContainer").add("#headerButtonsContainer");

                        //             if (!containers.is(target)) {
                        //                 Util.initMobileOps();
                        //             }
                        //         }
                        //     });
                        // }
                    }
                });
            }

            function handler() {
                Util.initMobileOps();
                // if (window.innerWidth <= 755) {

                //     function mainContainerEventHandler() {
                //         if ($("#mainContainerTouchPanel").length == 0) {
                //             var mainContainer = $("#mainContainer");

                //             mainContainer.prepend("<div id='mainContainerTouchPanel' style='position: absolute; width: 100%; height: 100%'></div>");

                //             var touchPanel = mainContainer.find("#mainContainerTouchPanel");

                //             touchPanel.on("click touchstart touchmove", function(event) {
                //                 event.stopPropagation();
                //                 Util.initMobileOps();
                //                 touchPanel.remove();
                //             });
                //         }
                //     }


                //     $("#tabListContainer").off("click").on("click", function(event) {

                //         $("#headerButtonsContainer ul").hide();
                //         $("#headerButtonsContainer").removeClass("open");

                //         var list = $("#tabListContainer ul");
                //         var target = $(event.target);
                //         if (list.css("display") === "none" && target.is("#tabListContainer")) {
                //             mainContainerEventHandler();
                //             $(this).addClass("open");
                //             $("#mainContainer").animate({
                //                 marginLeft: "145px"
                //             }, 200, function() {
                //                 list.show();
                //             });
                //         } else {
                //             list.hide();
                //             $(this).removeClass("open");
                //             $("#mainContainerTouchPanel").remove();
                //             $("#mainContainer").animate({
                //                 marginLeft: "0px"
                //             }, 200);
                //         }

                //     });

                //     $("#headerButtonsContainer").off("click").on("click", function(event) {

                //         $("#tabListContainer ul").hide();
                //         $("#tabListContainer").removeClass("open");

                //         var list = $("#headerButtonsContainer ul");
                //         var target = $(event.target);
                //         if (list.css("display") === "none" && target.is("#headerButtonsContainer")) {
                //             mainContainerEventHandler();
                //             $(this).addClass("open");
                //             $("#mainContainer").animate({
                //                 marginLeft: "-145px"
                //             }, 200, function() {
                //                 list.show();
                //             });
                //         } else {
                //             list.hide();
                //             $(this).removeClass("open");
                //             $("#mainContainerTouchPanel").remove();
                //             $("#mainContainer").animate({
                //                 marginLeft: "0px"
                //             }, 200);
                //         }
                //     });
                // } else {
                //     $("#tabListContainer").off("click");
                //     $("#headerButtonsContainer").off("click");
                // }
                bindButtonRelease();
            }

            handler();

            window.addEventListener('resize', handler, true);

            $("#activityLogger .activity-logger.btn").off("click").on("click", function(event){
                var button = $(this);
                if(button.hasClass("log-start")){
                    Util.logger.start();
                } else if(button.hasClass("log-restart")){
                    Util.logger.restart();
                } else if(button.hasClass("log-stop")){
                    Util.logger.stop();
                }

            });
        },

        logger : {
                STATUS_ON : "ON",
                STATUS_RESTART : "RESTART",
                STATUS_OFF : "OFF",
                CLASS_ON : "success",
                CLASS_ERROR : "error",
                CLASS_OFF : "error",
                CLASS_RESTART : "error",
                SERVICE_URL : "debug",
                baseUrl : "/aerospike/service/",
                buttonContainer: $("#activityLogger"),
                DEFAULT_TIME : 10,

                record : {
                    startTimestamp : null,
                    clientTimestamp : null,
                    log : [],

                    stringify : function(){
                        var logText = "";

                        if(this.startTimestamp == null)
                            return "";

                        var timestampOffset = this.clientTimestamp - this.startTimestamp;
                        var timeNow = (new Date()).getTime() - timestampOffset;

                        logText += "<<<< LOG START | " + this.startTimestamp + " >>>>" + "\n\r";

                        for(var i=0; i < this.log.length; i++){
                            logText += "<<<< t | " + (parseInt(this.log[i][0]) -timestampOffset)  + " >>>>\n\r" + this.log[i][1] + "\n\r";
                        }

                        logText += "<<<< LOG ENDS | " + timeNow + " >>>>" + "\n\r";

                        return logText;
                    },

                    clean : function(){
                        startTimestamp = null;
                        clientTimestamp = null;
                        log = [];
                    }
                },

                recorder : {
                        enable : function(timestamp){
                            Util.logger.record.startTimestamp = (new Date(timestamp)).getTime();
                            Util.logger.record.clientTimestamp = (new Date()).getTime();
                            //Start Recording
                            return true;
                        },

                        disable : function(){
                            //Stop Recording
                            return true;
                        }
                },

                start : function(callback){
                    var that = this;
                    var logging_duration = parseInt(that.getDurationValue());
                    if(logging_duration == 0){
                        that.print_label_message("Invalid Duration", that.CLASS_ERROR);
                        $("#logging_duration").val(0);
                    } else {
                        var APIData = {
                            service : "start",
                            duration : logging_duration
                        };

                        if( sessionStorage.getItem("isSecurityEnable") === "true"){
                            APIData.username = sessionStorage.getItem("username");
                        }

                        AjaxManager.sendRequest(that.baseUrl + "clusters/" + AMCGLOBALS.persistent.clusterID + "/" + that.SERVICE_URL,
                            {data: APIData ,type: AjaxManager.POST, async:false},
                            function(response){//SUCCESS
                                if(response.status == "success"){
                                    that.print_label_message(response.debugging, (response.debugging === that.STATUS_ON ? that.CLASS_ON : that.CLASS_OFF) );
                                    that.record.clean();
                                    that.recorder.enable(+response.start_time);
                                    that.buttonContainer.find(".log-start").css("display", "none");
                                    that.buttonContainer.find(".log-stop, .log-restart").css("display", "inline-block");
                                    typeof callback === "function" && callback("success", response.debugging, response.timestamp);
                                } else{
                                    that.print_label_message("Error", that.CLASS_ERROR);
                                    typeof callback === "function" && callback("error", response.error);
                                }
                            },
                            function(response){//FAILURE
                                that.print_label_message("Failure", that.CLASS_ERROR);
                                typeof callback === "function" && callback("failure");
                            }
                        );
            		}
                },

                restart : function(callback){
                    var that = this;
                    that.print_label_message("Restarting...", that.CLASS_ON);
                    that.recorder.disable();
                    var logging_duration = parseInt(that.getDurationValue());
                    if(logging_duration == 0){
                        that.stop();
                        that.print_label_message("Invalid Duration", that.CLASS_ERROR);
                        $("#logging_duration").val(0);
                    } else {
                        var APIData = {
                            service : "restart",
                            duration : logging_duration
                        };

                        if( sessionStorage.getItem("isSecurityEnable") === "true"){
                            APIData.username = sessionStorage.getItem("username");
                        }

                        setTimeout(function(){
                            AjaxManager.sendRequest(that.baseUrl + "clusters/" + AMCGLOBALS.persistent.clusterID + "/" + that.SERVICE_URL,
                                {data: APIData ,type: AjaxManager.POST, async:false},
                                function(response){//SUCCESS
                                    if(response.status === "success"){
                                        that.print_label_message(response.debugging, (response.debugging === that.STATUS_ON ? that.CLASS_ON : that.CLASS_OFF) );
                                        that.record.clean();
                                        that.recorder.enable(+response.timestamp);
                                        typeof callback === "function" && callback("success", response.debugging, response.timestamp);
                                    } else{
                                        that.print_label_message("Error", that.CLASS_ERROR);
                                        typeof callback === "function" && callback("error", response.error);
                                    }
                                },
                                function(response){//FAILURE
                                    that.print_label_message("Failure", that.CLASS_ERROR);
                                    that.buttonContainer.find(".log-start, .log-stop, .log-restart").css("display", "none");
                                    that.buttonContainer.find(".log-start").css("display", "inline-block");
                                    that.recorder.disable();
                                    typeof callback === "function" && callback("failure");
                                }
    		                );
                        }, 250);
					}
                },

                stop : function(callback){
                    var that = this;
                    AjaxManager.sendRequest(that.baseUrl + "clusters/" + AMCGLOBALS.persistent.clusterID + "/" + that.SERVICE_URL,
                        {data: {debug_log : that.record.stringify(), service : "stop"} ,type: AjaxManager.POST, async:false},
                        function(response){//SUCCESS
                            if(response.status === "success"){
                                that.print_label_message(response.debugging, (response.debugging === that.STATUS_ON ? that.CLASS_ON : that.CLASS_OFF) );
                                that.buttonContainer.find(".log-start, .log-stop, .log-restart").css("display", "none");
                                that.buttonContainer.find(".log-start").css("display", "inline-block");
                                that.recorder.disable();
                                typeof callback === "function" && callback("success", response.debugging, response.debug_log);
                            } else{
                                that.print_label_message("Error", that.CLASS_ERROR);
                                typeof callback === "function" && callback("error", response.error);
                            }
                        },
                        function(response){//FAILURE
                            that.print_label_message("Failure", that.CLASS_ERROR);
                            typeof callback === "function" && callback("failure");
                        }
                    );
                },

                get_status : function(callback){
                    var that = this;
                    AjaxManager.sendRequest(that.baseUrl + that.SERVICE_URL,
                        {type: AjaxManager.GET, async:false},
                        function(response){//SUCCESS
                            if(response.status === "success"){
                                that.print_label_message(response.debugging, (response.debugging === that.STATUS_ON ? that.CLASS_ON : that.CLASS_OFF) );
                                if(response.isOriginInitiator){
                                        that.buttonContainer.find(".log-start").css("display", "none");
                                        that.buttonContainer.find(".log-stop, .log-restart").css("display", "inline-block");
                                } else if(response.debugging === that.STATUS_OFF){
                                        that.buttonContainer.find(".log-start").css("display", "inline-block");
                                        that.buttonContainer.find(".log-stop, .log-restart").css("display", "none");
                                } else {
                                        that.buttonContainer.find(".log-start, .log-stop, .log-restart").css("display", "none");
                                }
                                typeof callback === "function" && callback("success", response.debugging);
                            } else{
                                that.print_label_message("Error", that.CLASS_ERROR);
                                that.buttonContainer.find(".log-start, .log-stop, .log-restart").css("display", "none");
                                typeof callback === "function" && callback("error", response.error);
                            }
                        },
                        function(response){//FAILURE
                            that.print_label_message("Failure", that.CLASS_ERROR);
                            buttonContainer.find(".log-start, .log-stop, .log-restart").css("display", "none");
                            typeof callback === "function" && callback("failure");
                        }
                    );
                },

                print_label_message : function(msg, message_class){
                    $("#activityLogger .label .status_message")
                        .attr("class", "status_message " + (message_class || ""))
                        .text(msg);
                },

                setDefaultValueToDuration : function(){
                    var that = this;
                    $("#logging_duration").val(that.DEFAULT_TIME);
                },

                getDurationValue : function(){
                    var that = this;
                    var logging_duration = $("#logging_duration").val();
                    if(logging_duration == ""){
                        $("#logging_duration").val(10);
                        logging_duration = that.DEFAULT_TIME;
                    }
                    return logging_duration;
                }

        },

        closeRightPanel : function() {
            $("#rightPanel").find(".active").trigger("click");
            $("#rightPanelButton").trigger("click");
        },

        disableAnsibleFunctionalities : function(){
            $("#clusterBackupProgress").show().addClass("status_message error").text("Error : Ansible Not Found");
            $("#restoreStatusMessage").show().addClass("status_message error").text("Error : Ansible Not Found");
            // $("#backupInitNProg input").add("#backupInitNProg button").attr("disabled", "disabled");
            // $("#RestoreInitNProg input").add("#RestoreInitNProg button").attr("disabled", "disabled");
        },

        /**
         * [createModal description]
         * @param  {[object]} title    [Title of the dialog. It takes up object with following properties:
         *                                  icon    : A class which sets up a div as icon,
         *                                  text   : Text/HTML displayed in title bar
         *                             ]
         * @param  {[string]} header   [Text/HTML displayed inside body but just above the main content]
         * @param  {[string]} content  [Text/HTML which makes up the actual content of dialog]
         * @param  {[object]} submit   [Submit button. Note : Doesn't actually make a form submit. Provide a handler in exec for
         *                                 making a submit request. It takes up object with following properties:
         *                                  value   : 'Text shown on button',
         *                                  visible : true | false,
         *                                  data    : data to be passed in event.data when button is clicked
         *                                  exec    : called on button click event. Parameters (event <obj>, callback <function>)
         *                             ]
         * @param  {[object]} cancel   [Cancel button. Closes the modal and destroys it's object. It takes up object with following
         *                                 properties:
         *                                  value   : 'Text shown on button',
         *                                  visible : true | false,
         *                                  data    : data to be passed in event.data when button is clicked
         *                                  exec    : called on button click event. Parameters (event <obj>, callback <function>)
         *                             ]
         * @param  {[object]} tertiary [Tertiary button. Shown on bottom right position. An extra button for additional functionalities.
         *                                 Does nothing by itself. It takes up object with following properties:
         *                                  value   : 'Text shown on button',
         *                                  visible : true | false,
         *                                  data    : data to be passed in event.data when button is clicked
         *                                  exec    : called on button click event. Parameters (event <obj>, callback <function>)
         *                             ]
         * @param  {[function]} postExec [Callback function which is called after the modal is created]
         */
        createModal: function(title, header, content, submit, cancel, tertiary, postExec){

            $("#userUpdateConfirm").remove();

            var that = this;
            var html = '<div id="userUpdateConfirm" style="display:none">';
            html += '<div class="title-bar">';
            html += '<div class="' + (title.icon || "icon-user") + ' panel-icon"></div>';
            html += '<div class="title-bar-header panel-header" title="User Editor">';
            html += title.text || '';
            html += '</div>';
            html += '</div>';
            html += '<div class="update-popup-container">';
            html += '<div class="update-popup">';
            html += '<span class="popupValidValues popupHeader">' + (header || '') + '</span>';
            html += '<span class="popupValidValues popupList">' + content + '</span>';
            html += '</div>';
            html += '<div class="popup-error-display"></div>';
            html += '<span class="popupDialogButtons">';
            html += '<input id="userUpdateSubmit" class="blue_btn btn" value="' + (submit.value || 'confirm') + '" type="submit" ' + (submit.disabled ? 'disabled="disabled"' : '') + ' style="display:'+ (submit.visible === true ? "inline-block" : "none") +';">';
            html += '<input id="userUpdateCancel" class="clear_btn btn" value="' + (cancel.value || 'cancel') + '" type="submit" style="display:'+ (cancel.visible === true ? "inline-block" : "none") +';">';
            html += '<input id="usertertiarySubmit" class="red_btn btn" value="' + (tertiary.value || '') + '" type="submit" ' + (tertiary.disabled ? 'disabled="disabled"' : '') + ' style="position: absolute; margin-right: 12px; right: 0; display:'+ (tertiary.visible === true ? "inline-block" : "none") +';">';
            html += '</span>';
            html += '</div>';
            html += '</div>';

            $("body").append(html);

            $('#userUpdateSubmit').on('click', submit.data, function(event) {
                if(submit.visible && !submit.disabled){
                    if(submit.exec){
                        submit.exec.call(that, event, function(status, message){
                            $("#userUpdateConfirm .popup-error-display").hide();

                            if(status === "success"){
                                noty({text : message || "Success", type : 'green', layout: "center", timeout: 8000});
                                $("#userUpdateConfirm").remove();
                            } else if(status === "silent"){
                                $("#userUpdateConfirm").remove();
                            } else {
                                noty({text : message || "Failure", type : 'red', layout: "center", timeout: 8000});
                                $("#userUpdateConfirm .popup-error-display").text(message).show(200);
                            }
                        });
                    } else {
                        $("#userUpdateConfirm").remove();
                    }
                }
            });

            $('#userUpdateCancel').off('click').on('click', cancel.data, function(event) {
                if(cancel.visible && !cancel.disabled){
                    if(cancel.exec){
                        cancel.exec.call(that, event, function(status, message){
                            $("#userUpdateConfirm").remove();
                        });
                    } else {
                        $("#userUpdateConfirm").remove();
                    }
                }
            });

            $("#usertertiarySubmit").off('click').on('click', tertiary.data, function(event){
                if(tertiary.visible && !tertiary.disabled){
                    if(tertiary.exec){
                        tertiary.exec.call(that, event, function(status, message){
                            $("#userUpdateConfirm").remove();
                        });
                    } else {
                        $("#userUpdateConfirm").remove();
                    }
                }
            });

            $("#userUpdateConfirm").dialog({
                dialogClass: "no-dialog-title",
                modal: true,
                width: (innerWidth < AppConfig.modalWidth ? "100%" : AppConfig.modalWidth),
                closeOnEscape: true,
                resizable: false
            })

            $("#userUpdateConfirm .update-popup-container").css("max-height", (window.innerHeight - 95));

            postExec && postExec();
        },

        checkForCompatibility : function(compatibilty){
            if(!AMCGLOBALS.pageSpecific.compatibiltyWarningIssued && compatibilty === "incompatible"){
                console.info("Aerospike versions on cluster nodes are in incompatible version with " +
                             "respect to AMC!! This might make AMC produce unpredictable results.");

                // Util.createModal(
                //     {icon: "icon-blocked", text: "Incompatible Builds!"},
                //     "",
                //     (   "<div style='text-align: center; font-size: 1.5em; color: red;'>Aerospike version on cluster nodes is in Incompatible state!</div>" +
                //         "<br><br><div>Using same aerospike version on all the nodes is highly recommended.</div>"),
                //     { visible: true, value: "OK" },
                //     { visible: false },
                //     { visible: false },
                //     function(){
                        window.AMCGLOBALS.pageSpecific.compatibiltyWarningIssued = true;
                //     }
                // );
            }
        },

        updateNodesColorList: function(nodeList) {
            var colorList = AppConfig.throughputGraphColorList;
            var newNodes = !!window.AMCGLOBALS.persistent.nodesColorList ? _.difference(nodeList, _.keys(window.AMCGLOBALS.persistent.nodesColorList)) : nodeList;
            if (newNodes.length > 0) {
                var startColorIndex = _.size(window.AMCGLOBALS.persistent.nodesColorList);
                for (var nodeI in newNodes) {
                    var node = newNodes[nodeI];
                    window.AMCGLOBALS.persistent.nodesColorList[node] = colorList[startColorIndex++];
                }
            }
        },

        versionAfphaNumericCheck: function(version){
            if(version.indexOf('-') === -1){
                return version;
            }else{
                return (version.split('-')[0] + "." + version.split('-')[1].charAt(0));
            }
        },

        useLocalTimezone: function(){
            return (Util.getCookie("useLocalTimeZone") === "true");
        },

        setTimezoneLabel: function(){
            if (Util.useLocalTimezone()) {
                var mins = -(new Date().getTimezoneOffset());
                var sgn = (Math.sign(mins) == 1) ? "+" : "-";
                var hrs = Math.floor(Math.abs(mins) / 60);
                var mins = Math.floor(Math.abs(mins) % 60);
                if (mins < 10) {
                    mins = "0"+mins;
                }
                var tz = sgn + hrs + ":" + mins;
                $("#timezone-label .attribute-value").text("Local (UTC" + tz + ")   ");
            } else {
                $("#timezone-label .attribute-value").text("UTC");
            }
        },

        /**
         * Compares two software version numbers (e.g. "1.7.1" or "1.2b").
         *
         * This function was born in http://stackoverflow.com/a/6832721.
         *
         * @param {string} v1 The first version to be compared.
         * @param {string} v2 The second version to be compared.
         * @param {object} [options] Optional flags that affect comparison behavior:
         * <ul>
         *     <li>
         *         <tt>lexicographical: true</tt> compares each part of the version strings lexicographically instead of
         *         naturally; this allows suffixes such as "b" or "dev" but will cause "1.10" to be considered smaller than
         *         "1.2".
         *     </li>
         *     <li>
         *         <tt>zeroExtend: true</tt> changes the result if one version string has less parts than the other. In
         *         this case the shorter string will be padded with "zero" parts instead of being considered smaller.
         *     </li>
         * </ul>
         * @returns {number|NaN}
         * <ul>
         *    <li>0 if the versions are equal</li>
         *    <li>a negative integer iff v1 < v2</li>
         *    <li>a positive integer iff v1 > v2</li>
         *    <li>NaN if either version string is in the wrong format</li>
         * </ul>
         *
         * @copyright by Jon Papaioannou (["john", "papaioannou"].join(".") + "@gmail.com")
         * @license This function is in the public domain. Do what you want with it, no strings attached.
         */
        versionCompare: function(v1, v2, options) {
            // crop after the first '-' character
            sanitizeVersionString = function(v) {
                var n = v.indexOf('-');
                return v.substring(0, n != -1 ? n : v.length);
            }

            v1 = sanitizeVersionString(v1);
            v2 = sanitizeVersionString(v2);

            var lexicographical = options && options.lexicographical,
                zeroExtend = options && options.zeroExtend,
                v1parts = v1.split('.'),
                v2parts = v2.split('.');

            function isValidPart(x) {
                return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
            }

            if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
                return NaN;
            }

            if (zeroExtend) {
                while (v1parts.length < v2parts.length) v1parts.push("0");
                while (v2parts.length < v1parts.length) v2parts.push("0");
            }

            if (!lexicographical) {
                v1parts = v1parts.map(Number);
                v2parts = v2parts.map(Number);
            }

            for (var i = 0; i < v1parts.length; ++i) {
                if (v2parts.length == i) {
                    return 1;
                }

                if (v1parts[i] == v2parts[i]) {
                    continue;
                }
                else if (v1parts[i] > v2parts[i]) {
                    return 1;
                }
                else {
                    return -1;
                }
            }

            if (v1parts.length != v2parts.length) {
                return -1;
            }

            return 0;
        }
    };
    window.UTIL = Util;
    return Util;
});

