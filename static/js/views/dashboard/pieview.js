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

define(["jquery", "underscore", "backbone", "d3", "helper/drilldown-charts", "config/view-config", "helper/util"], function($, _, Backbone, D3, PieChart, ViewConfig, Util){
    var ClusterView = Backbone.View.extend({
        pieChartHolder: null,
        initialize: function(){
            this.el = this.options.el;
        },
        render: function(data){
			var pieChartData = this.getRelationshipArray(data);
			try{
				if( !isNaN(data.used) && !isNaN(data.free)){
					if(!this.pieChartHolder){
						$(this.el+' .pie_chart').empty();
						this.pieChartHolder = new healthChart(this.el+' .pie_chart', 150, 150, 20, true);
					}
					this.pieChartHolder.updatePieData(pieChartData);
				}else{
					//Display Error
				}
			}catch(e){
				if(!this.pieChartHolder){
						this.pieChartHolder = new healthChart(this.el+' .pie_chart', 150, 150, 20, true);
					}
					this.pieChartHolder.updatePieData(pieChartData);
				console.info(e.toString());
			}

        },
		getRelationshipArray : function(data){
			var parent = [];
			parent.push({name : "totalFree", title : "Total Free", value : data.free, color : "#999", children : []});
            parent.push({name : "totalUsed", title : "Total Used", value : data.used, color : "#0e90d2", children : []});
						
			for(var node in data.details){
				parent[0].children.push({value : data.details[node].free, title : node, color : window.AMCGLOBALS.persistent.nodesColorList[node], name : "free[" + node + "]"});
				parent[1].children.push({value : data.details[node].used, title : node, color : window.AMCGLOBALS.persistent.nodesColorList[node], name : "used[" + node + "]"});
			}
			
			return parent;
		}
    });
    
    return ClusterView;
});