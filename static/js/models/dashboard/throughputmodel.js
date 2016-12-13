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

define(["underscore", "backbone", "poller", "views/dashboard/throughputview", "d3", "helper/timechart-helper", "config/app-config", "helper/util","helper/AjaxManager","helper/overlay"], function(_, Backbone, Poller, ThroughputView, D3, TimeseriesChart, AppConfig, Util,AjaxManager,Overlay){
    var ThroughputModel = Backbone.Model.extend({
        maxNumberOfDataPoints : 1800,
        readsDataWithOptions : [],
        writesDataWithOptions : [],
        xdrReadsDataWithOptions : [],
        xdrWritesDataWithOptions : [],
        queriesDataWithOptions : [],
        scansDataWithOptions : [],
        udfsDataWithOptions : [],
        batchReadsDataWithOptions : [],
        initialize: function(){
            this.spinner1 = new Overlay("readChart");
            this.spinner2 = new Overlay("writeChart");
            this.spinner3 = new Overlay("xdrReadChart");
            this.spinner4 = new Overlay("xdrWriteChart");
            this.spinner5 = new Overlay("queryChart");
            this.spinner6 = new Overlay("scanChart");
            this.spinner7 = new Overlay("udfChart");
            this.spinner8 = new Overlay("batchReadsChart");
			this.activelyPolling = false;
			this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();
            this.initTimeseriesView();
            this.startEventListeners(this);
            this.initThroughputData(this);
        },
        initVariables: function(){
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;	//this.get("cluster_id");
            this.maxNumberOfDataPoints = 1800;
			this.numberOfDataPoints = window.AMCGLOBALS.persistent.snapshotTime;
            $(AppConfig.throughput.historySelect).val(window.AMCGLOBALS.persistent.snapshotTime);
            this.currentReadData = null;
            this.currentWriteData = null;
            this.currentXdrReadsData = null;
            this.currentXdrWritesData = null;
            this.currentQueriesData = null;
            this.currentScansData = null;
            this.currentUdfsData = null;
            this.currentBatchReadsData = null;
			this.chartsInitialized = false;

            AMCGLOBALS.pageSpecific.charts = {
            	clusterwideSeries: ["TPS_TOTAL", "TPS_SUCCESS"],
                readChartType : "clusterwide",
                writeChartType : "clusterwide",
                xdrReadChartType : "clusterwide",
                xdrWriteChartType : "clusterwide",
                queryChartType : "clusterwide",
                scanChartType : "clusterwide",
                udfChartType : "clusterwide",
                batchReadChartType : "clusterwide",
                nodewiseBubbleTemplate : ("<div class='timeseries %%ID%% bubble body' style='background-color: %%COLOR%% !important;'>" +
                            "<div class='timeseries %%ID%% bubble innerBody' style='background-color: white; box-shadow: inset 0 0 2px 0px %%COLOR%%'>" +
                            "<div class='timeseries %%ID%% bubble header'>%%TITLE%%</div>" +
                            "<div class='timeseries %%ID%% bubble y value'>" +
                            "<div class='timeseries %%ID%% bubble y total'>Total : %%SECONDARY%%</div>" +
                            "<span class='timeseries %%ID%% bubble y success'>Success : %%VALUE%%</span>" +
                            "</div>" +
                            "<span class='timeseries %%ID%% bubble x date'>%%DATE%%/%%month%%/%%YEAR%%</span>" +
                            "&nbsp&nbsp&nbsp" +
                            "<span class='timeseries %%ID%% bubble x time'>%%HOUR%%:%%MINUTE%%:%%SECOND%%</span>" +
                            "</div>" +
                            "</div>"),
                clusterwideBubbleTemplate : ("<div class='timeseries %%ID%% bubble body' style='background-color: %%COLOR%% !important;'>" +
                            "<div class='timeseries %%ID%% bubble innerBody' style='background-color: white; box-shadow: inset 0 0 2px 0px %%COLOR%%'>" +
                            "<div class='timeseries %%ID%% bubble header'>%%TITLE%%</div>" +
                            "<div class='timeseries %%ID%% bubble y value'>" +
                            "<span class='timeseries %%ID%% bubble y success'>%%VALUE%%</span>" +
                            "</div>" +
                            "<span class='timeseries %%ID%% bubble x date'>%%DATE%%/%%month%%/%%YEAR%%</span>" +
                            "&nbsp&nbsp&nbsp" +
                            "<span class='timeseries %%ID%% bubble x time'>%%HOUR%%:%%MINUTE%%:%%SECOND%%</span>" +
                            "</div>" +
                            "</div>")
            };
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.clusterID*/ + AppConfig.throughput.resourceUrl;
        },
        fetchSuccess: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
                if(typeof response.readView !== 'undefined'){
                    response.readView.remove();
                    delete response.readView;
                }
                if(typeof response.writeView !== 'undefined'){
                    response.writeView.remove();
                    delete response.writeView;
                }
                if(typeof response.xdrReadView !== 'undefined'){
                    response.xdrReadView.remove();
                    delete response.xdrReadView;
                }
                if(typeof response.xdrWriteView !== 'undefined'){
                    response.xdrWriteView.remove();
                    delete response.xdrWriteView;
                }
                if(typeof response.queryView !== 'undefined'){
                    response.queryView.remove();
                    delete response.queryView;
                }
                if(typeof response.scanView !== 'undefined'){
                    response.scanView.remove();
                    delete response.scanView;
                }
                if(typeof response.udfView !== 'undefined'){
                    response.udfView.remove();
                    delete response.udfView;
                }
                if(typeof response.batchReadView !== 'undefined'){
                    response.batchReadView.remove();
                    delete response.batchReadView;
                }
				response.destroy(); return;
			}

            try{
				if(this.model.activelyPolling){
					this.model.updateThroughput(this.model, false);
					if(!this.model.chartsInitialized){
						this.model.initChartUpdate(this.model);
						this.model.chartsInitialized = true;
					}
				}
            }catch(e){
                this.start();
                console.error(e);
//                console.info(e.toString());
            }
            if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				this.clusterID = window.AMCGLOBALS.persistent.clusterID;

			}

			if(typeof response.attributes.error !== 'undefined' && response.attributes.error.indexOf("Invalid cluster id") != -1){
				delete response.attributes.error;
				Util.clusterIDReset();
			}

			if(!$("#line_charts .box-container").is(":visible")){
				Util.initPoller(response, AppConfig.pollerOptions(AppConfig.updateInterval['throughput'])).stop();
			}
        },
        fetchError: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
                if(typeof response.readView !== 'undefined'){
                    response.readView.remove();
                    delete response.readView;
                }
                if(typeof response.writeView !== 'undefined'){
                    response.writeView.remove();
                    delete response.writeView;
                }
                if(typeof response.xdrReadView !== 'undefined'){
                    response.xdrReadView.remove();
                    delete response.xdrReadView;
                }
                if(typeof response.xdrWriteView !== 'undefined'){
                    response.xdrWriteView.remove();
                    delete response.xdrWriteView;
                }
                if(typeof response.queryView !== 'undefined'){
                    response.queryView.remove();
                    delete response.queryView;
                }
                if(typeof response.scanView !== 'undefined'){
                    response.scanView.remove();
                    delete response.scanView;
                }
                if(typeof response.udfView !== 'undefined'){
                    response.udfView.remove();
                    delete response.udfView;
                }
                if(typeof response.batchReadView !== 'undefined'){
                    response.batchReadView.remove();
                    delete response.batchReadView;
                }
				response.destroy(); return;
			}

            var that = this;
            try{
				that.model.activelyPolling && that.model.updateThroughput(that.model, true);
				if(!that.model.chartsInitialized && that.model.activelyPolling){
					that.model.initChartUpdate(that.model);
					that.model.chartsInitialized = true;
				}
				!AMCGLOBALS.pageSpecific.GlobalPollingActive && that.stop();
            }catch(e){
                console.info(e.toString());
            }
        },
        initChartUpdate: function(model){
            model.spinner1.stopOverlay();
            model.spinner2.stopOverlay();
            model.spinner3.stopOverlay();
            model.spinner4.stopOverlay();
            model.spinner5.stopOverlay();
            model.spinner6.stopOverlay();
            model.spinner7.stopOverlay();
            model.spinner8.stopOverlay();
			window.clearInterval(model.updateThorughtputChartInterval);
			model.readView.render(model.currentReadData, model.readsDataWithOptions, model.numberOfDataPoints);
            model.writeView.render(model.currentWriteData, model.writesDataWithOptions, model.numberOfDataPoints);
            model.xdrReadView.render(model.currentXdrReadsData, model.xdrReadsDataWithOptions, model.numberOfDataPoints);
            model.xdrWriteView.render(model.currentXdrWritesData, model.xdrWritesDataWithOptions, model.numberOfDataPoints);
            model.queryView.render(model.currentQueriesData, model.queriesDataWithOptions, model.numberOfDataPoints);
            model.scanView.render(model.currentScansData, model.scansDataWithOptions, model.numberOfDataPoints);
            model.udfView.render(model.currentUdfsData, model.udfsDataWithOptions, model.numberOfDataPoints);
			model.batchReadView.render(model.currentBatchReadsData, model.batchReadsDataWithOptions, model.numberOfDataPoints);
			model.updateThorughtputChartInterval = setInterval(function(){
                if(window.AMCGLOBALS.activePage === "dashboard" && model.CID === window.AMCGLOBALS.currentCID){
                    model.readView.render(model.currentReadData, model.readsDataWithOptions, model.numberOfDataPoints);
                    model.writeView.render(model.currentWriteData, model.writesDataWithOptions, model.numberOfDataPoints);
                    model.xdrReadView.render(model.currentXdrReadsData, model.xdrReadsDataWithOptions, model.numberOfDataPoints);
                    model.xdrWriteView.render(model.currentXdrWritesData, model.xdrWritesDataWithOptions, model.numberOfDataPoints);
                    model.queryView.render(model.currentQueriesData, model.queriesDataWithOptions, model.numberOfDataPoints);
                    model.scanView.render(model.currentScansData, model.scansDataWithOptions, model.numberOfDataPoints);
                    model.udfView.render(model.currentUdfsData, model.udfsDataWithOptions, model.numberOfDataPoints);
                    model.batchReadView.render(model.currentBatchReadsData, model.batchReadsDataWithOptions, model.numberOfDataPoints);
                } else{
                    clearInterval(model.updateThorughtputChartInterval);
                    if(typeof model.readView !== 'undefined'){
                        model.readView.remove();
                    }
                    if(typeof model.writeView !== 'undefined'){
                        model.writeView.remove();
                    }
                    if(typeof model.xdrReadView !== 'undefined'){
                        model.xdrReadView.remove();
                    }
                    if(typeof model.xdrWriteView !== 'undefined'){
                        model.xdrWriteView.remove();
                    }
                    if(typeof model.queryView !== 'undefined'){
                        model.queryView.remove();
                    }
                    if(typeof model.scanView !== 'undefined'){
                        model.scanView.remove();
                    }
                    if(typeof model.udfView !== 'undefined'){
                        model.udfView.remove();
                    }
                    if(typeof model.batchReadView !== 'undefined'){
                        model.batchReadView.remove();
                    }
                }
			},AppConfig.updateInterval['throughput']);
        },
		updateCharts: function(model){
			model.readView.render({}, model.readsDataWithOptions, model.numberOfDataPoints);
            model.writeView.render({}, model.writesDataWithOptions, model.numberOfDataPoints);
            model.xdrReadView.render({}, model.xdrReadsDataWithOptions, model.numberOfDataPoints);
            model.xdrWriteView.render({}, model.xdrWritesDataWithOptions, model.numberOfDataPoints);
            model.queryView.render({}, model.queriesDataWithOptions, model.numberOfDataPoints);
            model.scanView.render({}, model.scansDataWithOptions, model.numberOfDataPoints);
            model.udfView.render({}, model.udfsDataWithOptions, model.numberOfDataPoints);
			model.batchReadView.render({}, model.batchReadsDataWithOptions, model.numberOfDataPoints);
		},
        startEventListeners: function(that){
            $(AppConfig.throughput.historySelect).on('change', function(e){
                if(that.CID === window.AMCGLOBALS.currentCID){
                    window.AMCGLOBALS.persistent.snapshotTime = $(this).val();
                    window.location.hash = window.AMCGLOBALS.activePage + "/"+window.AMCGLOBALS.persistent.seedNode+"/"+window.AMCGLOBALS.persistent.snapshotTime+"/"+window.AMCGLOBALS.persistent.selectedNodes.toString();
    				that.numberOfDataPoints = parseInt(window.AMCGLOBALS.persistent.snapshotTime)/parseInt(window.AMCGLOBALS.persistent.updateInterval)*1000;
				    that.updateCharts(that);
                }
            });

            $("#read_container .toggle-button-container").off("click").on("click", function() {
                var setClusterWideThroughput = !$(this).hasClass("active");

                AMCGLOBALS.pageSpecific.charts.readChartType = setClusterWideThroughput ? "clusterwide" : "nodewise";
                for (var i = 0; i < that.readsDataWithOptions.length; i++) {
                    if (that.readsDataWithOptions[i].name.indexOf("TPS") !== -1) {
                        that.readsDataWithOptions[i].disabled = !setClusterWideThroughput;
                    } else {
                        if(AMCGLOBALS.persistent.selectedNodes.indexOf(that.readsDataWithOptions[i].name) !== -1){
                            that.readsDataWithOptions[i].disabled = setClusterWideThroughput;
                        }
                    }
                }

                if (setClusterWideThroughput) {
                    $(this).addClass("active");
                    that.readView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate
                    });
                } else {
                    $(this).removeClass("active");
                    that.readView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate
                    });
                }

                that.updateCharts(that);
            });

            $("#write_container .toggle-button-container").off("click").on("click", function() {
                var setClusterWideThroughput = !$(this).hasClass("active");

                AMCGLOBALS.pageSpecific.charts.writeChartType = setClusterWideThroughput ? "clusterwide" : "nodewise";
                for (var i = 0; i < that.writesDataWithOptions.length; i++) {
                    if (that.writesDataWithOptions[i].name.indexOf("TPS") !== -1) {
                        that.writesDataWithOptions[i].disabled = !setClusterWideThroughput;
                    } else {
                        if(AMCGLOBALS.persistent.selectedNodes.indexOf(that.writesDataWithOptions[i].name) !== -1){
                            that.writesDataWithOptions[i].disabled = setClusterWideThroughput;
                        }
                    }
                }

                if (setClusterWideThroughput) {
                    $(this).addClass("active");
                    that.writeView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate
                    });
                } else {
                    $(this).removeClass("active");
                    that.writeView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate
                    });
                }

                that.updateCharts(that);
            });

            $("#xdr_read_container .toggle-button-container").off("click").on("click", function() {
                var setClusterWideThroughput = !$(this).hasClass("active");

                AMCGLOBALS.pageSpecific.charts.xdrReadChartType = setClusterWideThroughput ? "clusterwide" : "nodewise";
                for (var i = 0; i < that.xdrReadsDataWithOptions.length; i++) {
                    if (that.xdrReadsDataWithOptions[i].name.indexOf("TPS") !== -1) {
                        that.xdrReadsDataWithOptions[i].disabled = !setClusterWideThroughput;
                    } else {
                        if(AMCGLOBALS.persistent.selectedNodes.indexOf(that.xdrReadsDataWithOptions[i].name) !== -1){
                            that.xdrReadsDataWithOptions[i].disabled = setClusterWideThroughput;
                        }
                    }
                }

                if (setClusterWideThroughput) {
                    $(this).addClass("active");
                    that.xdrReadView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate
                    });
                } else {
                    $(this).removeClass("active");
                    that.xdrReadView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate
                    });
                }

                that.updateCharts(that);
            });

            $("#xdr_write_container .toggle-button-container").off("click").on("click", function() {
                var setClusterWideThroughput = !$(this).hasClass("active");

                AMCGLOBALS.pageSpecific.charts.xdrWriteChartType = setClusterWideThroughput ? "clusterwide" : "nodewise";
                for (var i = 0; i < that.xdrWritesDataWithOptions.length; i++) {
                    if (that.xdrWritesDataWithOptions[i].name.indexOf("TPS") !== -1) {
                        that.xdrWritesDataWithOptions[i].disabled = !setClusterWideThroughput;
                    } else {
                        if(AMCGLOBALS.persistent.selectedNodes.indexOf(that.xdrWritesDataWithOptions[i].name) !== -1){
                            that.xdrWritesDataWithOptions[i].disabled = setClusterWideThroughput;
                        }
                    }
                }

                if (setClusterWideThroughput) {
                    $(this).addClass("active");
                    that.xdrWriteView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate
                    });
                } else {
                    $(this).removeClass("active");
                    that.xdrWriteView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate
                    });
                }

                that.updateCharts(that);
            });

            $("#query_container .toggle-button-container").off("click").on("click", function() {
                var setClusterWideThroughput = !$(this).hasClass("active");

                AMCGLOBALS.pageSpecific.charts.queryChartType = setClusterWideThroughput ? "clusterwide" : "nodewise";
                for (var i = 0; i < that.queriesDataWithOptions.length; i++) {
                    if (that.queriesDataWithOptions[i].name.indexOf("TPS") !== -1) {
                        that.queriesDataWithOptions[i].disabled = !setClusterWideThroughput;
                    } else {
                        if(AMCGLOBALS.persistent.selectedNodes.indexOf(that.queriesDataWithOptions[i].name) !== -1){
                            that.queriesDataWithOptions[i].disabled = setClusterWideThroughput;
                        }
                    }
                }

                if (setClusterWideThroughput) {
                    $(this).addClass("active");
                    that.queryView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate
                    });
                } else {
                    $(this).removeClass("active");
                    that.queryView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate
                    });
                }

                that.updateCharts(that);
            });

            $("#scan_container .toggle-button-container").off("click").on("click", function() {
                var setClusterWideThroughput = !$(this).hasClass("active");

                AMCGLOBALS.pageSpecific.charts.scanChartType = setClusterWideThroughput ? "clusterwide" : "nodewise";
                for (var i = 0; i < that.scansDataWithOptions.length; i++) {
                    if (that.scansDataWithOptions[i].name.indexOf("TPS") !== -1) {
                        that.scansDataWithOptions[i].disabled = !setClusterWideThroughput;
                    } else {
                        if(AMCGLOBALS.persistent.selectedNodes.indexOf(that.scansDataWithOptions[i].name) !== -1){
                            that.scansDataWithOptions[i].disabled = setClusterWideThroughput;
                        }
                    }
                }

                if (setClusterWideThroughput) {
                    $(this).addClass("active");
                    that.scanView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate
                    });
                } else {
                    $(this).removeClass("active");
                    that.scanView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate
                    });
                }

                that.updateCharts(that);
            });

            $("#udf_container .toggle-button-container").off("click").on("click", function() {
                var setClusterWideThroughput = !$(this).hasClass("active");

                AMCGLOBALS.pageSpecific.charts.udfChartType = setClusterWideThroughput ? "clusterwide" : "nodewise";
                for (var i = 0; i < that.udfsDataWithOptions.length; i++) {
                    if (that.udfsDataWithOptions[i].name.indexOf("TPS") !== -1) {
                        that.udfsDataWithOptions[i].disabled = !setClusterWideThroughput;
                    } else {
                        if(AMCGLOBALS.persistent.selectedNodes.indexOf(that.udfsDataWithOptions[i].name) !== -1){
                            that.udfsDataWithOptions[i].disabled = setClusterWideThroughput;
                        }
                    }
                }

                if (setClusterWideThroughput) {
                    $(this).addClass("active");
                    that.udfView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate
                    });
                } else {
                    $(this).removeClass("active");
                    that.udfView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate
                    });
                }

                that.updateCharts(that);
            });

            $("#batch_read_container .toggle-button-container").off("click").on("click", function() {
                var setClusterWideThroughput = !$(this).hasClass("active");

                AMCGLOBALS.pageSpecific.charts.batchReadChartType = setClusterWideThroughput ? "clusterwide" : "nodewise";
                for (var i = 0; i < that.batchReadsDataWithOptions.length; i++) {
                    if (that.batchReadsDataWithOptions[i].name.indexOf("TPS") !== -1) {
                        that.batchReadsDataWithOptions[i].disabled = !setClusterWideThroughput;
                    } else {
                        if(AMCGLOBALS.persistent.selectedNodes.indexOf(that.batchReadsDataWithOptions[i].name) !== -1){
                            that.batchReadsDataWithOptions[i].disabled = setClusterWideThroughput;
                        }
                    }
                }

                if (setClusterWideThroughput) {
                    $(this).addClass("active");
                    that.batchReadView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate
                    });
                } else {
                    $(this).removeClass("active");
                    that.batchReadView.chartID.configure({
                        bubbleTemplate: AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate
                    });
                }

                that.updateCharts(that);
            });

            function viewDestroy(){
                $(document).off("pollerResume", that.startModelPoller).off("view:Destroy", viewDestroy);

                if(typeof that.readView !== 'undefined'){
                    that.readView.remove();
                    delete that.readView;
                }
                if(typeof that.writeView !== 'undefined'){
                    that.writeView.remove();
                    delete that.writeView;
                }
                if(typeof that.xdrReadView !== 'undefined'){
                    that.xdrReadView.remove();
                    delete that.xdrReadView;
                }
                if(typeof that.xdrWriteView !== 'undefined'){
                    that.xdrWriteView.remove();
                    delete that.xdrWriteView;
                }
                if(typeof that.queryView !== 'undefined'){
                    that.queryView.remove();
                    delete that.queryView;
                }
                if(typeof that.scanView !== 'undefined'){
                    that.scanView.remove();
                    delete that.scanView;
                }
                if(typeof that.udfView !== 'undefined'){
                    that.udfView.remove();
                    delete that.udfView;
                }
                if(typeof that.batchReadView !== 'undefined'){
                    that.batchReadView.remove();
                    delete that.batchReadView;
                }
                that.destroy();
            };

            $(document).on("view:Destroy", viewDestroy);

			$(document).off("pollerResume", that.startModelPoller).on("pollerResume", {model : that}, that.startModelPoller);
			$(document).off("pollerPaused", that.stopModelPoller).on("pollerPaused", {model : that}, that.stopModelPoller);

			//Binding panel state to pollers
			var container = $("#line_charts");

			container.off("startPoller", that.startModelPoller).on("startPoller", {model : that}, that.startModelPoller);
			container.off("stopPoller", that.stopModelPoller).on("stopPoller", {model : that}, that.stopModelPoller);
        },

		startModelPoller: function(event){
			event.data.model.activelyPolling = false;
			event.data.model.insertSliceHistory(event.data.model);
			var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['throughput']);
			Util.initPoller(event.data.model, polOptions).start();
			event.data.model.initChartUpdate(event.data.model);
		},

		stopModelPoller: function(event){
			var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['throughput']);
			Util.initPoller(event.data.model, polOptions).stop();
			clearInterval(event.data.model.updateThorughtputChartInterval);
			event.data.model.currentReadData = null;
            event.data.model.currentWriteData = null;
            event.data.model.currentXdrReadsData = null;
            event.data.model.currentXdrWritesData = null;
            event.data.model.currentQueriesData = null;
            event.data.model.currentScansData = null;
            event.data.model.currentUdfsData = null;
			event.data.model.currentBatchReadsData = null;
		},

		insertSliceHistory: function(model){
			var startTime = model.latestTimestamp;
			AjaxManager.sendRequest(model.url() + "_history?start_time=" + startTime ,{async: true},successHandler, errorHandler);

			function successHandler(response){
            	if (response.error === undefined) {
					var nodes = _.keys(response.read_tps);
					var updateCounts = response.read_tps[nodes[0]].length;

					for(var i=0; i<updateCounts; i++){
						var update = {};
						update.read_tps = {};
                        update.write_tps = {};
                        update.xdr_read_tps = {};
                        update.xdr_write_tps = {};
                        update.query_tps = {};
                        update.scan_tps = {};
                        update.udf_tps = {};
						update.batch_read_tps = {};

						for(var index in nodes){
							update.read_tps[nodes[index]] = response.read_tps[nodes[index]][i];
                            update.write_tps[nodes[index]] = response.write_tps[nodes[index]][i];
                            update.xdr_read_tps[nodes[index]] = response.xdr_read_tps[nodes[index]][i];
                            update.xdr_write_tps[nodes[index]] = response.xdr_write_tps[nodes[index]][i];
                            update.query_tps[nodes[index]] = response.query_tps[nodes[index]][i];
                            update.scan_tps[nodes[index]] = response.scan_tps[nodes[index]][i];
                            update.udf_tps[nodes[index]] = response.udf_tps[nodes[index]][i];
							update.batch_read_tps[nodes[index]] = response.batch_read_tps[nodes[index]][i];
						}

						_.extend(model.attributes, update);
						if( +(update.read_tps[nodes[0]].x) > model.latestTimestamp){
							TimeseriesChart.updateTimeseriesData(update.read_tps, model.readsDataWithOptions);
                            TimeseriesChart.updateTimeseriesData(update.write_tps, model.writesDataWithOptions);
                            TimeseriesChart.updateTimeseriesData(update.xdr_read_tps, model.xdrReadsDataWithOptions);
                            TimeseriesChart.updateTimeseriesData(update.xdr_write_tps, model.xdrWritesDataWithOptions);
                            TimeseriesChart.updateTimeseriesData(update.query_tps, model.queriesDataWithOptions);
                            TimeseriesChart.updateTimeseriesData(update.scan_tps, model.scansDataWithOptions);
                            TimeseriesChart.updateTimeseriesData(update.udf_tps, model.udfsDataWithOptions);
							TimeseriesChart.updateTimeseriesData(update.batch_read_tps, model.batchReadsDataWithOptions);
						}
					}

					if(updateCounts > 0){
						model.latestTimestamp = +(response.read_tps[nodes[0]][updateCounts - 1].x);
						model.updateCharts(model);
					}
				}
				model.activelyPolling = true;
				model.initChartUpdate(model);
            };

            function errorHandler(response){
                model.activelyPolling = true;
				model.initChartUpdate(model);
            };
		},

        initTimeseriesView: function(){
            this.readView = new ThroughputView({
                chartDiv    : AppConfig.throughput.readChart,
                legendDiv   : AppConfig.throughput.readChartLegend,
                xAxisDiv    : AppConfig.throughput.readChartXAxis,
                slider      : AppConfig.throughput.readSlider,
                tpsDiv      : AppConfig.throughput.readTPS,
                model       : this,
                el          : "#read_write_chart",
                chartType   : "read"
            });

            this.writeView = new ThroughputView({
                chartDiv    : AppConfig.throughput.writeChart,
                legendDiv   : AppConfig.throughput.writeChartLegend,
                xAxisDiv    : AppConfig.throughput.writeChartXAxis,
                slider      : AppConfig.throughput.writeSlider,
                tpsDiv      : AppConfig.throughput.writeTPS,
                model       : this,
                el          : "#read_write_chart",
                chartType   : "write"
            });

            this.xdrReadView = new ThroughputView({
                chartDiv    : AppConfig.throughput.xdrReadChart,
                legendDiv   : AppConfig.throughput.xdrReadChartLegend,
                xAxisDiv    : AppConfig.throughput.xdrReadChartXAxis,
                slider      : AppConfig.throughput.xdrReadSlider,
                tpsDiv      : AppConfig.throughput.xdrReadTPS,
                model       : this,
                el          : "#read_write_chart",
                chartType   : "xdrRead"
            });

            this.xdrWriteView = new ThroughputView({
                chartDiv    : AppConfig.throughput.xdrWriteChart,
                legendDiv   : AppConfig.throughput.xdrWriteChartLegend,
                xAxisDiv    : AppConfig.throughput.xdrWriteChartXAxis,
                slider      : AppConfig.throughput.xdrWriteSlider,
                tpsDiv      : AppConfig.throughput.xdrWriteTPS,
                model       : this,
                el          : "#read_write_chart",
                chartType   : "xdrWrite"
            });

            this.queryView = new ThroughputView({
                chartDiv    : AppConfig.throughput.queryChart,
                legendDiv   : AppConfig.throughput.queryChartLegend,
                xAxisDiv    : AppConfig.throughput.queryChartXAxis,
                slider      : AppConfig.throughput.querySlider,
                tpsDiv      : AppConfig.throughput.queryTPS,
                model       : this,
                el          : "#read_write_chart",
                chartType   : "query"
            });

            this.scanView = new ThroughputView({
                chartDiv    : AppConfig.throughput.scanChart,
                legendDiv   : AppConfig.throughput.scanChartLegend,
                xAxisDiv    : AppConfig.throughput.scanChartXAxis,
                slider      : AppConfig.throughput.scanSlider,
                tpsDiv      : AppConfig.throughput.scanTPS,
                model       : this,
                el          : "#read_write_chart",
                chartType   : "scan"
            });
            this.udfView = new ThroughputView({
                chartDiv    : AppConfig.throughput.udfChart,
                legendDiv   : AppConfig.throughput.udfChartLegend,
                xAxisDiv    : AppConfig.throughput.udfChartXAxis,
                slider      : AppConfig.throughput.udfSlider,
                tpsDiv      : AppConfig.throughput.udfTPS,
                model       : this,
                el          : "#read_write_chart",
                chartType   : "udf"
            });

            this.batchReadView = new ThroughputView({
                chartDiv    : AppConfig.throughput.batchReadChart,
                legendDiv   : AppConfig.throughput.batchReadChartLegend,
                xAxisDiv    : AppConfig.throughput.batchReadChartXAxis,
                slider      : AppConfig.throughput.batchReadSlider,
                tpsDiv      : AppConfig.throughput.batchReadTPS,
                model       : this,
                el          : "#read_write_chart",
                chartType   : "batchRead"
            });
        },
        initThroughputData: function(model){
			var that = this;
            model.activelyPolling = false;
            model.startTime = TimeseriesChart.fromDateTimetoUnix();
            model.chartStartTime = model.startTime/* - model.maxNumberOfDataPoints * 1000*/;
            model.readsDataWithOptions = [];
            model.writesDataWithOptions = [];
            model.xdrReadDataWithOptions = [];
            model.xdrWriteDataWithOptions = [];
            model.queryDataWithOptions = [];
            model.scanDataWithOptions = [];
            model.udfDataWithOptions = [];
            model.batchReadDataWithOptions = [];

            AjaxManager.sendRequest(that.url() + "_history",{async: true},successHandler,errorHandler);
            function successHandler(response){
            	if (response.error === undefined) {
					var reads = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.readChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true, response.read_tps);
					model.readsDataWithOptions = reads.data;
					model.latestTimestamp = reads.latestTimestamp;

                    var writes = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.readChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true, response.write_tps);
                    model.writesDataWithOptions = writes.data;

                    var xdrReads = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.readChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true, response.xdr_read_tps);
                    model.xdrReadsDataWithOptions = xdrReads.data;

                    var xdrWrites = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.writeChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true, response.xdr_write_tps);
                    model.xdrWritesDataWithOptions = xdrWrites.data;

                    var queries = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.queryChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true, response.query_tps);
                    model.queriesDataWithOptions = queries.data;

                    var scans = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.scanChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true, response.scan_tps);
                    model.scansDataWithOptions = scans.data;

                    var udfs = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.udfChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true, response.udf_tps);
                    model.udfsDataWithOptions = udfs.data;

					var batchReads = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.batchReadChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true, response.batch_read_tps);
					model.batchReadsDataWithOptions = batchReads.data;
				}
				else {
					var reads = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.readChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
					model.readsDataWithOptions = reads.data;
					model.lastTimestamp = reads.lastTimestamp;

                    var writes = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.writeChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                    model.writesDataWithOptions = writes.data;

                    var xdrReads = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.xdrReadChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                    model.xdrReadsDataWithOptions = xdrReads.data;

                    var xdrWrites = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.xdrWriteChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                    model.xdrWritesDataWithOptions = xdrWrites.data;

                    var queries = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.queryChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                    model.queriesDataWithOptions = queries.data;

                    var scans = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.scanChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                    model.scansDataWithOptions = scans.data;

                    var udfs = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.udfChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                    model.udfsDataWithOptions = udfs.data;

					var batchReads = TimeseriesChart.initializeChartData(AMCGLOBALS.pageSpecific.charts.batchReadChartType, model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
					model.batchReadsDataWithOptions = batchReads.data;
				}

                model.readView.initializeTPS(model.readsDataWithOptions);
                model.writeView.initializeTPS(model.writesDataWithOptions);
                model.xdrReadView.initializeTPS(model.xdrReadsDataWithOptions);
                model.xdrWriteView.initializeTPS(model.xdrWritesDataWithOptions);
                model.queryView.initializeTPS(model.queriesDataWithOptions);
                model.scanView.initializeTPS(model.scansDataWithOptions);
                model.udfView.initializeTPS(model.udfsDataWithOptions);
                model.batchReadView.initializeTPS(model.batchReadsDataWithOptions);
				model.activelyPolling = true;
                if(!model.chartsInitialized){
                    model.initChartUpdate(model);
                    model.chartsInitialized = true;
                }
            }

            function errorHandler(response){
            	var reads = TimeseriesChart.initializeChartData(model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
				model.readsDataWithOptions = reads.data;
				model.latestTimestamp = reads.latestTimestamp;

                var writes = TimeseriesChart.initializeChartData(model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                model.writesDataWithOptions = writes.data;

                var xdrReads = TimeseriesChart.initializeChartData(model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                model.xdrReadsDataWithOptions = xdrReads.data;

                var xdrWrites = TimeseriesChart.initializeChartData(model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                model.xdrWritesDataWithOptions = xdrWrites.data;

                var queries = TimeseriesChart.initializeChartData(model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                model.queriesDataWithOptions = queries.data;

                var scans = TimeseriesChart.initializeChartData(model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                model.scansDataWithOptions = scans.data;

                var udfs = TimeseriesChart.initializeChartData(model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
                model.udfsDataWithOptions = udfs.data;

				var batchReads = TimeseriesChart.initializeChartData(model.attributes.basicNodesList, model.maxNumberOfDataPoints, model.chartStartTime, AppConfig.throughputGraphColorList, true);
				model.batchReadsDataWithOptions = batchReads.data;

                model.activelyPolling = true;
                if(!model.chartsInitialized){
                    model.initChartUpdate(this.model);
                    model.chartsInitialized = true;
                }
            }


        },
        addNewNodesInSeries: function(newlyAddedNodes){
            TimeseriesChart.addNewSeries(this.readsDataWithOptions, newlyAddedNodes);
            TimeseriesChart.addNewSeries(this.writesDataWithOptions, newlyAddedNodes);
            TimeseriesChart.addNewSeries(this.xdrReadsDataWithOptions, newlyAddedNodes);
            TimeseriesChart.addNewSeries(this.xdrWritesDataWithOptions, newlyAddedNodes);
            TimeseriesChart.addNewSeries(this.queriesDataWithOptions, newlyAddedNodes);
            TimeseriesChart.addNewSeries(this.scansDataWithOptions, newlyAddedNodes);
            TimeseriesChart.addNewSeries(this.udfsDataWithOptions, newlyAddedNodes);
            TimeseriesChart.addNewSeries(this.batchReadsDataWithOptions, newlyAddedNodes);
        },
        updateThroughput: function(model, isError){

            var reads = {};
            var writes = {};
            var xdrReads = {};
            var xdrWrites = {};
            var queries = {};
            var scans = {};
            var udfs = {};
            var batchReads = {};
            var tempReads;
            // var tempPrevReads;
            var tempWrites;
            // var tempWritesReads;
            var tempXdrReads;
            var tempXdrWrites;
            var tempQueries;
            var tempScans;
            var tempUdfs;
            var tempBatchReads;

            if(typeof model._previousAttributes.read_tps === 'undefined' || typeof model._previousAttributes.write_tps === 'undefined'){

            }else{
                $.each(model.attributes["read_tps"], function(key, value){
                    if(typeof model._previousAttributes.read_tps[key] !== 'undefined' && typeof model._previousAttributes.write_tps[key] !== 'undefined'){
                        if(isError === true){
                                reads[key] = null;
                                writes[key] = null;
                                xdrReads[key] = null;
                                xdrWrites[key] = null;
                                queries[key] = null;
                                scans[key] = null;
                                udfs[key] = null;
                                batchReads[key] = null;
                        }else{
                            tempReads = model.attributes.read_tps[key];
                            tempWrites = model.attributes.write_tps[key];
                            tempXdrReads = model.attributes.xdr_read_tps[key];
                            tempXdrWrites = model.attributes.xdr_write_tps[key];
                            tempQueries = model.attributes.query_tps[key];
                            tempScans = model.attributes.scan_tps[key];
                            tempUdfs = model.attributes.udf_tps[key];
                            tempBatchReads = model.attributes.batch_read_tps[key];
							reads[key] = tempReads;
                            writes[key] = tempWrites;
                            xdrReads[key] = tempXdrReads;
                            xdrWrites[key] = tempXdrWrites;
                            queries[key] = tempQueries;
                            scans[key] = tempScans;
                            udfs[key] = tempUdfs;
                            batchReads[key] = tempBatchReads;
                        }
                    }
                });

				var availableNodeObject, timestamp;
						for(var someNode in reads){
							availableNodeObject = reads[someNode];
							break;
						}

						if(availableNodeObject != null){
							timestamp = availableNodeObject.x;
						} else{
							timestamp = model.latestTimestamp + window.AMCGLOBALS.persistent.updateInterval;
						}

				for(var node in window.AMCGLOBALS.persistent.nodeList){
					if(reads[window.AMCGLOBALS.persistent.nodeList[node]] == null){
						reads[window.AMCGLOBALS.persistent.nodeList[node]] = {x : timestamp, y : null, secondary : null };
					}

                    if(writes[window.AMCGLOBALS.persistent.nodeList[node]] == null){
                        writes[window.AMCGLOBALS.persistent.nodeList[node]] = {x : timestamp, y : null, secondary : null };
                    }

                    if(xdrReads[window.AMCGLOBALS.persistent.nodeList[node]] == null){
                        xdrReads[window.AMCGLOBALS.persistent.nodeList[node]] = {x : timestamp, y : null, secondary : null };
                    }

                    if(xdrWrites[window.AMCGLOBALS.persistent.nodeList[node]] == null){
                        xdrWrites[window.AMCGLOBALS.persistent.nodeList[node]] = {x : timestamp, y : null, secondary : null };
                    }

                    if(queries[window.AMCGLOBALS.persistent.nodeList[node]] == null){
                        queries[window.AMCGLOBALS.persistent.nodeList[node]] = {x : timestamp, y : null, secondary : null };
                    }

                    if(scans[window.AMCGLOBALS.persistent.nodeList[node]] == null){
                        scans[window.AMCGLOBALS.persistent.nodeList[node]] = {x : timestamp, y : null, secondary : null };
                    }

                    if(udfs[window.AMCGLOBALS.persistent.nodeList[node]] == null){
                        udfs[window.AMCGLOBALS.persistent.nodeList[node]] = {x : timestamp, y : null, secondary : null };
                    }

					if(batchReads[window.AMCGLOBALS.persistent.nodeList[node]] == null){
						batchReads[window.AMCGLOBALS.persistent.nodeList[node]] = {x : timestamp, y : null, secondary : null };
					}
				}

			}

            model.currentReadData = reads;
            model.currentWriteData = writes;
            model.currentXdrReadsData = xdrReads;
            model.currentXdrWritesData = xdrWrites;
            model.currentQueriesData = queries;
            model.currentScansData = scans;
            model.currentUdfsData = udfs;
            model.currentBatchReadsData = batchReads;

			if(typeof reads === "object" && !_.isEmpty(reads)){
                var maxArr = _.max( _.values(reads), function(obj){
                                    return obj != null ? +obj.x : null;
                                });
                !!maxArr && (model.latestTimestamp = maxArr.x);
            }
        }
    });

    return ThroughputModel;
});
