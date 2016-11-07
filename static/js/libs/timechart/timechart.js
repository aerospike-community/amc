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


(function(){	
	var TimeChart = function(id,container){
		
		var that = this;
		
		this.id = id;
		this.parentContainer = container;
		
		if(typeof container !== 'undefined')
			this.el = d3.select(container).append("svg").attr("class","timeseries " + that.id + " widget");
		else
			return null;
		
		this.rawData = null;
		this.secondarySource = null;
		this.updateSecondaryChart = {};
		this.preProcessor = null;								//look into it;
		
		this.config = {};
		this.config.updateInterval = 0;
		this.config.fixedSnapshotLength = false;
		this.config.snapshotLength = 0;
		this.config.chartWidth = 0;
		this.config.chartHeight = 0;
		this.config.fixScaleY = false;
		this.config.scaleYCeilOffset = 0;
		this.config.scaleYFloorOffset = 0;
		this.config.fixScaleXWindowSize = false;
		this.config.ScaleXWindowSizeFromLatest = true;
		this.config.ScaleXWindowSize = 5000;		
		this.config.tickTimeFormat = "%M:%S";
		this.config.timeInUTC = false;
		this.config.showHoverBubble = false;
		this.config.hoverBubbleStyle = 'individual';
		this.config.renderer = "line";
		this.config.autoResize = false;
		this.rangeSlider;		
		this.config.yAxisZoomRange = [0, 100];
		
		this.config.margins = {};
		this.config.margins.left = 0;
		this.config.margins.right = 0;
		this.config.margins.top = 0;
		this.config.margins.bottom = 0;
		
		this.config.axis = {};
		this.config.axis.x = {};
		this.config.axis.y = {};
		
		this.config.axis.x.tickOrientation = "bottom";
		this.config.axis.x.showTickLine = false;
		this.config.axis.x.numberOfTicks = 10;
		this.config.axis.x.orient = "bottom";
		
		this.config.axis.x.tickTranslate = {};
		this.config.axis.x.tickTranslate.dx = 0;
		this.config.axis.x.tickTranslate.dy = 0;
		
		this.config.axis.x.extremes = {};
		this.config.axis.x.extremes.max = 0;
		this.config.axis.x.extremes.min = 0;

		this.config.axis.x.visibility = true;
		
		this.config.axis.y.tickOrientation = "left";
		this.config.axis.y.showTickLine = false;
		this.config.axis.y.numberOfTicks = 10;
		this.config.axis.y.orient = "left";
		
		this.config.axis.y.tickTranslate = {};
		this.config.axis.y.tickTranslate.dx = 0;
		this.config.axis.y.tickTranslate.dy = 0;
		
		this.config.axis.y.extremes = {};
		this.config.axis.y.extremes.max = 10;
		this.config.axis.y.extremes.min = 0;

		this.config.axis.y.visibility = true;
		
		that.config.bubbleTemplate = "<div class='timeseries %%ID%% bubble body'>" + 
									 "<div class='timeseries %%ID%% bubble header' style='background-color : %%COLOR%% !important;'>%%TITLE%%</div>" +
									 "<div class='timeseries %%ID%% bubble innerBody'>" + 
									 "<span class='timeseries %%ID%% bubble x date'>%%DATE%%/%%month%%/%%YEAR%%</span>" + 
									 "&nbsp&nbsp&nbsp" +
									 "<span class='timeseries %%ID%% bubble x time'>%%HOUR%%:%%MINUTE%%:%%SECOND%%</span>" +
									 "<span class='timeseries %%ID%% bubble y value'>%%VALUE%%</span>" +
									 "</div>" + 
									 "</div>";

		this.x = d3.time.scale().range([0,that.config.chartWidth]);
		this.y = d3.scale.linear().domain([that.config.axis.y.extremes.min,that.config.axis.y.extremes.max]).range([that.config.chartHeight, 0]);
		this.dataGrid = null;
		this.newSeries = null;
		this.data = new Array();
		
		this.axis = {};
		this.axis.xAxis = d3.svg.axis()
			.scale(that.x)
			.orient(that.config.axis.x.tickOrientation)
			.tickSize(0)
			.ticks(that.config.axis.x.numberOfTicks)
			.tickFormat(d3.time.format(that.config.tickTimeFormat));

		this.axis.yAxis = d3.svg.axis()
			.orient(that.config.axis.y.orient)
			.tickSize(0)
			.ticks(that.config.axis.y.numberOfTicks)
			.scale(that.y);
		
		this.uiUpdateRequestInProgress = false;
		
		//To be removed
		this.updateRequired = true;
		this.animationRunning = false;
		this.yAxisUpdateRequired = true;
		this.mousePosition= null;
		
		TimeChart.prototype.charts[id] = this;
	}
	
	TimeChart.prototype.charts = {};
	
	TimeChart.prototype.getChartById = function(id){
		
		if(typeof TimeChart.prototype.charts[id] !== 'undefined')
			return TimeChart.prototype.charts[id]
	
		return null;
	}
	
	TimeChart.prototype.getChartByContainer = function(container){
		
		for(var Id in TimeChart.prototype.charts){
			if($(TimeChart.prototype.charts[Id].parentContainer).is(container))
				return TimeChart.prototype.charts[Id];
		}
		return null;
	}

	TimeChart.prototype.remove = function(){
		var that = this;
		try{
			if(that.config.autoResize){
				window.removeEventListener("resize",that.resizeHandler,true);
			}
			
			if(typeof that.rangeSlider !== 'undefined'){
				$(that.rangeSlider).slider("destroy");
				delete that.rangeSlider;
			}
			
			for(var chart in that.updateSecondaryChart){
				that.removeSecondaryChart(that.updateSecondaryChart[chart].id);
			}
			
			var thisHTMLDOM = $(that.parentContainer).children();
			that.rawData = null;
			delete TimeChart.prototype.charts[that.id];
			thisHTMLDOM.remove();
		} catch(e){
			console.error(e);
		}
	}
	
	TimeChart.prototype.disableRangeSlider = function(){
		if(typeof that.rangeSlider !== 'undefined')
			$(rangeSlider).slider("destroy");
	}
	
	TimeChart.prototype.enableRangeSlider = function(container){
		var that = this;
		this.rangeSlider = container;
		$(container).slider({
			orientation: "vertical",
			range: true,
			min : 0,
			max : 100,
			step : 0.1,
			values: [ 0, 100 ],
			slide: function( event, ui ) {
				var handle = $(ui.handle);
				
				var floorVal = ui.values[0];
				var ceilVal = ui.values[1];
				
				if(floorVal == ceilVal){
					if($(container).find(".ui-slider-handle:first").is(handle)){
						floorVal = ceilVal - 0.1;
					}else {
						ceilVal = floorVal + 0.1;
					}					
				}
				
				$(container).find(".ui-slider-handle:first").attr("data-scaleValue", floorVal);
				$(container).find(".ui-slider-handle:last").attr("data-scaleValue", ceilVal);
				
				that.config.yAxisZoomRange[0] = floorVal;
				that.config.yAxisZoomRange[1] = ceilVal;
				
				that.updateSeries(that.rawData);
			},
			create: function(event, ui){
				var handles = $(container).find(".ui-slider-handle");
				handles.first().attr("data-scalevalue","0");
				handles.last().attr("data-scalevalue","100");
			}
		});
	}
	
	TimeChart.prototype.configure = function(param){
		var that = this;
		var containerUpdate = false;
		var xAxisReArrange = false;
		var yAxisReArrange = false;

		if(param.hasOwnProperty("updateInterval"))	this.config.updateInterval = param.updateInterval;
		if(param.hasOwnProperty("fixedSnapshotLength"))	this.config.fixedSnapshotLength = param.fixedSnapshotLength;
		if(param.hasOwnProperty("snapshotLength"))	this.config.snapshotLength = param.snapshotLength;
		if(param.hasOwnProperty("fixScaleY"))	this.config.fixScaleY = param.fixScaleY;
		if(param.hasOwnProperty("scaleYCeilOffset"))	this.config.scaleYCeilOffset = param.scaleYCeilOffset;
		if(param.hasOwnProperty("scaleYFloorOffset"))	this.config.scaleYFloorOffset = param.scaleYFloorOffset;
		if(param.hasOwnProperty("hoverBubbleStyle"))	this.config.hoverBubbleStyle = param.hoverBubbleStyle;
		if(param.hasOwnProperty("fixTimeWindowSize"))	this.config.fixScaleXWindowSize = param.fixTimeWindowSize;
		if(param.hasOwnProperty("fixTimeWindowSizeFromNow"))	this.config.ScaleXWindowSizeFromLatest = param.fixTimeWindowSizeFromNow;
		if(param.hasOwnProperty("timeWindowSize"))	this.config.ScaleXWindowSize = param.timeWindowSize;
		if(param.hasOwnProperty("bubbleTemplate"))	this.config.bubbleTemplate = param.bubbleTemplate;

		if(param.hasOwnProperty("xAxisVisible"))	this.config.axis.x.visibility = param.xAxisVisible;
		if(param.hasOwnProperty("yAxisVisible"))	this.config.axis.y.visibility = param.yAxisVisible;

		if(param.hasOwnProperty("chartWidth") && !(param.hasOwnProperty("autoResize") && param.autoResize)){
			this.config.chartWidth = param.chartWidth;
			containerUpdate = xAxisReArrange = yAxisReArrange = true;
		}

		if(param.hasOwnProperty("chartHeight") && !(param.hasOwnProperty("autoResize") && param.autoResize)){
			this.config.chartHeight = param.chartHeight;
			containerUpdate = xAxisReArrange = yAxisReArrange = true;
		}

		if(param.hasOwnProperty("marginTop")){
			this.config.margins.top = param.marginTop;
			containerUpdate = xAxisReArrange = yAxisReArrange = true;
		}

		if(param.hasOwnProperty("marginBottom")){
			this.config.margins.bottom = param.marginBottom;
			containerUpdate = xAxisReArrange = yAxisReArrange = true;
		}

		if(param.hasOwnProperty("marginLeft")){
			this.config.margins.left = param.marginLeft;
			containerUpdate = xAxisReArrange = yAxisReArrange = true;
		}

		if(param.hasOwnProperty("marginRight")){
			this.config.margins.right = param.marginRight;
			containerUpdate = xAxisReArrange = yAxisReArrange = true;
		}

		if(param.hasOwnProperty("xAxisTickOrientation")){
			this.config.axis.x.tickOrientation = param.xAxisTickOrientation;
			xAxisReArrange = true;
		}

		if(param.hasOwnProperty("xAxisNumberOfTicks")){
			this.config.axis.x.numberOfTicks = param.xAxisNumberOfTicks;
			xAxisReArrange = true;
		}
		
		if(param.hasOwnProperty("xAxisTickFormat")){
			this.config.tickTimeFormat = param.xAxisTickFormat;
			xAxisReArrange = true;
		}

		if(param.hasOwnProperty("xAxisOrient")){
			this.config.axis.x.orient = param.xAxisOrient;
			xAxisReArrange = true;
		}

		if(param.hasOwnProperty("timeInUTC")){
			this.config.timeInUTC = param.timeInUTC;
			xAxisReArrange = true;
		}

		if(param.hasOwnProperty("xAxisShowTickLines")){
			this.config.axis.x.showTickLine = param.xAxisShowTickLines;
		}

		if(param.hasOwnProperty("xAxisTickTranslate")){
			this.config.axis.x.tickTranslate.dx = param.xAxisTickTranslate.x;
			this.config.axis.x.tickTranslate.dy = param.xAxisTickTranslate.y;
		}

		if(param.hasOwnProperty("yAxisTickOrientation")){
			this.config.axis.y.tickOrientation = param.yAxisTickOrientation;
			yAxisReArrange = true;
		}

		if(param.hasOwnProperty("yAxisNumberOfTicks")){
			this.config.axis.y.numberOfTicks = param.yAxisNumberOfTicks;
			yAxisReArrange = true;
		}

		if(param.hasOwnProperty("yAxisOrient")){
			this.config.axis.y.orient = param.yAxisOrient;
			yAxisReArrange = true;
		}

		if(param.hasOwnProperty("yAxisShowTickLines")){
			this.config.axis.y.showTickLine = param.yAxisShowTickLines;
		}

		if(param.hasOwnProperty("yAxisTickTranslate")){
			this.config.axis.y.tickTranslate.dx = param.yAxisTickTranslate.x;
			this.config.axis.y.tickTranslate.dy = param.yAxisTickTranslate.y;
		}

		if(this.config.fixScaleY && param.hasOwnProperty("yAxisExtremes")){
			this.config.axis.y.extremes.max = param.yAxisExtremes.max;
			this.config.axis.y.extremes.min = param.yAxisExtremes.min;
		}

		if(param.hasOwnProperty("showHoverBubble")){
			if(param.showHoverBubble){
				this.config.showHoverBubble = true;
				containerUpdate = true;
			}else{
				this.config.showHoverBubble = false;
				this.disableHoverBubble();
				this.mousePosition = null;
			}
		}

		if(containerUpdate){
			this.el
				.attr("width", this.config.chartWidth + this.config.margins.left + this.config.margins.right)
				.attr("height", this.config.chartHeight + this.config.margins.top + this.config.margins.bottom);

			if(this.config.showHoverBubble){
				this.disableHoverBubble();
				this.enableHoverBubble();
			}
		}

		if(xAxisReArrange){
			var that = this;
			
			this.x.range([0,that.config.chartWidth]);

			this.axis.xAxis
				.scale(that.x)
				.orient(that.config.axis.x.tickOrientation)
				.tickSize(0)
				.ticks(that.config.axis.x.numberOfTicks);

			if(that.config.timeInUTC)
				this.axis.xAxis.tickFormat(d3.time.format.utc(that.config.tickTimeFormat));
			else
				this.axis.xAxis.tickFormat(d3.time.format(that.config.tickTimeFormat));
				
			this.el.select(".timeseries."+that.id+".x.axis.line").remove();
			
			this.el.select("#TimeSeries-"+that.id+"-viewport").append("line")
				.attr("class","timeseries "+that.id+" x axis line")
				.attr("x1",0)
				.attr("y1",0)
				.attr("y2",0)
				.attr("x2",that.config.chartWidth)
				.attr('transform', ('translate(0,'+(that.config.axis.x.orient === 'top' ? 0 : that.config.chartHeight)+')'));
		}

		if(yAxisReArrange){
			var that = this;

			this.y.domain([that.config.axis.y.extremes.min,that.config.axis.y.extremes.max]).range([that.config.chartHeight, 0]);

			this.axis.yAxis
				.scale(that.y)
				.orient(that.config.axis.y.tickOrientation)
				.tickSize(0)
				.ticks(that.config.axis.y.numberOfTicks);

			// this.yAxisUpdateRequired = true;
		}

		this.setSVGDefs();
	}

	TimeChart.prototype.stackLayout = function(param){
	
		var that = this;
		var lastCategoryCounter = 0;
		var stack = [];
		var highlight = [];

		for(var category = 0; category < param.data.length ; category++){
			var stackObj = {};
			var lineObj = {};

			stackObj.name = param.name + "_" + param.data[category].name;
			stackObj.color = param.data[category].color;
			stackObj.degree2ID = param.name;
			stackObj.data = [];
			
			if(typeof param.data[category].title !== 'undefined')
				stackObj.subTitle = param.data[category].title;

			for(var prop in param){
				if(!stackObj.hasOwnProperty(prop))
					stackObj[prop] = param[prop];
			}

			if(typeof param.highlight !== 'undefined' && param.highlight && param.renderer.indexOf('area') !== -1){
				lineObj.name = param.name + "_" + param.data[category].name + "_highlighter";
				lineObj.color = d3.rgb(param.data[category].color).darker().toString();
				lineObj.renderer = "line";
				lineObj.disabled = false;
				lineObj.renderBubble = false;
				lineObj.data = [];
			}

			for(var j = 0; j < param.data[category].data.length ; j++){
				
				var total = 0;
				if(param.renderer.indexOf('normalized') !== -1){
					for(var cat in param.data){
						total += param.data[cat].data[j].y;
					}
				}

				if(total == 0)
					total = 1;

				var topY = null;
				var bottomY = null;

				if(param.data[category].data[j].y !== null){
					var lastY1 = 0;
					if(lastCategoryCounter > 0){
						lastY1 = stack[lastCategoryCounter - 1].data[j].y1;
					}

					topY = ((param.data[category].data[j].y/total) * 
							(param.renderer.indexOf('normalized') === -1 ? 1 : 100) + 
							lastY1
							);

					bottomY = lastY1;
				}
				
				stackObj.data.push({ 
					x : param.data[category].data[j].x,
					y1 : topY,
					y0 : bottomY,
					y : param.data[category].data[j].y,
					secondary : param.data[category].data[j].secondary
				});

				if(typeof param.highlight !== 'undefined' && param.highlight  && param.renderer.indexOf('area') !== -1){
					lineObj.data.push({
						x : param.data[category].data[j].x,
						y : topY
					});
				}
			}

			stack.push(stackObj);
			lastCategoryCounter++;

			if(typeof param.highlight !== 'undefined' && param.highlight  && param.renderer.indexOf('area') !== -1){
				highlight.push(lineObj);
			}
		}
		return stack.concat(highlight);
	}

	TimeChart.prototype.areaLayout = function(param){
		var that = this;
		var area = [];
		var areaObj = {};
		this.clone(areaObj,param);
		area.push(areaObj);

		if(typeof param.highlight && param.highlight){
			var lineObj = {
				name : param.name + "_highlighter", 
				color : d3.rgb(param.color).darker().toString(),
				renderer : "line",
				disabled : false,
				data : areaObj.data,
				renderBubble : false
			};
			area.push(lineObj);
		}
		return area;
	}

	TimeChart.prototype.linearLayout = function(param){
		var that = this;
		var linear = [];
		var tempObj = {};
		this.clone(tempObj,param);
		linear.push(tempObj);
		return linear;
	}

	TimeChart.prototype.updateSeries = function(datafeed){
		
		var that = this;
		var param = [];
		var expand = false;
		var expandWidth = 0;
		var dataPoints = 0;
		var normalized = false;
		var datanodes = [];
		
		that.rawData = [];
		that.clone(that.rawData,datafeed);
		that.clone(datanodes, datafeed);
		
		if(typeof that.preProcessor === "function"){
			datanodes = that.preProcessor(datanodes);
		}
		
		for(var chart in that.updateSecondaryChart){
			that.updateSecondaryChart[chart].updateSeries(that.rawData);
		}
		
		if(datanodes[0].renderer.indexOf('stack') === -1){
			that.config.axis.x.extremes.max = datanodes[0].data[datanodes[0].data.length - 1].x;
			that.config.axis.x.extremes.min = datanodes[0].data[0].x ;
		} else{
			for(var key in datanodes[0].data){
				that.config.axis.x.extremes.max = datanodes[0].data[key].data[datanodes[0].data[key].data.length - 1].x;
				that.config.axis.x.extremes.min = datanodes[0].data[key].data[0].x ;
				break;
			}
		}

		if(that.config.fixScaleY === false){
			that.config.axis.y.extremes.min = 0;
			that.config.axis.y.extremes.max = 0;
		}

		// Calculation for x scale first, Doing so reduces no. of iterations required to calculate y
		datanodes.forEach(function(d){
			if(!d.disabled){
				if(d.renderer === 'line' || d.renderer === 'area' || d.renderer === 'bar'){
					dataPoints = d.data.length;

					if(that.config.fixScaleXWindowSize){
						if(that.config.ScaleXWindowSizeFromLatest){
							that.config.axis.x.extremes.max = Math.max(d.data[dataPoints - 1].x, that.config.axis.x.extremes.max);
						} else{
							that.config.axis.x.extremes.min = Math.min(d.data[0].x, that.config.axis.x.extremes.min);
						}
					} else{
						that.config.axis.x.extremes.max = Math.max(d.data[dataPoints - 1].x, that.config.axis.x.extremes.max);
						that.config.axis.x.extremes.min = Math.min(d.data[0].x, that.config.axis.x.extremes.min);
					}
					
				} else{
					for(var cat in d.data){
						dataPoints = d.data[cat].data.length;
						that.config.axis.x.extremes.max = Math.max(that.config.axis.x.extremes.max, d.data[cat].data[dataPoints - 1].x);
						that.config.axis.x.extremes.min = Math.min(that.config.axis.x.extremes.min, d.data[cat].data[0].x);
					}
				}

				if(that.config.fixScaleXWindowSize){
					if(that.config.ScaleXWindowSizeFromLatest){
						that.config.axis.x.extremes.min = that.config.axis.x.extremes.max - parseInt(that.config.ScaleXWindowSize);
					} else{
						that.config.axis.x.extremes.max  = that.config.axis.x.extremes.min + parseInt(that.config.ScaleXWindowSize);
					}
				}

			}
		})

		datanodes.forEach(function(d){
			if(!d.disabled){
				if(that.config.fixScaleY === false && !normalized){
					if(d.renderer === 'line' || d.renderer === 'area' || d.renderer === 'bar'){
						var dMax = d3.max(d.data, function(w){
							if(w.x >= that.config.axis.x.extremes.min && w.x <= that.config.axis.x.extremes.max){
								return w.y;
							}
							return null;
						});
						var dMin = d3.min(d.data, function(w){
							if(w.x >= that.config.axis.x.extremes.min && w.x <= that.config.axis.x.extremes.max){
								return w.y;
							}
							return null;
						});

						if(typeof dMax !== 'undefined'){
							that.config.axis.y.extremes.max = Math.max(that.config.axis.y.extremes.max, dMax);
						}
						if(typeof dMin !== 'undefined'){
							that.config.axis.y.extremes.min = Math.min(that.config.axis.y.extremes.min, dMin);
						}
					} else{
						var cumulativeMax = 0;

						for(var cat in d.data){
							cumulativeMax += d3.max(d.data[cat].data, function(w){
								if(w.x >= that.config.axis.x.extremes.min && w.x <= that.config.axis.x.extremes.max){
									return w.y;
								}
								return null;
							});

							that.config.axis.y.extremes.min = Math.min(that.config.axis.y.extremes.min, d3.min(d.data[cat].data, function(w){
									if(w.x >= that.config.axis.x.extremes.min && w.x <= that.config.axis.x.extremes.max){
										return w.y;
									}
									return null;
								})
							);
						}

						that.config.axis.y.extremes.max = Math.max(that.config.axis.y.extremes.max, cumulativeMax);
					}
				}

				if(d.renderer.indexOf("bar") != -1){
					expand = true;
					expandWidth = (that.x.invert(d.gutterWidth) - that.x.invert(0)) || 0;
				}
			}
		});
		
		if(expand){
			var width = ((that.config.axis.x.extremes.max - that.config.axis.x.extremes.min) - ((dataPoints + 1) * expandWidth))/dataPoints;
			that.config.axis.x.extremes.max += Math.floor(width/2) + expandWidth;
			that.config.axis.x.extremes.min -= Math.floor(width/2) - expandWidth;
		}

		for(var i=0;i<datanodes.length;i++){
			if(!datanodes[i].disabled){
				
				if(datanodes[i].renderer.indexOf("normal") != -1){
					normalized = true;
				}

				if(datanodes[i].renderer === 'stacked area' || datanodes[i].renderer === 'normalized stacked area'){
					param = param.concat(that.stackLayout(datanodes[i]));
				} else if(datanodes[i].renderer === 'area'){
					param = param.concat(that.areaLayout(datanodes[i]));
				} else if(datanodes[i].renderer === 'bar'){
					param = param.concat(that.barLayout(datanodes[i]));
				} else if(datanodes[i].renderer === 'stacked bar' || datanodes[i].renderer === 'normalized stacked bar'){
					var temp = that.stackLayout(datanodes[i]);
					for(var each = 0; each < temp.length; each++)
						param = param.concat(that.barLayout(temp[each]));
				} else if(datanodes[i].renderer === 'line'){
					param = param.concat(that.linearLayout(datanodes[i]));
				}			
			}	
		}
		
		if(typeof param !== 'undefined' && param.length > 0){
		
			that.adjustSeries(param);

			for(var i=0; i<param.length; i++){
				for(var j=0; j<that.data.length; j++){			
					if(param[i].name === that.data[j].name){
						that.data[j].color = param[i].color;
						that.updatePlotArray(param[i].data,j);
						break;
					}
				}
			}
		} else{
			that.adjustSeries([{name : 'nullSeries', color : '#000', data : []}]);

			var timeNow = new Date().getTime();
			that.config.axis.x.extremes.max = timeNow - 1000;
			that.config.axis.x.extremes.min = timeNow - 5000;
			if(that.config.fixScaleY == false){
				that.config.axis.y.extremes.min = 0;
				that.config.axis.y.extremes.max = 10; 
			}
		}
		
		
		
		if(this.config.showHoverBubble){
			that.dataGrid = null;
			that.dataGrid = that.fillGrid();
		}

		// if(that.config.fixScaleXWindowSize){
		// 	if(that.config.ScaleXWindowSizeFromLatest){
		// 		that.config.axis.x.extremes.min = that.config.axis.x.extremes.max - parseInt(that.config.ScaleXWindowSize);
		// 	} else{
		// 		that.config.axis.x.extremes.max  = that.config.axis.x.extremes.min + parseInt(that.config.ScaleXWindowSize);
		// 	}
		// }

		if(normalized){
			that.config.axis.y.extremes.max = 100;
			that.config.axis.y.extremes.min = 0;
		}

		that.updateRequired = true;

		that.requestUiUpdate();
		delete param;
		param = null;
	}
	
	TimeChart.prototype.expandToContainerSize = function(input){
		var that = this;
		
		var container = $(that.parentContainer);
		var height = container.height() - that.config.margins.top - that.config.margins.bottom;
		var width = container.width() - that.config.margins.left - that.config.margins.right;

		that.configure({chartWidth : width, chartHeight : height});
		if(typeof that.rawData !== 'undefined' && that.rawData !== null)
			that.updateSeries(that.rawData);
	}

	TimeChart.prototype.initialize = function(param){
		
		var that = this;
	
		if(typeof param !== 'undefined'){
			this.configure(param);
		}
		
		this.setSVGDefs();
		
		if(param.hasOwnProperty("autoResize") && param.autoResize){
			that.config.autoResize = param.autoResize;
			that.expandToContainerSize();			
			
			that.resizeHandler = function(){
				that.expandToContainerSize(that);
			}
			
			window.addEventListener('resize', that.resizeHandler, true);
		}		
		
		if(this.config.showHoverBubble){
			this.disableHoverBubble();
			this.enableHoverBubble();
		}
	}

	TimeChart.prototype.setSVGDefs = function(){
		var that = this;
		var defs = this.el.select("defs");
		var elem;

		if(!defs[0][0]) defs = this.el.append("defs");
				
		if(!(elem = defs.select("#TimeSeries-"+that.id+"-vclip").select("rect"))[0][0]){
			elem = defs
				.append("clipPath")
				.attr("id", "TimeSeries-"+that.id+"-vclip")
				.append("rect");
		}

		elem.attr("width", that.config.chartWidth)
			.attr("height", that.config.chartHeight + that.config.margins.top + that.config.margins.bottom)
			.attr("y",-that.config.margins.top);
			
		if(!(elem = defs.select("#TimeSeries-"+that.id+"-hclip").select("rect"))[0][0]){
			elem = defs
				.append("clipPath")
				.attr("id", "TimeSeries-"+that.id+"-hclip")
				.append("rect");
		}

		elem.attr("width", (2 * that.config.chartWidth))
			.attr("height", that.config.chartHeight);
			
		if(!(elem = defs.select("#TimeSeries-"+that.id+"-xaxismaskgrad"))[0][0]){
			elem = defs.append("linearGradient")
				.attr("id","TimeSeries-"+that.id+"-xaxismaskgrad");
			
			elem.append("stop")
				.attr("offset",0)
				.attr("stop-color","#fff")
				.attr("stop-opacity",0);
						
			elem.append("stop")
				.attr("offset",0.1)
				.attr("stop-color","#fff")
				.attr("stop-opacity",1);
		}
		
		if(!(elem = defs.select("#TimeSeries-"+that.id+"-xaxismask").select("rect"))[0][0]){
			elem = defs.append("mask")
				.attr("id","TimeSeries-"+that.id+"-xaxismask")
				.append("rect")
					.attr("fill","url(#TimeSeries-"+that.id+"-xaxismaskgrad)");
		}

		elem.attr("width",that.config.chartWidth)
			.attr("height",(that.config.chartHeight + that.config.margins.top + that.config.margins.bottom))
			.attr("y",(that.config.axis.x.orient === "top" ? -that.config.margins.top : -(that.config.chartHeight + that.config.margins.top)));

		if(!(elem = this.el.select("#TimeSeries-"+that.id+"-viewport"))[0][0]){
			elem = this.el.append("g")
				.attr("id","TimeSeries-"+that.id+"-viewport")
				.attr("clip-path", "url(#TimeSeries-"+that.id+"-vclip)");
		}
		
		elem
			.attr("transform","translate(" + that.config.margins.left + "," + that.config.margins.top + ")");
						
		if(!(elem = this.el.select("#TimeSeries-"+that.id+"-tweener"))[0][0]){
			elem = this.el.select("#TimeSeries-"+that.id+"-viewport")
				.append("g")
					.attr("id","TimeSeries-"+that.id+"-tweener");
		}
			
		if(!(elem = elem.select(".timeseries." +that.id+".datapaths"))[0][0]){
			elem = this.el.select("#TimeSeries-"+that.id+"-tweener")
				.append("g")
					.attr("class","timeseries " +that.id+" datapaths")
					.attr("clip-path", "url(#TimeSeries-"+that.id+"-hclip)");
		}
		
		if(!(elem = this.el.select("g.timeseries."+that.id+".x.axis"))[0][0]){
			elem = this.el.select("#TimeSeries-"+that.id+"-tweener")
				.append("g")
					.attr("class","timeseries "+that.id+" x axis");

			elem.append("g").attr("mask","url(#TimeSeries-" + that.id + "-xaxismask)");
		}

		elem
			.attr('transform', ('translate(0,'+(that.config.axis.x.orient === 'top' ? 0 : that.config.chartHeight)+')'));
	
		if(!(elem = this.el.select("g.timeseries."+that.id+".y.axis"))[0][0]){
			elem = this.el.append("g")
				.attr("class","timeseries "+that.id+" y axis");

			elem.append("g");

		}

		elem
			.attr("transform",("translate(" + (that.config.margins.left + (that.config.axis.y.orient === 'left' ? 0 : that.config.chartWidth)) + ","+ that.config.margins.top +")"));
				
		this.yAxisUpdateRequired = true;

	}

	TimeChart.prototype.adjustSeries = function(param){
		var i,j,that=this;
		var addIndex = new Array();
		var removeIndex = new Array();
	
		for(i=0; i<param.length; i++){
			for(j=0; j<that.data.length; j++)	
				if(param[i].name === that.data[j].name)		break;
			if(j == that.data.length)	addIndex.push(i);
		}
		
		for(j=0; j<that.data.length; j++){
			for(i=0; i<param.length; i++)	
				if(param[i].name === that.data[j].name)		break;
			if(i == param.length)	removeIndex.push(j);
		}
		
		addIndex.forEach(function(d){
				that.data.push(param[d]);
		});
		
		removeIndex.forEach(function(d,i){
			that.data.splice(d - i, 1);
		});
		
		addIndex = null;
		removeIndex = null;
	}

	TimeChart.prototype.updatePlotArray = function(param,index){
		this.data[index].data = param;
	}

	TimeChart.prototype.uiUpdate = function(){
		var that = this;
		
		if(that.animationRunning == false || !that.config.updateInterval){
			
			if(that.uiUpdateRunRemaining > 0){
				that.uiUpdateRunRemaining--;
			}
			
			if(!that.config.updateInterval){
				this.x.domain([that.config.axis.x.extremes.min,that.config.axis.x.extremes.max]);
			} else{
				this.x.domain([that.config.axis.x.extremes.min,that.config.axis.x.extremes.max - 2000]);
			}			
			
			if(that.config.fixScaleY == false || typeof that.axis.yAxis === 'undefined' || that.yAxisUpdateRequired){
				var ceilValue = 0; 
				var floorValue = 0;
				
				if(typeof that.config.scaleYCeilOffset === 'number'){
					ceilValue = that.config.scaleYCeilOffset;
				} else if(typeof that.config.scaleYCeilOffset === 'string' && that.config.scaleYCeilOffset.indexOf("%") != -1){
					ceilValue = parseInt(that.config.scaleYCeilOffset.substr(0,that.config.scaleYCeilOffset.indexOf("%")));
					ceilValue = that.config.axis.y.extremes.max * ceilValue / 100;
				} else{
					ceilValue = parseInt(that.config.scaleYCeilOffset);
				}
				
				if(typeof that.config.scaleYFloorOffset === 'number'){
					floorValue = that.config.scaleYFloorOffset;
				} else if(typeof that.config.scaleYFloorOffset === 'string' && that.config.scaleYFloorOffset.indexOf("%") != -1){
					floorValue = parseInt(that.config.scaleYFloorOffset.substr(0,that.config.scaleYFloorOffset.indexOf("%")));
					floorValue = that.config.axis.y.extremes.max * floorValue / 100;
				} else{
					floorValue = parseInt(that.config.scaleYFloorOffset);
				}
				
				var min = (that.config.axis.y.extremes.min - floorValue);
				var max = (that.config.axis.y.extremes.max + ceilValue);
				
				if(min == max){
					max = min + 10;
				}

				var range = max - min;
				max = min + range*that.config.yAxisZoomRange[1]/100;
				min = min + range*that.config.yAxisZoomRange[0]/100;
			
				this.y.domain([min, max]);
			}
			if(that.id === "chart")
				console.info("here");
			var dataPaths = this.el.select(".timeseries."  + (that.id) + ".datapaths")
								.selectAll(".timeseries."  + (that.id) + ".path")
									.data(that.data,function(d) {return d.name; });

			dataPaths.enter()
				.append("path")																//ENTER
					.attr("class",function(d) {return "timeseries " + (that.id) + " path " + d.name;});					
			
			dataPaths																		//UPDATE
				.attr("d",function(d) {return that.getDataPath(d);})
				.style("stroke",function(d) { 
					if(d.renderer === 'line')
						return d.color;
					else
						return 'none';
				})
				.style("fill",function(d){
					if(d.renderer !== 'line')
						return d.color;
					else
						return 'none';
				});
				
			dataPaths.exit()
					.remove();
			
			if(that.config.axis.x.visibility){

				if(!(that.el.select("g.timeseries." +that.id+".x.axis").select("g")[0][0])){
					that.el.select("g.timeseries." +that.id+".x.axis").append("g");
				}

				if(!(this.el.select(".timeseries."+that.id+".x.axis.line"))[0][0]){
					this.el.select("#TimeSeries-"+that.id+"-viewport").append("line")
						.attr("class","timeseries "+that.id+" x axis line")
						.attr("x1",0)
						.attr("y1",0)
						.attr("y2",0)
						.attr("x2",that.config.chartWidth)
						.attr('transform', ('translate(0,'+(that.config.axis.x.orient === 'top' ? 0 : that.config.chartHeight)+')'));
				}

				that.axis.xAxis.scale(that.x);
				that.el.select("g.timeseries." +that.id+".x.axis").select("g").call(that.axis.xAxis);

				that.el.select("g.timeseries." +that.id+".x.axis").select("g").selectAll("line").remove();
				that.el.select("g.timeseries." +that.id+".x.axis").select("g").selectAll("text").attr("class","timeseries " + that.id + " x axis ticktext");
			
				if(that.config.axis.x.showTickLine){
					that.el.select("g.timeseries." +that.id+".x.axis").select("g").selectAll("g").append("line")
						.attr("class","timeseries " + that.id + " x axis tickline")
						.attr("y2",function() { return that.config.axis.x.orient === 'top' ? that.config.chartHeight : -that.config.chartHeight;});
				}
			} else{
				that.el.select("g.timeseries." +that.id+".x.axis").select("g").remove();
				this.el.select("#TimeSeries-"+that.id+"-viewport").select("line").remove();
			}
				
			if(!!that.config.updateInterval && that.config.updateInterval > 50){
				this.el.select("#TimeSeries-"+that.id+"-tweener")
					.attr("transform",function() {that.animationRunning = true;  return "translate(0,0)";})
					.transition()
						.duration(that.config.updateInterval)
						.ease("linear")
						.attr("transform","translate(" + (that.x(that.config.axis.x.extremes.max - 1000)-that.x(that.config.axis.x.extremes.max)) + ",0)")
							.each("end", function() { that.animationRunning = false; });
			}
		
			
			if(that.config.axis.y.visibility){
				if(that.config.fixScaleY == false || that.yAxisUpdateRequired){
					if(!(that.el.select(".timeseries." +that.id+".y.axis").select("g")[0][0])){
						that.el.select(".timeseries." +that.id+".y.axis").append("g");
					}

					if(!(that.el.select("g.timeseries." + that.id + ".y.axis").select("line.timeseries."+that.id+".y.axis.line")[0][0])){
						that.el.select("g.timeseries." + that.id + ".y.axis")
							.append("line")
								.attr("class","timeseries "+that.id+" y axis line")
								.attr("x1",0)
								.attr("x2",0)
								.attr("y1",0)
								.attr("y2",that.config.chartHeight);
					}

					that.axis.yAxis.scale(that.y);
					that.el.select(".timeseries." +that.id+".y.axis").select("g")
						.call(that.axis.yAxis);

					that.el.select(".timeseries." +that.id+".y.axis").select("g").selectAll("line").remove();
					that.el.select(".timeseries." +that.id+".y.axis").select("g").selectAll("text").attr("class","timeseries " + that.id + " y axis ticktext");
					
					if(that.config.axis.y.showTickLine){
						that.el.select(".timeseries." +that.id+".y.axis").select("g").selectAll("g").append("line")
							.attr("class","timeseries " + that.id + " y axis tickline")
							.attr("x2",function() { return that.config.axis.y.orient === 'left' ? that.config.chartWidth : -that.config.chartWidth;});
					}
					that.yAxisUpdateRequired = false;
				}
			} else{
				that.el.select("g.timeseries." + that.id + ".y.axis").select("g").remove();
				that.el.select("g.timeseries." + that.id + ".y.axis").select("line.timeseries."+that.id+".y.axis.line").remove();
			}
					
			if(that.config.showHoverBubble && !!that.mousePosition){
				var timeNow = new Date();
				var diff = parseInt(timeNow.getTime()) - parseInt(that.mousePosition.time.getTime());
				that.mousePosition.x = new Date(parseInt(that.mousePosition.x.getTime()) + diff);
				that.mousePosition.time = timeNow;
				that.reDrawBubble(that.mousePosition.x,that.mousePosition.y);
				timeNow = null;
				diff = null;
			}
			
			return true;
			
		} else{
			// setTimeout(function(){that.uiUpdate(true);},25);
			return false;
		}
	}
	
	TimeChart.prototype.requestUiUpdate = function(){
		//Combines multiple uiUpdate() calls to a single update call, as and when next update is possible.
		//Reduces number of uiUpdate() calls per update.
		
		var that = this;
		
		if(!that.uiUpdateRequestInProgress){
			that.uiUpdateRequestInProgress = true;
			if(that.uiUpdate()){
				that.uiUpdateRequestInProgress = false;
			}else {
				setTimeout(function(){
					that.uiUpdateRequestInProgress = false; 
					that.requestUiUpdate();
				},25);
			}
		}
	}

	TimeChart.prototype.getDataPath = function(series){
		var i=0;
		var path = "";
		var that =this;
		var renderer;

		switch(series.renderer){
			case 'line' : 
					renderer = d3.svg.line()
						.x(function(d){ return that.x(d.x); })
						.y(function(d){ return that.y(d.y); })
						.defined(function(d) { 
							if(d.y === null) 
								return false;
							else
								return true;
						});
					break;

			case 'area' :
					renderer = d3.svg.area()
					    .x(function(d)  { return that.x(d.x); })
					    .y0(function()  { return that.y(that.config.axis.y.extremes.min); })
					    .y1(function(d) { return that.y(d.y); })
					    .defined(function(d) { 
							if(d.y === null) 
								return false;
							else
								return true;
						});
					break;

			case 'stacked area' : 
			// case 'normalized stacked area' : 
					renderer = d3.svg.area()
						.x(function(d)  { return that.x(d.x); })
					    .y0(function(d)  { return that.y(d.y0); })
					    .y1(function(d) { return that.y(d.y1); })
					    .defined(function(d) { 
							if(d.y1 === null || d.y0 === null) 
								return false;
							else
								return true;
						});
					break;

			// case 'bar' :
			case 'stacked bar' :
			// case 'normalized stacked bar' : 
					renderer = function(data){
						var path = "";
						var i = 0;

						while(data[i].y1 === null) i++;

						for(; i < data.length; i++){
							if(data[i].y1 !== null){
								path += "M" + that.x(data[i].x0) + "," + that.y(data[i].y0);
								path += "L" + that.x(data[i].x0) + "," + that.y(data[i].y1);
								path += "L" + that.x(data[i].x1) + "," + that.y(data[i].y1);
								path += "L" + that.x(data[i].x1) + "," + that.y(data[i].y0);
							}
						}

						path += path + "Z";

						return path;
					}
		
		}	

		return renderer(series.data);
	}

	TimeChart.prototype.enableHoverBubble = function(){
		var that = this;
		that.config.showHoverBubble = true;
		that.dataGrid = null;
		that.dataGrid = that.fillGrid();
		that.addBubbleControl();

		var control = that.el.select("rect.timeseries."+that.id+".bubbleControl");		
			
		$(control[0][0]).on('mousemove',function(e){
			var offset = $(that.parentContainer).offset(); 
			var x = that.x.invert(e.pageX - offset.left);
			var y = that.y.invert(e.pageY - offset.top);
			var domainX = that.x.domain();
			var domainY = that.y.domain();
			
			if( domainX[0] < x && x < domainX[1] && domainY[0] < y && y < domainY[1]){
				that.mousePosition = null;
				that.mousePosition = new Object();
				that.mousePosition.x = x;
				that.mousePosition.y = y;
				that.mousePosition.time = null;
				that.mousePosition.time = new Date();
				that.reDrawBubble(x,y);
			}
		});
		
		$(control[0][0]).on('mouseout',function(){
			that.removeBubble();
			that.mousePosition = null;
		});
	}

	TimeChart.prototype.disableHoverBubble = function(){
		var that = this;
		that.removeBubble();
		d3.selectAll('.timeseries.' + that.id + '.bubbleControl').remove();
		that.showHoverBubble = false;
	}

	TimeChart.prototype.removeBubble = function(){
		var that = this;
		d3.select(that.el[0].parentNode).selectAll(".timeseries." +that.id+".bubble").remove();
	}

	TimeChart.prototype.reDrawBubble = function(x,y){
		var that = this;
		var xClose = that.closestIndex(that.dataGrid, x.getTime());
		var yClose, bubbleData, yClosest;
		var bubble = that.el[0][0].parentNode;
		var template = "";
		var bubbleHTML = "";
		var templateVar = [];
		var lastEnd = 0;
		var containerOffset = $(that.parentContainer).offset();
		that.removeBubble();
		
		xClose = parseInt(xClose);
		yClose = parseFloat(that.closestIndex(that.dataGrid[xClose], y));
		
		var coord = that.getClosestInRange(that.dataGrid, x.getTime(), y, Math.ceil( Math.sqrt( Math.pow(that.x(xClose) - that.x(x), 2) + Math.pow(that.y(yClose) - that.y(y), 2) ) ));
		xClose = coord[0];
		yClose = yClosest = coord[1];

		if(that.config.hoverBubbleStyle.indexOf('individual') != -1){

			if(typeof that.dataGrid[xClose] !== 'undefined' && typeof that.dataGrid[xClose][yClose] !== 'undefined'){
				bubbleData = that.dataGrid[xClose][yClose];

				xClose = new Date(xClose);

				if(typeof bubbleData !== 'undefined'){
					that.el.select(".timeseries." +that.id+".datapaths")
						.append("g")
						.attr("class","timeseries "+that.id+" bubble")
						.append("circle")
							.attr("cx",that.x(xClose))
							.attr("cy",that.y(yClose))
							.attr("r",2)
							.style("fill","#000");

					that.el.select(".timeseries." +that.id+".datapaths").select(".timeseries." +that.id+".bubble")
						.append("circle")
							.attr("cx",that.x(xClose))
							.attr("cy",that.y(yClose))
							.attr("r",3)
							.style("stroke",bubbleData.COLOR)
							.style("stroke-width",2)
							.style("fill","none")
							.transition()
								.ease("cubic")
								.attr("r",10)
								.style("stroke-width",4);

					if(that.config.axis.y.visibility){
						that.el.select(".timeseries." +that.id+".datapaths").select(".timeseries." +that.id+".bubble")
							.append("line")
								.attr("x1",function() { 
											return (that.config.axis.y.orient === 'right' ? that.x(that.config.axis.x.extremes.max) : that.x(that.config.axis.x.extremes.min));
										})
								.attr("y1",that.y(yClose))
								.attr("x2",that.x(xClose))
								.attr("y2",that.y(yClose))
								.style("stroke",d3.rgb(bubbleData.COLOR).darker())
								.style("opacity",1)
								.style("stroke-width",1);
					}
					
					if(that.config.axis.x.visibility){		
						that.el.select(".timeseries." +that.id+".datapaths").select(".timeseries." +that.id+".bubble")
							.append("line")
								.attr("x1",that.x(xClose))
								.attr("y1",function() { 
											return (that.config.axis.x.orient === 'top' ? that.y(that.config.axis.y.extremes.max) : that.y(that.config.axis.y.extremes.min)) + that.config.margins.top;
										})
								.attr("x2",that.x(xClose))
								.attr("y2",that.y(yClose))
								.style("stroke",d3.rgb(bubbleData.COLOR).darker())
								.style("opacity",1)
								.style("stroke-width",1);
					}
						
					template = that.config.bubbleTemplate;
					lastEnd = 0;
					for(var index = template.indexOf("%%"); index != -1; index = template.indexOf("%%", index + 1)){
						templateVar.push(index);
						
						if(templateVar.length == 2){
							var start = templateVar.shift() + 2;
							var end = templateVar.shift();
							
							bubbleHTML += template.substr(lastEnd,start - lastEnd - 2) + bubbleData[template.substr(start,end - start)];				
							lastEnd = end + 2;
						}
					}

					/*** Check check ***/
					var evaluationIndex;
					while((evaluationIndex = bubbleHTML.indexOf("%eval%")) !== -1){
						var openingParanthesis = evaluationIndex + 6;
						var closingParenthesis = openingParanthesis;
						var open = 1;
						var openIndex = openingParanthesis + 1;
						while(open > 0){
							var closeIndex = openIndex + bubbleHTML.substr(openIndex).indexOf(")");
							var opencount = bubbleHTML.substr(openIndex, closeIndex - openIndex).match(/\(/g);
							opencount = opencount === null? 0 : opencount.length;
							openIndex = closeIndex + 1;
							if(opencount > 0){
								open += opencount - 1;
							} else{
								open--;
							}
							closingParenthesis = openIndex;
						}
						openingParanthesis += 1;
						closingParenthesis -= 1;
						var value = eval(bubbleHTML.substr(openingParanthesis, closingParenthesis - openingParanthesis));
						bubbleHTML = bubbleHTML.substr(0, openingParanthesis - 7) + value + bubbleHTML.substr(closingParenthesis + 1);
					}
				}
			}
		} else if(that.config.hoverBubbleStyle.indexOf('combined') != -1){
			
			var config = that.config.hoverBubbleStyle.split(":")[1];
			var templateConfig = {};
			templateConfig.sortUpon = 'yAccessor';
			templateConfig.orderBy = 'INC';
			
			if(typeof config !== 'undefined'){
				config = config.split(",");
			
				for(var i=0 ; i<config.length; i++){
					var key = config[i].split("=")[0];
					var value = config[i].split("=")[1];
					templateConfig[key] = value;
				}
			}
			
			
			var elem;
			if(!(elem = that.el.select(".timeseries." +that.id+".datapaths").select("g"))[0][0])
				elem = that.el.select(".timeseries." +that.id+".datapaths")
					.append("g")
					.attr("class","timeseries "+that.id+" bubble");
			
			if(that.config.axis.x.visibility){		
				elem.append("line")
						.attr("x1",that.x(xClose))
						.attr("y1",that.y(0))
						.attr("x2",that.x(xClose))
						.attr("y2",0)
						.style("stroke","#444")
						.style("opacity",1)
						.style("stroke-width",1);
			}
			
			var individualTemplate = "", indTemStart, indTemEnd;
			indTemStart = that.config.bubbleTemplate.indexOf("%%individual_template%%");
			if(indTemStart != -1){
				indTemEnd = that.config.bubbleTemplate.indexOf("%%individual_template%%",indTemStart + 1);
				individualTemplate = that.config.bubbleTemplate.substr(indTemStart + 23, indTemEnd - indTemStart - 23);
			}
			
			yClose = that.closestIndex(that.dataGrid[xClose],y);
			
			bubbleData = that.dataGrid[xClose][yClose];
			if(typeof bubbleData !== 'undefined'){
				yClose = parseFloat(yClose);
				var xCloseTime = xClose;
				
				template = that.config.bubbleTemplate.substr(0,indTemStart);
				lastEnd = 0;
				for(var index = template.indexOf("%%"); index != -1; index = template.indexOf("%%", index + 1)){
					templateVar.push(index);
					
					if(templateVar.length == 2){
						var start = templateVar.shift() + 2;
						var end = templateVar.shift();
						
						bubbleHTML += template.substr(lastEnd,start - lastEnd - 2) + bubbleData[template.substr(start,end - start)];				
						lastEnd = end + 2;
					}
				}
				
				bubbleHTML += template.substr(lastEnd,template.length - lastEnd);
				
				template = "";
			}
			
			var yIndex = [];
			
			for(var yClose in that.dataGrid[xClose]){
				
				if(yIndex.length == 0){
					yIndex.push(yClose);
				}else {
					var sortUpon = templateConfig.sortUpon;
					
					var index = 0;
					
					for(; index < yIndex.length ; index++){
						if(templateConfig.orderBy === 'INC'){
							if(that.dataGrid[xClose][yIndex[index]][sortUpon] > that.dataGrid[xClose][yClose][sortUpon])
								break;
						} else{
							if(that.dataGrid[xClose][yIndex[index]][sortUpon] < that.dataGrid[xClose][yClose][sortUpon])
								break;
						}
					}
	
					yIndex.splice(index,0,yClose);
				}
			}
			
			for(var i = 0; i < yIndex.length ; i++){
			
				if(typeof that.dataGrid[xClose] !== 'undefined' && typeof that.dataGrid[xClose][yIndex[i]] !== 'undefined'){
					var bubbleData = that.dataGrid[xClose][yIndex[i]];
					
					yClose = parseFloat(yIndex[i]);
					xCloseTime = new Date(xClose);
					
					if(typeof bubbleData !== 'undefined'){
						

						elem.append("circle")
								.attr("cx",that.x(xCloseTime))
								.attr("cy",that.y(yClose))
								.attr("r",2)
								.style("fill","#000");

						elem.append("circle")
								.attr("cx",that.x(xCloseTime))
								.attr("cy",that.y(yClose))
								.attr("r",3)
								.style("stroke",bubbleData.COLOR)
								.style("stroke-width",2)
								.style("fill","none");
												
						
						template = individualTemplate;
						lastEnd = 0;
						if(yClose === yClosest)
							bubbleHTML += "<div class='" + that.id + " bubble highlighted'>";
							
						for(var index = template.indexOf("%%"); index != -1; index = template.indexOf("%%", index + 1)){
							templateVar.push(index);
							
							if(templateVar.length == 2){
								var start = templateVar.shift() + 2;
								var end = templateVar.shift();
								
								
								bubbleHTML += template.substr(lastEnd,start - lastEnd - 2) + bubbleData[template.substr(start,end - start)];
	
								lastEnd = end + 2;
							}
						}
						
						bubbleHTML += template.substr(lastEnd,template.length - lastEnd);
						
						if(yClose == yClosest)
							bubbleHTML += "</div>";
					}
					
				}
				
			}
			bubbleHTML += that.config.bubbleTemplate.substr(indTemEnd + 23, that.config.bubbleTemplate.length - indTemEnd - 1);

			xCloseTime = null;
		}
		var bubbleLeft = that.x(xClose) + containerOffset.left + that.config.margins.left + 30 ;
		var bubbleTop = that.y(yClose) + containerOffset.top;

		$(bubble)
				.append("<div class='timeseries "+that.id+" bubble container' " + "style='left:0px; top : 0px;'>" +
						bubbleHTML + "</div>"
				);

		xClose = null;
		yClose = null;
		bubbleData = null;

		if($('div.timeseries.'+that.id+'.bubble.container').length > 0){

			var bubbleWidth = +$('div.timeseries.'+that.id+'.bubble.container').width();
			var bubbleHeight = +$('div.timeseries.'+that.id+'.bubble.container').height();
			

			var chartWidth = +$(that.parentContainer).width();
			var chartHeight = +$(that.parentContainer).height();

			if((bubbleLeft + bubbleWidth - containerOffset.left) > chartWidth){
				bubbleLeft = bubbleLeft - bubbleWidth - that.config.margins.left - that.config.margins.right - 60;
			}

			if(bubbleTop + bubbleHeight > containerOffset.top + chartHeight){
				bubbleTop = containerOffset.top + chartHeight - bubbleHeight - that.config.margins.bottom;
			} else if(bubbleTop < containerOffset.top){
				bubbleTop = containerOffset.top + that.config.margins.top;
			}
			bubbleTop -= $(document).scrollTop();
			bubbleLeft -= $(document).scrollLeft();
			$('div.timeseries.'+that.id+'.bubble.container').css("top",Math.max(bubbleTop,0)).css("left", Math.max(bubbleLeft,0) );
		}

	}

	TimeChart.prototype.closestIndex = function(dataArray,value){
		var min,close = 0;
		
		for(var index in dataArray){
			if(Math.abs(index - value) < min || typeof min === 'undefined'){
				min = Math.abs(index - value);
				close = index;
			}
		}
		return close;
	}

	TimeChart.prototype.getClosestInRange = function(dataArray, x, y, deviation){
		var that = this;
		var xValues = [];
		var yValues = [];
		var dTime = that.x.invert(deviation).getTime() - that.x.invert(0).getTime();
		var minX = x - dTime;
		var maxX = x + dTime;
		var xClose, yClose;
		
		for(var index in dataArray){
			index = parseInt(index);
			if(index >= minX && index <= maxX){
				xValues.push(index);
			}
		}

		var minDeviation;
		for(var i = 0; i<xValues.length; i++){
			var ty = that.closestIndex(dataArray[xValues[i]], y);

			var xSquared = Math.pow(that.x(xValues[i]) - that.x(x), 2);
			var ySquared = Math.pow(that.y(ty) - that.y(y), 2);

			var currentDeviation = Math.round(Math.sqrt( xSquared + ySquared ));
			if( currentDeviation < minDeviation || typeof minDeviation === 'undefined'){
				minDeviation = currentDeviation;
				xClose = xValues[i];
				yClose = ty;
			}
		}

		return [xClose, parseFloat(yClose)];
	}
		
	TimeChart.prototype.fillGrid = function(){
		var that = this;
		that.dataGrid = null;
		var dataGrid = {};
		that.data.forEach(function(d,i){
			if(typeof d.renderBubble === 'undefined' || d.renderBubble == true){
				d.data.forEach(function(t){
					var xAccessor = null;
					if(d.renderer.indexOf('bar') != -1)
						xAccessor = Math.floor(((+t.x0) + (+t.x1))/2);
					else
						xAccessor = t.x;

					if(typeof dataGrid[xAccessor] === 'undefined')
						dataGrid[xAccessor] = {};
					
					var yAccessor = null;

					if(d.renderer === 'stacked area' || d.renderer === 'normalized stacked area' || d.renderer === 'bar' || d.renderer === 'stacked bar' || d.renderer === 'normalized stacked bar')
						yAccessor = t.y1;
					else
						yAccessor = t.y;
					
					if(typeof dataGrid[xAccessor][yAccessor] !== 'undefined'){
						var max;
						for(var index in dataGrid[xAccessor]){
							if(typeof max === 'undefined')
								max = parseFloat(index);
							else
								max = Math.max(max,index);
						}
						yAccessor = 0.00001 + max;
					}

					if(yAccessor != null){
						var timestamp = new Date(+xAccessor);
						
						dataGrid[xAccessor][yAccessor] = {};
						
						if(that.config.timeInUTC){
							dataGrid[xAccessor][yAccessor].HOUR = timestamp.getUTCHours() < 10 ? ("0" + timestamp.getUTCHours()) : timestamp.getUTCHours();
							dataGrid[xAccessor][yAccessor].MINUTE = timestamp.getUTCMinutes() < 10 ? ("0" + timestamp.getUTCMinutes()) : timestamp.getUTCMinutes();
							dataGrid[xAccessor][yAccessor].SECOND = timestamp.getUTCSeconds() < 10 ? ("0" + timestamp.getSeconds()) : timestamp.getUTCSeconds();
							dataGrid[xAccessor][yAccessor].MILLISECOND = timestamp.getUTCMilliseconds() < 100 ? 
								(timestamp.getUTCMilliseconds() < 10 ? ("00" + timestamp.getUTCMilliseconds()) : ("0" + timestamp.getUTCMilliseconds())) : timestamp.getUTCMilliseconds();
							dataGrid[xAccessor][yAccessor].DATE = timestamp.getUTCDate();
							dataGrid[xAccessor][yAccessor].DAY = (["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"])[timestamp.getUTCDay()];
							dataGrid[xAccessor][yAccessor].MONTH = (["January","February","March","April","May","June","July","August","September","October","November","December"])[timestamp.getUTCMonth()];
							dataGrid[xAccessor][yAccessor].YEAR = timestamp.getUTCFullYear();
						} else{
							dataGrid[xAccessor][yAccessor].HOUR = timestamp.getHours() < 10 ? ("0" + timestamp.getHours()) : timestamp.getHours();
							dataGrid[xAccessor][yAccessor].MINUTE = timestamp.getMinutes() < 10 ? ("0" + timestamp.getMinutes()) : timestamp.getMinutes();
							dataGrid[xAccessor][yAccessor].SECOND = timestamp.getSeconds() < 10 ? ("0" + timestamp.getSeconds()) : timestamp.getSeconds();
							dataGrid[xAccessor][yAccessor].MILLISECOND = timestamp.getMilliseconds() < 100 ? 
								(timestamp.getMilliseconds() < 10 ? ("00" + timestamp.getMilliseconds()) : ("0" + timestamp.getMilliseconds())) : timestamp.getMilliseconds();
							dataGrid[xAccessor][yAccessor].DATE = timestamp.getDate();
							dataGrid[xAccessor][yAccessor].DAY = (["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"])[timestamp.getDay()];
							dataGrid[xAccessor][yAccessor].MONTH = (["January","February","March","April","May","June","July","August","September","October","November","December"])[timestamp.getMonth()];
							dataGrid[xAccessor][yAccessor].YEAR = timestamp.getFullYear();
						}
						
						if(dataGrid[xAccessor][yAccessor].HOUR > 11)
							dataGrid[xAccessor][yAccessor].hour = (dataGrid[xAccessor][yAccessor].HOUR - 12) + " PM";
						else
							dataGrid[xAccessor][yAccessor].hour = dataGrid[xAccessor][yAccessor].HOUR + " AM";
						
						dataGrid[xAccessor][yAccessor].day = dataGrid[xAccessor][yAccessor].DAY.substr(0,3);
						dataGrid[xAccessor][yAccessor].month = dataGrid[xAccessor][yAccessor].MONTH.substr(0,3);
						dataGrid[xAccessor][yAccessor].ID = that.id;
						dataGrid[xAccessor][yAccessor].ORDER = i;
	
						var val = t.y;
						if(typeof val === 'number')
							val = val.toFixed(2);
						dataGrid[xAccessor][yAccessor].VALUE = val;
						
						if(typeof t.secondary !== 'undefined'){
							var val = t.secondary;
							if(typeof val === 'number')
								val = val.toFixed(2);
							dataGrid[xAccessor][yAccessor].SECONDARY = val;
						}
						
						if(typeof d.name !== 'undefined'){
							dataGrid[xAccessor][yAccessor].NAME = d.name;
						}
						
						if(typeof d.color !== 'undefined'){
							dataGrid[xAccessor][yAccessor].COLOR = d.color;
						}
						
						if(typeof d.title !== 'undefined'){
							dataGrid[xAccessor][yAccessor].TITLE = d.title;
						}
						
						if(typeof d.subTitle !== 'undefined'){
							dataGrid[xAccessor][yAccessor].SUBTITLE = d.subTitle;
						}
					}
				});
			}
		});
		return dataGrid;
	},

	TimeChart.prototype.addBubbleControl = function(){
		var that = this;
		var elem = this.el.select("rect.timeseries."+that.id+".bubbleControl");
		if(!elem[0][0]){
			elem = that.el.append("rect")
				.attr("class","timeseries " + (that.id) + " bubbleControl")
				.style("fill","rgba(255,255,255,0)");
		}
		elem.attr("x",that.config.margins.left)
			.attr("y",0)
			.attr("height",that.config.chartHeight + that.config.margins.top + that.config.margins.bottom)
			.attr("width",that.config.chartWidth);
	},

	TimeChart.prototype.clone = function(destination, source) {
		var that = this;
        for (var property in source) {
            if (typeof source[property] === "object" && source[property] !== null) { 
				
				if(typeof destination[property] === 'undefined'){
					if(Array.isArray(source[property]))
						destination[property] = [];
					else
						destination[property] = {};
				}
				
                that.clone(destination[property], source[property]);
            } else {
                destination[property] = source[property];
            }
        }
    },
	
	TimeChart.prototype.addSecondaryChart = function(param){
		var that = this;
		var id, container, chart;
		
		if(param.hasOwnProperty("id")){
			id = param.id;
			chart = TimeChart.prototype.getChartById(id);
		}
		
		if(param.hasOwnProperty("container")){
			container = param.container;
			
			if(!chart)
				chart = TimeChart.prototype.getChartByContainer(container);
		}

		if(!!chart){
			if(typeof that.updateSecondaryChart[chart.id] === 'undefined'){
				that.updateSecondaryChart[chart.id] = chart;
				chart.updateFromSecondarySource(that.id);
				if(param.hasOwnProperty("preProcessor") && typeof param.preProcessor === "function"){
					chart.preProcessor = param.preProcessor;
				}

				if(that.rawData != null){
					chart.updateSeries(that.rawData);
				}
			}
			return that.updateSecondaryChart;
		}
		
		return null;		
	}
	
	TimeChart.prototype.removeSecondaryChart = function(id){
		var that = this;
		
		var chart = TimeChart.prototype.getChartById(id);
		if(!!chart){
			delete that.updateSecondaryChart[chart.id];
			chart.preProcessor = null;
			return that.updateSecondaryChart;
			}
		return null;
	}
	
	TimeChart.prototype.removeSecondarySource = function(){
		if(!that.secondarySource)
			that.secondarySource.removeSecondaryChart(that.id);
		
		that.secondarySource = null;
	}
	
	TimeChart.prototype.updateFromSecondarySource = function(id){
		var that = this;
		
		var chart = TimeChart.prototype.getChartById(id);
		
		if(!chart)
			return null;
		
		if(that.secondarySource != null)
			that.secondarySource.removeSecondaryChart(that.id);
			
		that.secondarySource = chart;
	}
	
	window.timechart = function(param){
		
		var id, container, chart;
		
		if(param.hasOwnProperty("id")){
			id = param.id;
			chart = TimeChart.prototype.getChartById(id);
		}
		
		if(param.hasOwnProperty("container")){
			container = param.container;
			
			if(!chart)
				chart = TimeChart.prototype.getChartByContainer(container);
		}

		if(!!chart){
				return chart;
		}
		
		if(typeof id !== 'undefined' && typeof container !== 'undefined'){
			var newChart = new TimeChart(id, container);
			
			if(typeof newChart !== 'undefined'){
				return newChart;
			} else{
				return null;
			}
		}
		
		return null;
	}
}).call(this);