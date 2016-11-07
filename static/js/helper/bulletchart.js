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

define(["jquery", "underscore", "backbone", "d3", "helper/util", "config/app-config"], function($, _, Backbone, D3, Util, AppConfig){
    var BulletChart = {
        initialize: function(container, bulletChartConfig, tickLabelData, usedData, availablePct, propName, usedSize){
                    var chartWidth = 130;
                    var chartHeight = 70;
                    var bulletHeight = 20;
                    var used = +usedData[0];
                    if(typeof used === 'undefined' || isNaN(used)){
                        $(container).html("N/A");
                        return;
                    }
                    var free = 100 - used;
                    
                    var hwm = +tickLabelData[0][0];
                    var stopWrites = +tickLabelData[1][0];
                    
                    if(used>100 || hwm>100 || stopWrites>100){
                        $(container).html(used+"%, "+hwm+"%, "+stopWrites+"%");
                        return;
                    }
            
                    var usedClass = "used-rect-blue";
              
                    var chart =  d3.select(container)
                        .append("svg")
                        .attr("class","chart")
                        .attr("width", chartWidth)
                        .attr("height", chartHeight)
                        .append("g")
                            /*.attr("transform", "translate(10,15)")*/
                            .attr("transform", "translate(10,25)")
                        ;

                    var xScale = d3.scale.linear()
                        .domain([0,100])
                        .range([0,chartWidth - 30])
                        ;

                    chart.append("svg:rect")
                        .attr('class', 'outer-rect')
                        .attr("rx", 2)
                        .attr("ry", 2)
                        .attr("width",xScale(100))
                        .attr("height", bulletHeight)
                        ;
                   
                    chart.append("svg:rect")
                        .attr('class', 'free-rect')
                        .attr("rx", 2)
                        .attr("ry", 2)
                        .attr("width",xScale(free))
                        .attr("height", bulletHeight)
                        .attr("x",xScale(used))
                        ;

                    /*if(availablePct !== "N/A" && availablePct !== "n/s"){
                        chart.append("svg:rect")
                            .attr('class', 'avail-pct-bullet')
                            .attr("rx", 2)
                            .attr("ry", 2)
                            .attr("width",xScale(availablePct))
                            .attr("height", bulletHeight)
                            .attr("x",xScale(100 - availablePct))
                            ;
                    }*/
                        
                    chart.append("svg:rect")
                        .attr('class', usedClass)
                        .attr("rx", 2)
                        .attr("ry", 2)
                        .attr("width",xScale(used))
                        .attr("height", bulletHeight)
                        .attr("x",0)
                        ;

                    chart.append("svg:line")
                            .attr('class','marker-lines-hwm')
                            .attr("y1", 0)
                            .attr("y2", bulletHeight)
                            .attr("transform", markerLineTranslate(xScale(hwm)))
                            ;
                    
                    if(propName === "memory"){
                        chart.append("svg:line")
                                .attr('class','marker-lines-sw')
                                .attr("y1", 0)
                                .attr("y2", bulletHeight)
                                .attr("transform", markerLineTranslate(xScale(stopWrites)))
                                ;
                    }
                    
                    chart.append("svg:text")
                            .attr("font-size", "10")
                            .attr('class','bullet-hwm-text')
                            .attr("y", bulletHeight + 20)
                            .attr("x", -10)//xScale(hwm))
                            .text("HWM : "+hwm+"%");

                    if(propName === "memory"){
                        chart.append("svg:text")
                                .attr("text-anchor", "end")
                                .attr('class','bullet-stopwrites-text')
                                .attr("font-size", "10")
                                .attr("y", bulletHeight + 20)
                                .attr("x", 110)//xScale(stopWrites))
                                .text("SW : "+stopWrites+"%");	
                    }

                    /*if(availablePct !== "n/s"){
                        chart.append("svg:text")
                                .attr('class','bullet-availpct-text')
                                .attr("y", -4)
                                .attr("x", 110)
                                .attr("text-anchor", "end")
                                .text("Avail: "+availablePct+"%")
                                ;
                    }*/

                    /*chart.append("svg:text")
                            .attr("text-anchor", "middle")
                            .attr("font-size", "10")
                            .attr("y", bulletHeight - 6)
                            .attr("x", xScale(hwm-10))
                            //.attr("transform", markerLineTranslate(xScale(hwm-7)))
                            .text(hwm+"%")
                            ;

                    chart.append("svg:text")
                            .attr("text-anchor", "middle")
                            .attr("font-size", "10")
                            .attr("y", bulletHeight - 6)
                            .attr("x", xScale(stopWrites-10))
                            //.attr("transform", markerLineTranslate(xScale(stopWrites-7)))
                            .text(stopWrites+"%")
                            ;	
                    */
                    chart.append("svg:text")
                            .attr("font-size", "10")
                            /*.attr("y", -4)*/
                            .attr("y", -10)
                            .attr("x", -10)
                            .attr("fill", "#54B5E5")
                            //.attr("transform", markerLineTranslate(xScale(used)))
                            .text("Used: " +used+"% of " + usedSize)
                            ;	
                         
                    function markerLineTranslate(x) {
                        return "translate(" + x + ",0)";
                    }	
        }
    };
    
    return BulletChart;
});

