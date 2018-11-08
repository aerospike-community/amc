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

define(["underscore", "backbone", "config/app-config", "helper/util", "helper/timechart-helper", "views/statistics/stattrackerview"], function(_, Backbone, AppConfig, Util, TimeseriesChart, StatTrackerView){
	var StatTrackerModel = Backbone.Model.extend({
		initialize: function(maxTrack){
			this.maxTrack = maxTrack;
			this.tracker = {};
			this.maxNumberOfDataPoints = 1800;
			this.view = new StatTrackerView({model: this});
			this.initEventListeners();
		},

		initEventListeners: function(){
			var that = this;
			function viewDestroy(){
                window.$(document).off("view:Destroy", viewDestroy);
                if(that.collection != null){
	                if(that.collection.trackList)
	                	delete that.collection.trackList;
	                if(that.collection.tracker)
	                	delete that.collection.tracker;
	            }
                that.destroy();
            }

            window.$(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
		},

		/**
		 * [setCollection resets tracker object and setups a fresh object.]
		 * @param {[type]} collection [statModel collection]
		 */
		setCollection: function(collection){
			var that = this;
			that.tracker = {};
			collection.trackList = [];
			collection.tracker = that;
			that.collection = collection;
			that.set({tracker: that.tracker});
			that.resetChartTime();

			that.trackingNodeList = window.AMCGLOBALS.persistent.selectedNodes || [];
		},

		resetChartTime: function(){
			this.chartStartTime = (new Date()).getTime();
		},

		cleanUp: function(){
			var that = this;
			that.collection.trackList = [];
			that.tracker = null;
			that.view.clean();
		},

		updateTracker: function(node, stat, value){
			var that = this;
			value = that.getStatValue( value );

			if(that.tracker[stat] != null){
				var nodeStatSeries = _.find(that.tracker[stat].series, function(series){
					return series.name === node;
				});

				var val = +value;

				if(_.isNaN(val)){
					if(value === "false")
						val = 0;
					else if(value === "true")
						val = 1;
					else 
						val = null;
				}

				nodeStatSeries.data.shift();
				nodeStatSeries.data.push({
					x: (new Date()).getTime(),
					y: val,
					secondary: null
				});

				if(that.tracker[stat].updated[node] == null)
					that.tracker[stat].updated.push(node);
			}

			if( _.isEmpty(_.difference( AMCGLOBALS.persistent.selectedNodes, that.tracker[stat].updated )) ){
				that.triggerUpdate(stat);
				that.tracker[stat].updated = [];
			}
		},

		getStatValue: function(cellvalue){
			if (cellvalue == null) {
				return ""; //cellvalue
			}

			cellvalue = cellvalue.toString();
			var start = cellvalue.indexOf(">");
			
			if(start === -1){
				return cellvalue;
			}

			start++;
			var end = cellvalue.indexOf("<", start);
			return cellvalue.substr(start, end - start);
		},		

		addStat: function(stat, firstSample){
			var that = this;

			var trackable = false;

			for(var node in firstSample){
				var sample = that.getStatValue(firstSample[node]);

				if( (_.isNumber(+sample) && !_.isNaN(+sample)) || (sample === "false" || sample === "true") ) {
					trackable = true;
				}
			}

			if(!trackable){
				return {status: "failure", message: "Non-numeric values cannot be tracked."}
			}

			if( that.tracker[stat] != null ){
				return { status: "information", message: "Already tracking."};
			} else if(that.collection.trackList.length >= that.maxTrack){
				return { status: "failure", message: "You can track maximum of " + that.maxTrack + " stats at a time."};
			} else {
				that.tracker[stat] = {
					updated: [],
					series: that.initializeStatData(stat)
				};

				that.collection.trackList.push(stat);
				for(var node in firstSample){
					that.updateTracker(node, stat, firstSample[node]);
				}
				return { status: "success", message: "Started tracking stat " + stat};
			}
		},

		initializeStatData: function(stat){
			var that = this;
			return	TimeseriesChart.initializeChartData(
						"nodewise", 
						AMCGLOBALS.persistent.selectedNodes, 
						that.maxNumberOfDataPoints, 
						((new Date()).getTime()), 
						AppConfig.throughputGraphColorList, 
						false,
						null,
						stat
					).data;
		},

		removeStat: function(stat){
			var that = this;
			that.collection.trackList.splice(that.collection.trackList.indexOf(stat), 1);
			delete that.tracker[stat];
			that.triggerDestroy(stat);
		},

		updateNodeList: function(){
			var that = this;
			var selectedNodes = window.AMCGLOBALS.persistent.selectedNodes;
			var newNodes = _.difference(window.AMCGLOBALS.persistent.selectedNodes, that.trackingNodeList);
			var removedNodes = _.difference(that.trackingNodeList, window.AMCGLOBALS.persistent.selectedNodes);
			
			that.trackingNodeList = window.AMCGLOBALS.persistent.selectedNodes;

			if( !_.isEmpty(that.tracker) ){
				if(removedNodes.length > 0 || newNodes.length > 0){
					for(var stat in that.tracker){
						for (var i = 0; i < removedNodes.length; i++) {
							var nodeSeries = _.find(that.tracker[stat].series, function(series){
								return series.name === removedNodes[i];
							});
							that.tracker[stat].series.splice(that.tracker[stat].series.indexOf(nodeSeries), 1);
						}
						if(newNodes.length > 0){
							var titles = {};
							newNodes.forEach(function(node){
								titles[node] = {
									title: node,
									subTitle: stat
								};
							});
							if( _.isEmpty(that.tracker[stat].series) ){
								that.tracker[stat] = {
									updated: [],
									series: that.initializeStatData(stat)
								};
							} else {
								TimeseriesChart.addNewSeries(that.tracker[stat].series, newNodes, titles);	
							}							
						}
					}
				}
			}
        },

        triggerUpdate: function(stat){
        	this.view.update(stat);
        },

        triggerDestroy: function(stat){
        	this.view.destroy(stat);
        }
	});

	return StatTrackerModel;
});
