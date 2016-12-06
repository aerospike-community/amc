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

define(["jquery", "underscore", "backbone", "d3", "config/app-config", "helper/util","timechart"], function($, _, Backbone, D3, AppConfig, Util, TimeChart){

    var Timeseries = {
        updateTimeseriesData : function(newData, oldData, chartID, legendDiv){
            var newDataList = Timeseries.getNewAddressList(newData);
            var oldDataList = Timeseries.getOldAddressList(oldData);
            Timeseries.strToIntArr(newData);
            Timeseries.addMissingSeries(newDataList, oldDataList, newData);
            Timeseries.updateData(newData, oldData);
        },
        updateTimeSeriesChart : function(chartID, dataWithOptions, legendDiv, numberOfDataPoints){
            try{
                //var maxY = Timeseries.maxMultiLine(dataWithOptions, "y", 50);

                var timeFormat = "%H:%M:%S";
                chartID.configure({
                    timeWindowSize : (parseInt(window.AMCGLOBALS.persistent.snapshotTime) * 1000),
                    xAxisTickFormat : timeFormat,
                    timeInUTC : !Util.useLocalTimezone()
                });

                var data = Timeseries.getDataPoints(dataWithOptions, numberOfDataPoints);
                chartID.updateSeries(data);
            }catch(e){
                console.error(e);
            }
        },
        initTimeSeriesChart : function(chartType, chartDiv, legendDiv, xAxisChart, slider, chartConfig, dataWithOptions, numberOfDataPoints){
            try{
                Util.setTimezoneLabel();
                var timeFormat = "%H:%M:%S";
                var chartID = timechart({id : chartDiv, container : "#"+chartDiv});
                chartID.initialize({
                    chartWidth : ((window.innerWidth * 0.475) - 10 - 10),
                    chartHeight : 265 - 10 - 15,
                    marginLeft : 10,
                    marginTop : 10,
                    marginRight : 10,
                    marginBottom : 15,
                    xAxisOrient : 'bottom',
                    xAxisTickOrientation : 'bottom',
                    xAxisShowTickLines : true,
                    xAxisNumberOfTicks : 3,
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
                    timeWindowSize : (parseInt(window.AMCGLOBALS.persistent.snapshotTime) * 1000),
                    timeInUTC : (!Util.useLocalTimezone()),
                    xAxisTickFormat : timeFormat,
                    autoResize : true,
                    bubbleTemplate : (chartType === "nodewise" ? AMCGLOBALS.pageSpecific.charts.nodewiseBubbleTemplate : AMCGLOBALS.pageSpecific.charts.clusterwideBubbleTemplate)
                });

                var data = Timeseries.getDataPoints(dataWithOptions, numberOfDataPoints);
                chartID.updateSeries(data);
            }catch(e){
                console.error(e)
            }
            return chartID;
        },
        updateTPS : function(container,data, chartType){
            var successTotal = 0, total = 0;
            if(typeof window.AMCGLOBALS.persistent.tps === 'undefined'){
                window.AMCGLOBALS.persistent.tps = {};
            }
            var dataAvailable = false;
            for(var attr in data){
                dataAvailable = true;
                break;
            }
            if(AMCGLOBALS.pageSpecific.charts[chartType + "ChartType"] === "clusterwide"){
		var seriesSuccess = _.filter(data, function(series){ return series.name.indexOf("TPS_SUCCESS") !== -1; })[0];
                var seriesTotal = _.filter(data, function(series){ return series.name.indexOf("TPS_TOTAL") !== -1; })[0];
                successTotal += seriesSuccess.data[seriesSuccess.data.length - 1].y;
                total += seriesTotal.data[seriesTotal.data.length - 1].y;
            } else if(dataAvailable){
                for(var i=0; i < data.length; i++){
                    if( _.indexOf(window.AMCGLOBALS.persistent.selectedNodes, data[i].name) !== -1){
                        successTotal += data[i].data[data[i].data.length - 1].y;
                        total += data[i].data[data[i].data.length - 1].secondary;
                    }
                }

                window.AMCGLOBALS.persistent.tps[container] = {"success" : successTotal, "total" : total};
            }else if(typeof window.AMCGLOBALS.persistent.tps[container] !== 'undefined'){
                successTotal = window.AMCGLOBALS.persistent.tps[container].success;
                total = window.AMCGLOBALS.persistent.tps[container].total;
            }else{
                total = successTotal = null;

            }

            if(successTotal !== null){
                //var successWidth = Math.max(Math.floor(successTotal/total*100), 1);
                //var errorWidth = 100 - successWidth;
                var html  = "";
                    html += "<div style='color:#000; padding-bottom:3px;'>Total : " + (total.toFixed(2)) + " TPS</div>";
                    //html += "<div style='float:left; background-color:#0DCC24; display:inline-block; height:4px; width:" +successWidth+ "%'></div>";
                    //html += "<div style='float:left; background-color:#EE0000; display:inline-block; height:4px; width:" +errorWidth+ "%'></div>";
                    html += "<span style='color:#24CE3A; font-weight:bold; display:inline-block; padding:4px 0;'>Successful : " + (successTotal.toFixed(2)) + " TPS</span>";
                    //html += "<span style='color:#F53939; font-weight:bold; font-size:10px; display:inline-block; padding:4px; padding-bottom:0;'>Failed : " + (total - successTotal) + "</span>";

                $('#'+container).html(html);
            } else{
                $('#'+container).html("<div style='padding:10px; color:#999;'>Loading...</div>");
            }
        },

        initTPS: function(dataHistory, container){
            try{
                var total, successTotal;
                for(var node in dataHistory){
                    if(dataHistory[node].name === "TPS_TOTAL"){
                        total = dataHistory[node].data[dataHistory[node].data.length - 1].y;
                    } else if(dataHistory[node].name === "TPS_SUCCESS"){
                        successTotal =dataHistory[node].data[dataHistory[node].data.length - 1].y;
                    }
                    if(total != null && successTotal != null){
                        break;
                    }
                }

                var html  = "";
                    html += "<div style='color:#000; padding-bottom:3px;'>Total : " + (total.toFixed(2)) + " TPS</div>";
                    //html += "<div style='float:left; background-color:#0DCC24; display:inline-block; height:4px; width:" +successWidth+ "%'></div>";
                    //html += "<div style='float:left; background-color:#EE0000; display:inline-block; height:4px; width:" +errorWidth+ "%'></div>";
                    html += "<span style='color:#24CE3A; font-weight:bold; display:inline-block; padding:4px 0;'>Successful : " + (successTotal.toFixed(2)) + " TPS</span>";
                    //html += "<span style='color:#F53939; font-weight:bold; font-size:10px; display:inline-block; padding:4px; padding-bottom:0;'>Failed : " + (total - successTotal) + "</span>";

                $('#'+container).html(html);
            } catch(e){
                console.error(e);
            }
        },

        addNewSeries: function(oldData, newlyAddedNodes, titles){
            var newSeries = [];
            var i=0;
            for(var index in newlyAddedNodes){
                newSeries[i] = {};
                newSeries[i].name = newlyAddedNodes[index];
                newSeries[i].title = newlyAddedNodes[index];
                newSeries[i].disabled = !(_.contains(window.AMCGLOBALS.persistent.selectedNodes, newlyAddedNodes[index]) && (_.find(oldData, function(series){ return series.name.indexOf("TPS") !== -1; })).disabled);
                newSeries[i].color = window.AMCGLOBALS.persistent.nodesColorList[newlyAddedNodes[index]];
                newSeries[i].renderer = "line";

                if(titles != null && titles[newlyAddedNodes[index]] != null){
                    if(titles[newlyAddedNodes[index]].title != null){
                        newSeries[i].title = titles[newlyAddedNodes[index]].title;
                    }

                    if(titles[newlyAddedNodes[index]].subTitle != null){
                        newSeries[i].subTitle = titles[newlyAddedNodes[index]].subTitle;
                    }
                }

                if(typeof oldData[0].data !== 'undefined'){
                    newSeries[i].data = Timeseries.deepCopySeriesData(oldData[0].data);
                    oldData.push(newSeries[i]);
                }
                i++;
            }
        },

        deepCopySeriesData :function(data){
            var initData = [];
            for(var index in data){
                var xVal= data[index].x + 1 - 1;
                initData[index] = {
                  x:xVal,
                  y:null,
                };

                if(data[index].secondary !== undefined){
                    initData[index].secondary = null;
                }
            }
            return initData;
        },
        addMissingSeries: function(newList, oldList, newData){
            var missingNodes = _.without( _.difference(oldList, newList), "TPS_TOTAL", "TPS_SUCCESS");
            var missingKey;
            for(var node in newData){
                missingKey = newData[node].x;
                break;
            }

            var j = newList.length;
            for(var i in missingNodes){
                newList[j++] = missingNodes[i];
                newData[missingNodes[i]] = {x : missingKey, y : null, secondary : null};

            }
        },
        strToIntArr :function(newData){
            for(var add in newData){
                if(newData[add] !== null){
                    for(var eachTick in newData[add]){
                        if(newData[add][eachTick] !== null){
                            for(var key in newData[add][eachTick])
                                newData[add][eachTick][key] = +newData[add][eachTick][key];
                        }
                    }
                }
            }
        },
        getOldAddressList: function(oldData){
            var i=0;
            var name;
            var j=0;
            var oldList = [];
            for(var i in oldData){
                name = oldData[i].name;
                if(name !== ""){
                    oldList[j] = name;
                    j++;
                }
            }
            return oldList;
        },
        getNewAddressList: function(newData){
            var i=0;
            var newList = [];
            for(var newAddress in newData){
                newList[i] = newAddress;
                i++;
            }
            return newList;
        },
        updateData: function(newData, oldData){
            //var currentTime = Timeseries.fromDateTimetoUnix();
            if(!!newData && _.values(newData)[0] != null){
                var name;
                var successTPS = 0, totalTPS = 0;
                var timestamp;
                var tpsTotalIndex, tpsSuccessIndex;
                for(var nodeAddress in newData){
                    for(var i in oldData){
                        name = oldData[i].name;
                        if(name !== "" && name !== "TPS_TOTAL" && name !== "TPS_SUCCESS"){
                            if(name === nodeAddress && oldData[i].data.length > 0 && (+oldData[i].data[oldData[i].data.length - 1].x) < (+newData[nodeAddress].x)){
                                oldData[i].data.shift();
                                oldData[i].data.push(newData[nodeAddress]);
                                timestamp = newData[nodeAddress].x;

                                successTPS += newData[nodeAddress].y;
                                totalTPS += newData[nodeAddress].secondary;
                            }
                        } else if(name === "TPS_TOTAL"){
                            tpsTotalIndex = i;
                        } else if(name === "TPS_SUCCESS"){
                            tpsSuccessIndex = i;
                        }
                    }
                }

                if(timestamp != null){
                    oldData[tpsTotalIndex].data.shift();
                    oldData[tpsSuccessIndex].data.shift();
                    oldData[tpsTotalIndex].data.push({x : timestamp, y : totalTPS});
                    oldData[tpsSuccessIndex].data.push({x : timestamp, y : successTPS});
                }
            }
        },

        getDataPoints: function(data, maxDataPoints){
            var tempData = [];
            var latestStamp = parseInt((data[0].data[data[0].data.length - 1].x)/1000);
            var oldestStamp = latestStamp - window.AMCGLOBALS.persistent.snapshotTime;

            for(var i = 0; i < data.length; i++){
                tempData[i] = {};
                tempData[i].color = data[i].color;
                tempData[i].disabled = data[i].disabled;
                tempData[i].name = data[i].name;
                tempData[i].title = data[i].title;
                tempData[i].renderer = data[i].renderer;
                tempData[i].data = [];

                var j = data[i].data.length - 1;
                var workingStamp = latestStamp;

                while(j >= 0 && workingStamp >= oldestStamp){
                    tempData[i].data.unshift({x : data[i].data[j].x, y : data[i].data[j].y, secondary : data[i].data[j].secondary});
                    j--;
                    workingStamp--;
                }
            }
            return tempData;
        },

        fromDateTimetoUnix : function(dateTime){
            try{
                if(!dateTime){
                    dateTime = new Date();
                }
                var localTime = dateTime.getTime();
                return localTime;
            }catch(e){
                console.info(e.toString());
                return "";
            }
        },
        fromUnixToDateTime : function(unixTime){
            try{
                var localTime = unixTime.getTime();
                localTime = Math.floor( localTime );
                return localTime;
            }catch(e){
                console.info(e.toString());
                return "";
            }
        },
        initializeChartData : function(chartType, nodeList, maxDataPoints, chartStartTime, colorList, addTotalSeries, dataHistory, subTitle){
            var initDataWithOptions = [],
            val = null,
            tempData,
            tempName,
            tempColor,
            tempTime,
            maxTime = 0,
            TPSdataSuccess = [],
            TPSdataTotal = [],
            TPSdataInitialized = false,
            largestSeries = null,
            largestSeriesLength = 0;

            if(dataHistory != null){
                for(var node in dataHistory){
                    var stamp = +(dataHistory[node][dataHistory[node].length - 1].x);
                    if( stamp > maxTime){
                        maxTime = stamp;
                    }
                }

                largestSeriesLength = _.max( _.map( _.values(dataHistory), function(history){
                        return history.length;
                    }).concat([0])
                );

                largestSeries = _.find(dataHistory, function(history){
                    return history.length === largestSeriesLength;
                });
            }

            var dataPointAvailableIndex = maxDataPoints - largestSeriesLength;

            for(var nodeAddress in nodeList){
               try{
                    tempData = [];
                    tempName = nodeList[nodeAddress];
                    tempColor = window.AMCGLOBALS.persistent.nodesColorList[tempName];
                    var disableFlag = _.contains(window.AMCGLOBALS.persistent.selectedNodes,tempName) ? false : true;

                    if(largestSeries != null){
                        tempTime = +(largestSeries[0].x) - ((maxDataPoints - (largestSeriesLength + 1)) * 1000);
                    } else{
                        if(maxTime > 0){
                            tempTime = maxTime - ( maxDataPoints * 1000 );
                        } else{
                            tempTime = chartStartTime - ( maxDataPoints * 1000 );
                            maxTime = chartStartTime;
                        }
                    }

                    var seriesPointAvailableIndex = null;
                    if(dataHistory != null && dataHistory[nodeList[nodeAddress]] != null){
                        seriesPointAvailableIndex = maxDataPoints - dataHistory[nodeList[nodeAddress]].length;
                    }

                    for(var i=0 ; i< maxDataPoints; i++){
                            var tpsData = null;
                            if( i >= dataPointAvailableIndex && largestSeries != null){
                                var dataPointIndex = i - seriesPointAvailableIndex;

                                if( dataHistory[nodeList[nodeAddress]] != null && dataHistory[nodeList[nodeAddress]][dataPointIndex] != null){
                                    tpsData = dataHistory[nodeList[nodeAddress]][dataPointIndex];
                                } else {
                                    tpsData = {x: largestSeries[i - dataPointAvailableIndex].x, y: val, secondary: val};
                                }

                            } else{
                                tpsData = {x: tempTime, y: val, secondary: val};
                                tempTime = +tempTime + 1000;
                            }

                            if(addTotalSeries && !TPSdataInitialized){
                                TPSdataSuccess.push({
                                    x : tpsData.x,
                                    y : tpsData.y || 0
                                });
                                TPSdataTotal.push({
                                    x : tpsData.x,
                                    y : tpsData.secondary || 0
                                })
                            } else if(addTotalSeries){
                                TPSdataSuccess[i].y += tpsData.y;
                                TPSdataTotal[i].y += tpsData.secondary;
                            }

                            tempData.push(tpsData);
                    }

                    var seriesObj = {name:tempName, title:tempName, color:tempColor, data:tempData, disabled:(chartType === "clusterwide" ? true : disableFlag), renderer:"line"};

                    if(subTitle != null)
                        seriesObj.subTitle = subTitle;

                    initDataWithOptions.push(seriesObj);

                    TPSdataInitialized = true;
                }catch(e){
                    console.info('Error in initializing throughput data');
                }
            }

            if(addTotalSeries){
                initDataWithOptions.push({name : "TPS_TOTAL", title : "Total", color : "rgb(185, 238, 253)", data : TPSdataTotal, disabled: (chartType === "clusterwide" ? false : true), renderer: "area"});
                initDataWithOptions.push({name : "TPS_SUCCESS", title : "Success", color : "rgb(98, 180, 203)", data : TPSdataSuccess, disabled: (chartType === "clusterwide" ? false : true), renderer: "area"});
            }


            return {data : initDataWithOptions, latestTimestamp : maxTime};
        }

    };

    return Timeseries;
});
