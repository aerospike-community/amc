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
    window.healthChart = function(container, width, height, margin, centerText, usePercentage){
        var that = this;
        
        this.data = null;
        this.currData = null;
        this.currDataIndex = [0];
        this.interacting = false;
        that.usePercentage = usePercentage;
        this.svg = d3.select(container)
            .append("svg:svg")
                .attr("width",width)
                .attr("height",height);

        this.radius = (Math.min(width, height) - margin)/2;
        this.pieChart = d3.layout.pie().sort(null).value(function(d){ return d.value;});
        this.arc = d3.svg.arc().outerRadius(that.radius);

        this.arcGroup = that.svg.append("svg:g")
            .attr("class", "arcGroup")
            .attr("transform", "translate(" + (width / 2) + "," + (height / 2) + ")");

        that.svg.append("svg:circle")
            .attr("r", that.radius - 22)
            .attr("cx",width/2)
            .attr("cy",height/2)
            .style("fill","#ddd")
            .style("stroke","#fff")
            .style("stroke-width","4px")
            .on("click",function(){
                that.currData = that.data;
                that.updateGraph();
            });

        if( centerText != null && centerText){
        
			that.pieTextHeader = that.svg.append("text")
				.attr("text-anchor","middle")
				.attr("dy","-5")
				.style("font-weight","bold")
				.attr("transform","translate(" + width/2 + "," + height/2 + ")");

			that.pieTextFooter = that.svg.append("text")
				.attr("text-anchor","middle")
				.attr("fill", "#000")
				.attr("dy","10")
				.style("font-size", "10px")
				.style("font-weight","bold")
				.attr("transform","translate(" + width/2 + "," + height/2 + ")");
        
        }
    }

    healthChart.prototype.updateGraph = function(){

        var that = this;           
        // Simple header text
        if(typeof this.currData === 'undefined' || !this.currData){
            this.currData = this.data;
            this.currDataIndex = [0];
        }

		if(this.currData == this.data){
			this.svg.select("circle").style("cursor","default");
		} else{
			this.svg.select("circle").style("cursor","pointer");
		}
        // Create a sector for each entry in the enter selection
        var paths = this.arcGroup.selectAll("path")
            .data(that.pieChart(that.currData), function(d) {return d.data.name;} );            
        
        paths.enter().append("svg:path").attr("class", "sector");
          
        // Each sector will refer to its gradient fill
        if(_.find(that.data, function(data){return data.value > 0;}) != null){
            paths.attr("fill", function(d) { return d.data.color; })
                    .attr("d", function(d){return that.arc(d); })
                    .each(function(){
                        this._listenToEvents = true;
                    });
        }
        
        if(that.pieTextHeader != null && that.pieTextFooter != null){
			if(that.currData[0].name.indexOf("total") != -1){
				that.pieTextHeader
					.attr("fill", "#0e90d2")
					.style("font-size", "12px")
					.text( that.usePercentage == true ? (that.currData[1].value + "%") : that.bytesToSize(that.currData[1].value,2) );

				that.pieTextFooter
					.attr("fill", "#000")
					.style("font-size", "12px")
					.text( that.usePercentage == true ?  (that.currData[0].value + "%") : that.bytesToSize(that.currData[0].value,2));
			}else if(that.currData[0].name.indexOf("free") != -1){
				that.pieTextHeader
					.attr("fill", "#000")
					.style("font-size", "12px")
					.text("Total Free");

				that.pieTextFooter
					.attr("fill", "#000")
					.style("font-size", "12px")
					.text( that.usePercentage == true ?  (that.data[0].value + "%") : that.bytesToSize(that.data[0].value,2));
			}else if(that.currData[0].name.indexOf("used") != -1){
				that.pieTextHeader
					.attr("fill", "#000")
					.style("font-size", "12px")
					.text("Total Used");

				that.pieTextFooter
					.attr("fill", "#000")
					.style("font-size", "12px")
					.text( that.usePercentage == true ?  (that.data[1].value + "%") : that.bytesToSize(that.data[1].value,2));
			}
        }

        // Mouse interaction handling
        paths.on("click", function(d){ 
                if(this._listenToEvents){
                    // Reset inmediatelly
					if(typeof d.data.children !== 'undefined'){
						that.mouseOutCounter = 10;
						d3.select(this).attr("transform", "translate(0,0)");
						// Change level on click if no transition has started                
						paths.each(function(){
							this._listenToEvents = false;
						});

						that.currData = typeof d.data.children !== 'undefined'? d.data.children : undefined; 
						that.updateGraph();
					}
                }
            })
            .on("mouseover", function(d){ 
                 // Mouseover effect if no transition has started                
                if(this._listenToEvents){
                  var ang = d.endAngle - d.startAngle; 

                  var percent = (ang/(2*Math.PI) * 100).toFixed(2);

                  d3.select(this).transition()
                    .duration(250).attr("transform", "scale(1.1)"); 

                  d3.selectAll("div.tooltip")
                    .remove();

                  var tooltip = d3.select("body").append("div")
									.attr("class", "tooltip")
									.style("top", (d3.event.pageY - 20) + "px");
                    
					tooltip = tooltip.append("div")
								.attr("class","tooltip-info")
								.style("background",d.data.color);
					
					tooltip.append("span")
							.attr("class","tooltip-info-body")
							.text( that.usePercentage == true ?  (percent + "%") : that.bytesToSize(d.data.value,2) + ", " + percent + "%");
					
					tooltip.append("span")
							.attr("class","tooltip-info-title")
							.text(d.data.title);
				
                    if(( +tooltip.style("width").substr(0, (tooltip.style("width").length-2)) +d3.event.pageX +10) > window.innerWidth){
                        d3.select("div.tooltip")
                            .style("left", "auto")
                            .style("right", (window.innerWidth - d3.event.pageX + 10) + "px");
                    } else{
                        d3.select("div.tooltip").style("left", (d3.event.pageX + 10) + "px")
                    }
                } 
            })
            .on("mouseout", function(d){
              // Mouseout effect if no transition has started                
              if(this._listenToEvents){
                d3.select(this).transition()
                  .duration(150).attr("transform", "translate(0,0)");

                d3.selectAll("div.tooltip")
                    .remove();
              }
            });

        paths.exit().remove();            
    }

    healthChart.prototype.updatePieData = function(data){
        var that = this;
        
        that.data = data;

        if(typeof that.currData !== 'undefined' && !!that.currData){
            if(that.currData[0].name.indexOf("total") != -1){
                that.currData = that.data;
            }else if(that.currData[0].name.indexOf("[") != -1){
                var index = 0;
                if(that.currData[0].name.indexOf("used") != -1)
                    index = 1;
                that.currData = that.data[index].children;
            }else if(that.currData[0].name.indexOf("(") != -1){
                var nodeName = that.currData.name.substrin(5,that.currData.name.length - 2);
                
                for(var i=0; i< that.data[0].children.length ; i++){
                    if(that.data[0].children[i].name.indexOf(nodeName) != -1){
                        that.currData = that.data[0].children[i].children;
                        break;
                    }
                }

                that.currData = that.currData.children;
            }
        }

       this.updateGraph();
    }

    healthChart.prototype.bytesToSize = function(bytes, precision) {
        var KB = 1024;
        var MB = KB * 1024;   // 1024 * 1024
        var GB = MB * 1024;   // 1024 * 1024 * 1024
        var TB = GB * 1024;   // 1024 * 1024 * 1024 * 1024
        var humanReadableBytes;

        if ((bytes < KB)) {
                humanReadableBytes = bytes + ' B';
        } else if ((bytes >= KB) && (bytes < MB)) {
                humanReadableBytes = (bytes / KB).toFixed(precision) + ' KB';
        } else if ((bytes >= MB) && (bytes < GB)) {
                humanReadableBytes = (bytes / MB).toFixed(precision) + ' MB';
        } else if ((bytes >= GB) && (bytes < TB)) {
                humanReadableBytes = (bytes / GB).toFixed(precision) + ' GB';
        } else if (bytes >= TB) {
                humanReadableBytes = (bytes / TB).toFixed(precision) + ' TB';
        }
        if(typeof humanReadableBytes === 'undefined'){
            humanReadableBytes = '0 B';
        }
        return humanReadableBytes ;
    }

    return healthChart;
}).call(this);