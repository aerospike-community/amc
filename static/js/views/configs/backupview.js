/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "config/view-config", "config/app-config", "helper/util","helper/AjaxManager"], function($, _, Backbone, ViewConfig, AppConfig, Util,AjaxManager) {

    var BackupView = Backbone.View.extend({
        initialize: function() {
            var that = this;
            this.bindEvents();
            this.initAutoComplete();
        },

        setRenderStatus: function(status) {
          this.model.set('renderStatus', status);
          if (status) {
              if (status === 'success') {
                  $("#backupStatusMessage").text("Backup Successfully Completed").removeClass("status error").addClass("success").css("display", "block");
              } else if (status === 'Backup initiated') {
                  $("#backupStatusMessage").text("Backup initiated").removeClass("success error").addClass("status").css("display", "block");
              } else {
                  $("#backupStatusMessage").text("Backup Failed : " + status).removeClass("status success").addClass("error").css("display", "block");
              }
          }
        },

        updateProgress: function(container, status, progress) {
            var progressPercent = 0;
            if (!container.hasClass("ui-progressbar")) {
                container.empty();
                container.progressbar({
                    value: false,
                    change: function() {
                        container.find(".ui-progressbar-value").attr("data-value", container.progressbar("value"));
                    },
                    complete: function() {
                        $(this).empty();
                        $(this).attr("class", "backup-progress status_message success").text("Completed");
                    }
                });
            }

            if (status === "In Progress") {
                progressPercent = parseInt(progress.substr(0, progress.length - 1));
                container.addClass("status").removeClass("error success");
                container.find(".ui-progressbar-value").addClass("status").removeClass("error success");
                container.progressbar("value", progressPercent);
            } else if (status === "Success") {
                container.empty();
                container.attr("class", "backup-progress status_message success").text("Completed");
            } else {
                container.empty();
                container.attr("class", "backup-progress status_message error").text("Failed");
            }
        },

        bindEvents: function() {
            var that = this;
            Util.enterKeyEventForDialog("#clusterBackupContainer input", "#backupRunSubmit");

            $("#clusterBackupContainer input").off("focus").on("focus", function() {
                $(this).css("box-shadow", "none");
            });

            $("#backupMachineNetworkAddress").focusout(function(){
                $("#backupUsername").prop('disabled', false);
                $("#backupPassword").prop('disabled', false);
            });

            $("#clusterBackupContainer input").off("click").on("click", function() {
                $("#backupStatusMessage").text("").removeClass("status error success").css("display", "none");
            });

            $('#backupRunSubmit').off("click").on('click', function(event) {
                that.backupCluster();
            });

            $("#clusterBackupContainer div.cluster-advanced-toggle").off("click").on("click", function() {
                var button = $("#clusterBackupContainer div.cluster-advanced-toggle.advance-toggle-button");
                var buttonText = $("#clusterBackupContainer div.cluster-advanced-toggle.advance-toggle-text");
                if (button.text() === "+") {
                    button.text("-");
                    button.attr("title", "minimize");
                    buttonText.attr("title", "minimize");
                } else {
                    button.text("+");
                    button.attr("title", "maximize");
                    buttonText.attr("title", "maximize");
                }
                $("#clusterBackupContainer div.cluster-advanced").slideToggle("fast");
            });

            $('#backupNamespaceName').off("blur").on("blur", function(event) {
                if (_.indexOf(window.AMCGLOBALS.pageSpecific.namespaceList, $(this).val()) != -1) {

                	AjaxManager.sendRequest(AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.sets.resourceUrl + $('#backupNamespaceName').val() + "/sets",{},
                		function (response){
                			 that.model.availableSets = [];
                             for (var i = 0; i < response.sets.length; i++) {
                                 that.model.availableSets.push(response.sets[i].set_name);
                             }
                		});
                } else {
                    that.model.availableSets = [];
                }
            });

            $("#v-nav>ul>li[tab='backup']").on("click", function() {
                that.model.backupPoller.start();
                that.model.polling = true;
            });

            $("#v-nav>ul>li").not("#v-nav>ul>li[tab='backup']").on("click", function() {
                that.model.backupPoller.stop();
                that.model.polling = false;
            });

            $(document).on("view:Destroy", function() {
                that.model.destroy();
                that.model = null;
            });

        },
        initAutoComplete: function() {
            var that = this;
            $("#backupSets").autocomplete({
                minLength: 0,
                appendTo: "#clusterBackupContainer div.ui-front.backupSets",
                source: function(request, response) {
                    // delegate back to autocomplete, but extract the last term
                    response(that.model.availableSets && $.ui.autocomplete.filter(
                        that.model.availableSets, request.term));
                },
                focus: function() {
                    // prevent value inserted on focus
                    return false;
                },
                select: function(event, ui) {
                    this.value = ui.item.value;
                    return false;
                }
            }).on("mousedown", function() {
                $(this).autocomplete("search", "");
            });

            $("#backupNamespaceName").autocomplete({
                minLength: 0,
                appendTo: "#clusterBackupContainer div.ui-front.backupNamespaceName",
                source: function(request, response) {
                    // delegate back to autocomplete, but extract the last term
                    response($.ui.autocomplete.filter(
                        window.AMCGLOBALS.pageSpecific.namespaceList, request.term));
                },
                focus: function() {
                    // prevent value inserted on focus
                    return false;
                },
                select: function(event, ui) {
                    this.value = ui.item.value;
                    return false;
                }
            }).on("mousedown", function() {
                $(this).autocomplete("search", "");
            });
        },



        backupCluster: function() {
            var that = this;

            var formData = this.validateCluster();
            if(!formData){
            	return false;
            }
            var inputBoxs = $("#clusterBackupContainer input");

            inputBoxs.attr("disabled", "true");
            var backupStatusMessageEL = $("#backupStatusMessage");
            backupStatusMessageEL.text("Initiating backup. Please Wait!");
            backupStatusMessageEL.removeClass("error success").addClass("status").css("display", "block");
            this.model.waitForInitiationResponse = true;
            this.model.firstResponseReceived = false;

            function successCallback(data){
            	inputBoxs.removeAttr("disabled");
                that.model.waitForInitiationResponse = false;
                if (data.status === 'In Progress') {
                    that.model.backupPoller.start();
                    that.model.currentBackupId = data.backup_id;
                    that.setRenderStatus('Backup initiated');
                } else if (data.status === 'Failure') {
                    that.setRenderStatus(data.error);
                } else {
                    that.setRenderStatus('unknown error');
                }
            }
            function failCallback(response){
            	  that.model.waitForInitiationResponse = false;
                  inputBoxs.removeAttr("disabled");
                  that.setRenderStatus('Network error');
            }
            AjaxManager.sendRequest(AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.backup.initiationUrl,{type:AjaxManager.POST, data : formData},
            	successCallback, failCallback);


        },

        //This method validate the input field, return false if data is invalid or return form data to post
        validateCluster : function(){
        	var that = this;

        	var disabledItems = $("#clusterBackupContainer input:disabled");
            var inputBoxs = $("#clusterBackupContainer input").not(disabledItems);
            inputBoxs.add("#clusterBackupContainer button");

            var backupStatusMessageEL = $("#backupStatusMessage");
            backupStatusMessageEL.css("display", "none").addClass("class", "status_message");

            $("#clusterBackupContainer input.form_basic.req").prop("value", function(i, value) {
                if (value.replace(/^\s\s*/, '').replace(/\s\s*$/, '') === "") {
                    $(this).css("box-shadow", "inset 0 0 7px 1px red");
                }
                return value;
            });

            for (var i = 0; i < inputBoxs.length; i++) {
                if ($(inputBoxs[i]).val() === "" && $(inputBoxs[i]).attr("name") !== "sets" && $(inputBoxs[i]).attr("name") !== "username" && $(inputBoxs[i]).attr("name") !== "password") {
                    backupStatusMessageEL.text("Please fill in highlighted details!").addClass("error").css("display", "block");
                    return false;
                }
            }

            var formdata = {};
            var form = $("#clusterBackupContainer input");
            form = form.not(form.filter("[type='radio']").not(form.filter("[type='radio']:checked"))).not("[type='button']");

            form.each(function(i, d) {
                var elem = $(d);
                var name = elem.attr("name");
                var value = elem.val();

                if (elem.attr("type") === "checkbox") {
                    if (elem.prop("checked")) {
                        value = "True";
                    } else {
                        value = "False";
                    }
                }
                formdata[name] = value;
            });

            if (_.indexOf(_.map(window.AMCGLOBALS.persistent.nodeList, function(d) {
                    return d.split(":")[0];
                }), formdata.destination_node_address.split(":")[0]) != -1 ||
                (formdata.destination_node_address.toLowerCase().split(":")[0] === "localhost" &&
                    _.indexOf(_.map(window.AMCGLOBALS.persistent.nodeList, function(d) {
                        return d.split(":")[0];
                    }), window.location.host.toLowerCase().split(":")[0]) != -1)) {

                $("#backupStatusMessage").text("Destination machine cannot be a cluster node.");
                backupStatusMessageEL.removeClass("status").addClass("error").css("display", "block");
                return false;
            }

            if (_.indexOf(window.AMCGLOBALS.pageSpecific.namespaceList, formdata.namespace) == -1) {
                backupStatusMessageEL.text("Invalid Namespace.");
                backupStatusMessageEL.removeClass("status").addClass("error").css("display", "block");
                return false;
            }

            if ((_.intersection(formdata.sets.replace(/\s*/g, '').split(","), that.model.availableSets)).length == 0 && formdata.sets !== "") {
                backupStatusMessageEL.text("Invalid Sets.");
                backupStatusMessageEL.removeClass("status").addClass("error").css("display", "block");
                return false;
            }

            return formdata;
        },

        render: function(jobs) {
            var container = $("#clusterBackupProgress");
            if (_.isEmpty(jobs) && container.find("ul li").length == 0) {
                container.find("ul").remove();
            } else {
                if (container.find("ul").length == 0)
                    container.append("<ul>");
                var list = container.find("ul");
                var liToBeRemoved = list.find("li");
                for (var backupID in jobs) {
                    var spanClass = "";
                    if (jobs[backupID].progress.status === "In Progress") {
                        spanClass = "status";
                    } else if (jobs[backupID].progress.status === "Success") {
                        spanClass = "success";
                    } else if (jobs[backupID].progress.status === "Failure") {
                        spanClass = "error";
                    }

                    if (list.find("li#" + backupID).length == 0) {
                        list.append("<li id='" + backupID + "'>" +
                            "<span class='backup-detail-container'>Backing up&nbsp;" +
                            "<span class='backup-detail namespace-name'>" + jobs[backupID].namespace + "</span>" +
                            "&nbsp;to destination&nbsp;" +
                            "<span class='backup-detail destination-address'>" + jobs[backupID].destination_node_address + ":" + jobs[backupID].destination_location + "</span>" +
                            "</span>" +
                            "<span class='backup-progress status_message'></span></li>");
                    }
                    var element = list.find("#" + backupID).find(".backup-progress");
                    element.removeClass("status error success").addClass(spanClass);
                    if (jobs[backupID].progress.percentage === "Initiating backup") {
                        element.addClass("status").text("Initiating");
                    } else {
                        this.updateProgress(element, jobs[backupID].progress.status, jobs[backupID].progress.percentage);
                    }

                    liToBeRemoved = liToBeRemoved.not(list.find("li#" + backupID));
                }

                if (liToBeRemoved.length > 0) {
                    setTimeout(function() {
                        liToBeRemoved.remove();

                        if (container.find("ul li").length == 0)
                            container.find("ul").remove();

                    }, 5000);
                }
            }
        }
    });

    return BackupView;
});
