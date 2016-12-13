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

define(["jquery", "underscore", "backbone", "d3", "timechart", "helper/timechart-helper", "config/view-config", "config/app-config"], function($, _, Backbone, D3, TimeChart, TimeseriesChart, ViewConfig, AppConfig){
    var ThroughputView = Backbone.View.extend({
        initialize: function(){
            this.el = this.options.el;
            this.chartDiv = this.options.chartDiv;
            this.legendDiv = this.options.legendDiv;
            this.xAxisDiv = this.options.xAxisDiv;
            this.slider = this.options.slider;
            this.tpsDiv = this.options.tpsDiv;
            this.chartType = this.options.chartType;
            this.chartID = null;
            
        },
        render: function(newData, oldData, numberOfDataPoints){
			if(newData !== null && Object.getOwnPropertyNames(newData).length > 0)
				TimeseriesChart.updateTimeseriesData(newData, oldData, this.chartID, this.legendDiv);
            if(!this.chartID){
                this.chartID = TimeseriesChart.initTimeSeriesChart(AMCGLOBALS.pageSpecific.charts[ this.chartType + "ChartType"], this.chartDiv, this.legendDiv, this.xAxisDiv, this.slider, ViewConfig.throughputChartConfig, oldData, numberOfDataPoints);
            }else{
                Util.checkVisibilityAndCall(this, function(){
                    TimeseriesChart.updateTimeSeriesChart(this.chartID, oldData, this.legendDiv, numberOfDataPoints);
                    TimeseriesChart.updateTPS(this.tpsDiv, oldData, this.chartType);
                });
            } 
        },

        initializeTPS: function(history){
            TimeseriesChart.initTPS(history, this.tpsDiv);
        },

        remove: function(){
            if(this.chartID){
                this.chartID.remove();
            }
        }
    });
    
    return ThroughputView;
});
