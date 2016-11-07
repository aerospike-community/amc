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
    var PieChart = {
        initialize: function(container, pieChartConfig, pieData, pieText){   
            try{
                var chart = [];
                
                chart.width = pieChartConfig.width;
                chart.height = pieChartConfig.height;
                chart.radius = Math.min(chart.width,chart.height) / 2;
				chart.outerExpandOffset = 20;
				chart.innerExpandOffset = 10;
                //pieChart.color = ["FF7F00","39B939"];//d3.scale.category10();
                //pieChart.color = d3.scale.category10();
                //pieChart.color = ["#2B802B","#FF7F2A"];
                //pieChart.color = ["#2B802B","#FF7F2A"];
                if(pieChartConfig.color){
                    chart.color = pieChartConfig.color;
                }else{
                    chart.color = d3.scale.category10().range();
                }
                //GREEN BLUE
                chart.pie = d3.layout.pie()
                    .sort(null);

                chart.arc = d3.svg.arc()
                    .innerRadius(pieChartConfig.outerRadius)
                    .outerRadius(pieChartConfig.innerRadius);

                chart.arcOver = d3.svg.arc()
                            .innerRadius(pieChartConfig.outerRadius+chart.outerExpandOffset)
                            .outerRadius(pieChartConfig.innerRadius+chart.innerExpandOffset);


                chart.svg = d3.select(container).append("svg")
                    .attr("width", chart.width)
                    .attr("height", chart.height)
                  .append("g")
                    .attr("transform", "translate(" + chart.width / 2 + "," + chart.height / 2 + ")");

                var outerCircle = chart.svg.append("circle")
                    .attr("r", pieChartConfig.outerRadius )
                    .attr("stroke-width",pieChartConfig.outerBorderWidth)
                    .attr("stroke",pieChartConfig.color[0])
                    .attr("fill", "white");
                
				var innerCircle = chart.svg.append("circle")
                    .attr("r", pieChartConfig.innerRadius )
                    .attr("stroke-width",pieChartConfig.innerBorderWidth)
                    .attr("stroke","#e0e0e0")
                    .attr("fill", "#ddd");
				
                chart.path = chart.svg.selectAll("path")
                        .data(chart.pie(pieData))
					    .enter().append("path");
						
				chart.path
						.attr("fill", function(d, i) { return chart.color[i]; })
                        .attr("d", chart.arc);
						
				if(typeof pieText !== 'undefined'){
					chart.pieText = chart.svg.selectAll("text")
							.data(pieText,function(d,i){ return i; })
						  .enter().append("text")
							.attr("text-anchor","middle")
							.style("font-size", "12px")
							.style("font-weight","bold");
						  
					chart.pieText
							.attr("fill", function(d) { return d.color; })
							.attr("dy", function(d,i) {return (i - Math.abs(pieText.length/2) + 1) * 14; })
							.text(function(d) { return d.text; });
							
				}
				
				/* chart.svg.append("circle")
                    .attr("r", pieChartConfig.outerRadius )
                    .attr("fill", "rgba(0,0,0,0)")
					.on("mouseover", function(d) {
							d3.select(this).attr("r", pieChartConfig.outerRadius+chart.outerExpandOffset);
							
							outerCircle.transition()
								.duration(500)
								.attr("r", pieChartConfig.outerRadius+chart.outerExpandOffset);
								
							innerCircle.transition()
								.duration(500)
								.attr("r", pieChartConfig.innerRadius+chart.innerExpandOffset);
								
							chart.path.transition()
								.duration(500)
								.attr("d", chart.arcOver);
                        })
                    .on("mouseout", function(d) {
						console.info("out");
                        d3.select(this).attr("r", pieChartConfig.outerRadius);
							
						outerCircle.transition()
							.duration(500)
							.attr("r", pieChartConfig.outerRadius);
								
						innerCircle.transition()
							.duration(500)
							.attr("r", pieChartConfig.innerRadius);
								
						chart.path.transition()
							.duration(500)
							.attr("d", chart.arc);
						}); */

            }catch(e){
                console.info(e);
            }
            return chart;
        },
        update: function(chart, pieData) {
            try{
                chart.path = chart.path.data(chart.pie(pieData));
                // update the data
                //chart.path.attr("d", chart.arc); // redraw the arcs
                return chart;
            }catch(e){
                console.info(e);
                return chart;
            }
        }
        
    };
    


    return PieChart;
});

