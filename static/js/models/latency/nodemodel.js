/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["underscore", "backbone", "poller", "config/app-config", "views/latency/nodeview", "d3", "helper/util",'helper/AjaxManager', "views/latency/nodeview"], function(_, Backbone, Poller, AppConfig, NodeView, D3, Util,AjaxManager, NodeView){
    var NodeModel = Backbone.Model.extend({
        initVariables :function(){
            this.expanded = {};
			this.historyInitialized = false;
            this.modelID = this.get("model_id");
            this.address = this.get("address");
            this.clusterID = window.AMCGLOBALS.persistent.clusterID;//this.get("cluster_id");
			this.colorScale = ["#5ACC44", "#E2BE00", "#ff7f0e", "#d62728", "#000000"];
            this.polling = true;
            this.latencyData = null;
			this.legend;
			this.latencyAvailable = false;
			this.latencyDataDate = {};
			this.lastTimestamp = {};
			this.attrList = ["writes_master", "writes", "reads", "proxy", "udf", "query"];
			this.rowView = new NodeView(this);
			this.startEventListeners();
       this.useLocalTimezone = Util.useLocalTimezone();
        },

      initialize :function(model){
        this.CID = window.AMCGLOBALS.currentCID;
        try{
          this.initVariables();
        } catch(e) {
          console.log(e);
        }
      },

      initLatencyHistory: function(history) {
        this.attributes.node_status = history.node_status || "off";

        if(history.latency_history != null && history.latency_history.length > 0){

          var latencyHistory = history.latency_history;

          latencyHistory = this.prependAndFillNullLatencyData(history.latency_history);

          if(latencyHistory.length > 0){
            this.pushLatencyInfoHistory(this, latencyHistory);
            this.latencyAvailable = true;
            this.rowView.initContainers(this);
          }
        }

        if(this.latencyAvailable || history.node_status !== "on"){
          this.rowView.render(this,this.latencyData);
        } else {
          this.rowView.error(this);
        }
        this.historyInitialized = true;
      },


      initLatencyHistoryOnError: function() {
        this.historyInitialized = true;
      },
      getCurrentDate: function() {
        var now = new Date();
        if(this.useLocalTimezone) {
          return now;
        } else {
          return new Date(now.getTime() + now.getTimezoneOffset()*60*1000);
        }
      },

      getDateByTimestamp: function(timestamp) {
        var now = new Date();
        if(this.useLocalTimezone) {
          return new Date(timestamp);
        } else {
          return new Date(timestamp + now.getTimezoneOffset()*60*1000);
        }
      },

      updateTimeZone: function() {
        var plocal = this.useLocalTimezone;
        this.useLocalTimezone = Util.useLocalTimezone();
        var useLocalTimezone = this.useLocalTimezone;
        if(plocal === useLocalTimezone) {
          return;
        }

        var that = this;
        var category; // total, < 1ms, < 5ms, < 8ms, etc
        var data, cdata;
        var attr; // reads, writes, etc
        var i;
        for(attr in this.latencyData) {
          if(!this.latencyData.hasOwnProperty(attr)) {
            continue;
          }
          category = this.latencyData[attr];

          // category data
          cdata = category[0].data;
          if(cdata) {
            for(i = 0; i < cdata.length; i++) {
              data = cdata[i].data;
              changeTimestamp(data);
            }
          }
          
          // sum total data
          if(_.isArray(category[1].data)) {
            changeTimestamp(category[1].data);
          }
        }

        return;

        function changeTimestamp(data) {
          var i, x, d;
          var now = new Date();
          var delta = now.getTimezoneOffset()*60*1000;
          for(i = 0; i < data.length; i++) {
            d = data[i];
            // toggle time zone
            if(useLocalTimezone) {
              d.x = d.x - delta;
            } else {
              d.x = d.x + delta;
            }
          }
        }
      },

        fetchSuccess: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.rowView.cleanView(model.rowView);
				model.destroy();
			}
			if(model.historyInitialized){
				var latencyAvailable = false;
				var latency = model.attributes.latency;

        model.updateTimeZone();
				if(model.attributes.node_status === "on"){
					for(var attr in model.attributes.latency){
						latencyAvailable = true;
						break;
					}
				}

				var attr_name = 'reads';
				for (name in model.latencyData) {
					attr_name = name;
					break;
				}

				if(model.latencyAvailable && !latencyAvailable){
					latency = model.getNullInfo(new Date((model.latencyData[attr_name][0].data[0].data[model.latencyData[attr_name][0].data[0].data.length - 1].x) + 10000));
					latencyAvailable = true;
				}

				if(!model.latencyAvailable && latencyAvailable){

					var latencyHistory = [model.attributes.latency];

					latencyHistory = model.prependAndFillNullLatencyData(latencyHistory);

					model.pushLatencyInfoHistory(model, latencyHistory);
					model.latencyAvailable = true;
					model.rowView.initContainers(model);
				}

				if(model.latencyAvailable && latencyAvailable){
					model.shiftLatencyInfo(model, latency );
				}

				if(model.latencyAvailable)
					model.rowView.render(model,model.latencyData);
			}


			if(typeof model.attributes.error !== 'undefined' && model.attributes.error.indexOf("Invalid cluster id") != -1){
				delete model.attributes.error;
				Util.clusterIDReset();
			}
        },

        fetchError: function(model){
			if(model.CID !== window.AMCGLOBALS.currentCID){
				model.rowView.cleanView(model.rowView);
				model.destroy();
			}

			var attr_name = 'reads';
			for (name in model.latencyData) {
				attr_name = name;
				break;
			}

			if(model.latencyAvailable){
				latency = model.getNullInfo(new Date((model.latencyData[attr_name][0].data[0].data[model.latencyData[attr_name][0].data[0].data.length - 1].x) + 10000));
				latencyAvailable = true;
				model.shiftLatencyInfo(model, latency );
				model.rowView.render(model,model.latencyData);
			}

			console.info("err");
        },

        startEventListeners : function (){
            var that = this;
            this.on('remove',function(){
            	that.rowView.cleanView(that.rowView);
            	$('#' + Util.removeDotAndColon(that.address)+'-nodeLatencyContainer').remove();
            });

            function viewDestroy(){
            	$(document).off("view:Destroy", viewDestroy).off("pollerResume", globalPollinghandler);
            	that.rowView.cleanView(that.rowView);
                that.destroy();
            };

            function globalPollinghandler(event){
				event.data.model.historyInitialized = false;
				event.data.model.insertSliceHistory(event.data.model);

			};

            $(document).on("view:Destroy", viewDestroy);
            $(document).off("pollerResume", globalPollinghandler).on("pollerResume", {model : that}, globalPollinghandler);

        },

        insertSliceHistory: function(model){
			var startTime = model.lastTimestamp[(_.keys(model.lastTimestamp)[0])].toString();
			startTime = startTime.substr(startTime.indexOf(":") - 2, 8);
			AjaxManager.sendRequest(AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + '/latency_history/' + this.address + "?start_time="  + startTime,
				{async: true},
				successHandler,
				errorHandler
			);

			function successHandler(response){
				var updateCounts = response.latency_history.length;

        model.updateTimeZone();
				for(var i = 0; i < updateCounts ; i++){
					var latencyAvailable = false;
					var latency = response.latency_history[i];

					for(var attr in latency){
						latencyAvailable = true;
						break;
					}

					if(model.latencyAvailable && !latencyAvailable){
						latency = model.getNullInfo(new Date((model.latencyData['writes'][0].data[0].data[model.latencyData['writes'][0].data[0].data.length - 1].x) + 10000));
						latencyAvailable = true;
					}

					if(!model.latencyAvailable && latencyAvailable){
						var latencyHistory = [latency];
						latencyHistory = model.prependAndFillNullLatencyData(latencyHistory);
						model.pushLatencyInfoHistory(model, latencyHistory);
						model.latencyAvailable = true;
						model.rowView.initContainers(model);
					}

					if(model.latencyAvailable && latencyAvailable){
						model.shiftLatencyInfo(model, latency );
					}
				}

				if(model.latencyAvailable)
					model.rowView.render(model,model.latencyData);

				model.historyInitialized = true;
            };

            function errorHandler(response){
            	model.historyInitialized = true;
            }

		},

        pushLatencyInfoHistory: function(view,latencyHistory){
			var that = this;
			if(typeof latencyHistory !== 'undefined' && latencyHistory !== null){
				var currentLatencyTimestamp, lastTimestamp;
				for(var i=0; i<latencyHistory.length; i++){
					for (var attr in that.attrList) {
						if (attr) {
							currentLatencyTimestamp = latencyHistory[i][that.attrList[0]].timestamp;
							break
						}
					}
					if(currentLatencyTimestamp !== lastTimestamp) {
						view.pushLatencyInfo(view,latencyHistory[i]);
          }
					lastTimestamp = currentLatencyTimestamp;
				}
			}
        },

        pushLatencyInfo: function(view,latency){
			var that = this;

			if(typeof that.latencyData === 'undefined' || that.latencyData === null){
				that.latencyData = {};

				for(var attr in latency){
					that.latencyData[attr] = [];
					that.latencyData[attr].push({
						name : "Node_" + that.address.replace(/\./g,"_").replace(/\:/g,"_") + "_" + attr,
						title : attr,
						renderer : "stacked area",
						highlight : false,
						disabled : false,
						data : []
					});

					that.latencyData[attr].push({
						name : "Node_" + that.address.replace(/\./g,"_").replace(/\:/g,"_") + "_" + attr + "_ops",
						title : "Total Ops" + "  [" + attr + "]",
						subTitle : "Total Ops" + "  [" + attr + "]",
						renderer : "line",
						color : "#333",
						disabled : true,
						data : []
					});
				}
			}


			if(_.isEmpty(this.latencyDataDate)){
				var currentTime = this.getCurrentDate();
				for(var attr in latency){
					this.latencyDataDate[attr] = this.getCurrentDate();
				}
			}

            for(var attr in latency){

                var timestamp = this.getDateByTimestamp(latency[attr].timestamp_unix*1000);

				if(this.lastTimestamp[attr] != null){
					if((timestamp.getTime() - this.lastTimestamp[attr].getTime()) <= -10000){
            // TODO dont know the purpose of these
						// xxx this.latencyDataDate[attr].setDate( this.latencyDataDate[attr].getDate() + 1 );
						// xxx timestamp = new Date(this.latencyDataDate[attr].getFullYear() + "/" + (this.latencyDataDate[attr].getMonth() + 1) + "/" + this.latencyDataDate[attr].getDate() + " " + latency[attr].timestamp);
					}
				}

				this.lastTimestamp[attr] = timestamp;
				timestamp = +timestamp.getTime();

                that.legend = [];
				for(var i=0; i<latency[attr].data.length; i++){
					var bucket = "";

					for(var key in latency[attr].data[i]){
						bucket = key;
						break;
					}

					if(!(typeof that.latencyData[attr][0].data[i] !== 'undefined' && that.latencyData[attr][0].data[i].name === bucket)){
						that.latencyData[attr][0].data[i] = {name : bucket, title : bucket, color : that.colorScale[i], data : []};
					}

					var pct = null;
					var value = latency[attr].data[i][bucket].value;
					if(latency[attr].data[i][bucket].pct !== null)
						pct = latency[attr].data[i][bucket].pct.toFixed(2) + "%";

					that.latencyData[attr][0].data[i].data.push({x : timestamp, y : value, secondary : pct});
					that.legend.push({color : that.colorScale[i], title : bucket});
				}
				that.latencyData[attr][1].data.push({x : timestamp, y : latency[attr]["ops/sec"], secondary : "100.00%"});
				that.legend.push({color : "#333", title : "Ops/Sec"});
            }
        },

        shiftLatencyInfo: function(model,latency){
			if(latency !== null){
				var currentTime, lastTimestamp, currentLatencyTimestamp;

				for(var attr in model.latencyData){

					if(!_.isEmpty(this.latencyDataDate)){
						currentTime = this.latencyDataDate[attr];
					} else{
						currentTime = this.getCurrentDate();
					}
					currentLatencyTimestamp = currentLatencyTimestamp || latency[attr].timestamp;
					if(lastTimestamp == null){
						lastTimestamp = this.getDateByTimestamp(model.latencyData[attr][0].data[0].data[model.latencyData[attr][0].data[0].data.length - 1].x);
						var hours = (hours = lastTimestamp.getHours()) < 10 ? ("0" + hours) : hours;
						var minutes = (minutes = lastTimestamp.getMinutes()) < 10 ? ("0" + minutes) : minutes;
						var seconds = (seconds = lastTimestamp.getSeconds()) < 10 ? ("0" + seconds) : seconds;

						lastTimestamp = hours + ":" + minutes + ":" + seconds;
					}

					if(currentLatencyTimestamp !== lastTimestamp){
						for(var i=0; i< model.latencyData[attr][0].data.length; i++){
							model.latencyData[attr][0].data[i].data.shift();
						}
						model.latencyData[attr][1].data.shift();
					}
				}

        model.pushLatencyInfo(model,latency);
			}
        },

    updateWindow: function(timeWindowSize, fixTimeWindowSize) {
      this.rowView.updateWindow(this, this.latencyData, timeWindowSize, fixTimeWindowSize);
    },


		prependAndFillNullLatencyData: function(latencyResponse){
			var that = this;
			var latencyData = latencyResponse;
			var minDataPoints = 180;
			var firstTimestamp = '';
			var firstTimestampIndex = -1;

			for(var i=0, blank = true; i<latencyData.length && blank == true; i++){
				for(var attr in latencyData[i]){
					blank = false;
					that.attrList = _.intersection(that.attrList, _.keys(latencyResponse[i]));
					if (latencyData[i][attr]) {
						firstTimestamp = latencyData[i][attr].timestamp_unix*1000;
						firstTimestampIndex = i;
						break;
					}
				}
			}

			if(firstTimestampIndex == -1)
				return [];

            var timestamp = firstTimestamp;

			var lastTimestamp = firstTimestamp;

			for(var i = firstTimestampIndex + 1; i<latencyData.length; i++){
				var blank = true;
				for(var attr in latencyData[i]){
					blank = false;
					lastTimestamp = latencyData[i][attr].timestamp_unix*1000;
					break;
				}

				if(blank){
					newTimestamp = that.getDateByTimestamp(lastTimestamp);
					newTimestamp.setSeconds(newTimestamp.getSeconds() + 10);
          lastTimestamp = newTimestamp.getTime();
					latencyData[i] = that.getNullInfo(new Date(newTimestamp.getTime() + 10000));
				}
			}

			lastTimestamp = firstTimestamp;
			var missingPoints = Math.max(minDataPoints - latencyData.length, 0);
			var runIndex = 0 - missingPoints;
			newTimestamp = that.getDateByTimestamp(lastTimestamp);

			for(var i = Math.max(firstTimestampIndex, 0) - 1; i >= runIndex; i--){
				newTimestamp.setSeconds(newTimestamp.getSeconds() - 10);
        lastTimestamp = newTimestamp;
				if(i >= 0){
					latencyData[i] = that.getNullInfo(new Date(newTimestamp.getTime()));
				} else{
					latencyData.unshift(that.getNullInfo(new Date(newTimestamp.getTime())));
				}
			}

			return latencyData;
		},

		getNullInfo : function(timestamp){
			var that = this;
			var nullData = {'ops/sec' : null, data : [
					{'&#x2264;1ms'  : {'pct' : null, 'value' : null}},
					{'>1ms to &#x2264;8ms'  : {'pct' : null, 'value' : null}},
					{'>8ms to &#x2264;64ms'  : {'pct' : null, 'value' : null}},

					{'>64ms' : {'pct' : null, 'value' : null}}]
				};
			nullData.timestamp = (timestamp.getHours() < 10 ? ("0" + timestamp.getHours()) : ("" + timestamp.getHours())) + ":";
			nullData.timestamp += (timestamp.getMinutes() < 10 ? ("0" + timestamp.getMinutes()) : ("" + timestamp.getMinutes())) + ":";
			nullData.timestamp += (timestamp.getSeconds() < 10 ? ("0" + timestamp.getSeconds()) : ("" + timestamp.getSeconds()));
      nullData.timestamp_unix = Math.ceil(timestamp/1000);

			var stackPoint = {};

			for(var attr in that.attrList){
				stackPoint[that.attrList[attr]] = nullData;
			}

			return stackPoint;
		}


    });

    return NodeModel;
});




