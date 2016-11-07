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

define(["underscore", "backbone", "helper/notification", "timechart"], function(_, Backbone, Notification, TimeChart){
	var StatTrackerView = Backbone.View.extend({
		initialize: function(){
            this.chart = null;
			this.bubbleTemplate = ("<div class='timeseries %%ID%% bubble body' style='background-color: %%COLOR%% !important;'>" +
                "<div class='timeseries %%ID%% bubble innerBody' style='background-color: white; box-shadow: inset 0 0 2px 0px %%COLOR%%'>" +
                "<div class='timeseries %%ID%% bubble header'>%%TITLE%%</div>" +
                "<div class='timeseries %%ID%% bubble header'>%%SUBTITLE%%</div>" +
                "<div class='timeseries %%ID%% bubble y value'>" +
                "<span class='timeseries %%ID%% bubble y success'>%%VALUE%%</span>" +
                "</div>" +
                "<span class='timeseries %%ID%% bubble x date'>%%DATE%%/%%month%%/%%YEAR%%</span>" +
                "&nbsp&nbsp&nbsp" +
                "<span class='timeseries %%ID%% bubble x time'>%%HOUR%%:%%MINUTE%%:%%SECOND%%</span>" +
                "</div>" +
                "</div>");

            this.startEventListeners();
			
		},

        startEventListeners: function(){
            var that = this;
            var statusMap = {"success": "green", "failure": "red", "information": "information"};
            window.$(document).on("statClick", function(event, stat, firstSample){
                var status = that.model.addStat(stat, firstSample);
                
                if(status.status === "success" || status.status === "failure"){
                    Notification.toastNotification(statusMap[status.status], status.message, status.status === "failure" ? 5000 : null);
                }
            });

            that.model.on("destroy", function(){
                window.$(document).off("statClick");
                if(that.chart != null){
                    that.chart.remove();
                }
            });

            that.bindNavigateAway();

        },

        bindNavigateAway: function(){
            var that = this;
            window.$("#attributeSelector input").off("mousedown", that.statTypeChange).on("mousedown", {statChange: true, view: that}, that.statTypeChange);
            window.$("#tabListContainer .tab a:not(#statTabLink)").off("mousedown", that.navigatingAwayHandler).on("mousedown", {statChange: true, view: that}, that.navigatingAwayHandler);
        },

        statTypeChange: function(event){
			event.data.view.navigatingAwayHandler.call(this, event);
		},

		navigatingAwayHandler: function(event){

			var element = this;
			var tabs = window.$("#tabListContainer .tab a");
			var types =  window.$("#attributeSelector input");
			var that = event.data.view;
			var statChange = event.data.statChange;

			if(statChange == null){
				statChange = false;
			}
			if(that.chart != null){
				event.preventDefault();

				Util.createModal(
					{text : "Page Change Confirmation!"},
					"",
					(   "<div style='text-align: center;'>All stat tracking history will be lost on " +
						(statChange === true ? "changing type of statistics!" : "navigating away from this page!") +
						"<br><br>Do you want to continue?</div>"
					),
					{
						value: "Yes",
						visible: true,
						exec: function(event, callback){
							that.model.cleanUp();

							if($.contains(tabs, element) || tabs.is(element)){
								tabs.off("mousedown");
								types.off("mousedown");
								window.location = element.getAttribute("href");
							} else {
								window.$(element).trigger("click");
							}
							
							callback("silent", "");
						}
					},
					{
						value: "No",
						visible: true
					},
					{
						visible: false,
						disabled: true
					}
				);
			} else {
				if($.contains(tabs, element) || tabs.is(element)){
					tabs.off("mousedown");
					types.off("mousedown");
				}
			}
		},

        update: function(stat){
            var that = this;
            
            if(that.model.collection.trackList.length > 0){
                $(".tracker-visibility").show();
            }

            var container = $(".tracker-stat-container")
            var el = container.find(".tracker-stat." + stat);
            
            if(el.length === 0){
                el = container.append("<div class='tracker-stat tag " + stat + "' data-name='" + stat + "'><span class='drop-index-btn hover-drop-btn icon-cancel-circle remove-node-icon persist'></span><div class='tracker-stat-name'>" + stat + "</div></div>");
                that.bindStatTracker();
                that.bindNavigateAway();
            }

            window.AMCGLOBALS.pageSpecific.keepPollersAlive = true;

            el = container.find(".active");

            if(el.length === 0){
                container.find("div.tracker-stat:first").trigger("click");
            } else if(el.hasClass(stat)){
                that.updateGraph(stat);
            }
        },

        destroy: function(stat){
            var that = this;
            var trackers = $(".tracker-stat-container .tracker-stat");
            var statEl = trackers.filter("." + stat);
            trackers = trackers.filter(":not(." + stat + ")");

            if(statEl.hasClass("active")){
                trackers.filter(":first").trigger("click");
            }

            statEl.remove();

            if(that.model.collection.trackList.length === 0){
                that.clean();
            }
        },

        clean: function(){
            var that = this;
            if(that.chart != null){
                that.chart.remove();
            }
            $(".tracker-stat-container .tracker-stat").remove();
            $(".tracker-visibility").hide();
            window.$("#attributeSelector input").off("mousedown", that.statTypeChange);
            window.$("#tabListContainer .tab a:not(#statTabLink)").off("mousedown", that.navigatingAwayHandler);
            window.AMCGLOBALS.pageSpecific.keepPollersAlive = false;
        },

        bindStatTracker: function(){
            var that = this;
            var trackers = $(".tracker-stat-container .tracker-stat");
            trackers.off("click").on("click", function(event){
                var el = $(this);
                var target = $(event.target);

                if(target.hasClass("drop-index-btn")){
                    that.model.removeStat( el.attr("data-name") );
                    return true;
                }

                if(!el.hasClass("active")){
                    trackers.filter(".active").removeClass("active");
                    el.addClass("active");
                    that.showGraph( el.attr("data-name") );
                }

                return true;
            });
        },

        showGraph: function(stat){
            var that = this;

            if(that.chart != null){
                this.chart.remove();
            }
            var chartContainer = "#stat-tracker div.tracker-graph";
            
            that.chart = timechart({id : "statTracker", container : chartContainer});
            that.chart.initialize({
                chartWidth : $(chartContainer).width() - 50,
                chartHeight : 180, 
                marginLeft : 10,
                marginTop : 10, 
                marginRight : 10, 
                marginBottom : 15,
                xAxisOrient : 'bottom', 
                xAxisTickOrientation : 'bottom', 
                xAxisShowTickLines : true,
                yAxisOrient : 'left', 
                yAxisTickOrientation : 'right',
                yAxisNumberOfTicks : 6,
                yAxisShowTickLines : true, 
                yAxisExtremes:  {max : 200, min : 0},
                updateInterval : 0,
                showHoverBubble : true,
                fixScaleY : false,
                scaleYCeilOffset : "5%",
                scaleYFloorOffset : 0,
                fixTimeWindowSize : true,
                timeWindowSize : (that.model.maxNumberOfDataPoints * 1000),
                timeInUTC : false,
                xAxisTickFormat : "%H:%M:%S",
                autoResize : true,
                bubbleTemplate : that.bubbleTemplate
            });

            that.updateGraph(stat);
        },

        updateGraph: function(stat){
            var that = this;
            that.chart.updateSeries(that.model.tracker[stat].series);
        }
	});

	return StatTrackerView;
});