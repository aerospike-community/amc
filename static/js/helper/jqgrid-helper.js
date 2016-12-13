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

define(["jquery", "underscore", "backbone", "helper/piechart", "helper/util", "config/var-details", "helper/bulletchart", "helper/drilldown-charts"], function($, _, Backbone, PieChart, Util, VarDetails, BulletChart, PieChart2){

    var JqGridHelper = {
        maintainExpandedState: function(container, ids){
            var num;
            ids = new Array();
            var expandedContainer = container+" tr:has(.sgexpanded)";
            $(expandedContainer).each(function () {
                    num = $(this).attr('id');
                    ids.push(num);
            });
            return ids;
        },
        jqCustomPieFormatter: function(pieChart, container, rowID, pieConfig, pieArr, colIndex, usePercentage){
                try{
                    var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;
                    var pieChartID = container+colIndex+rowID;
                    pieChartID = pieChartID.substr(1);
                    if(pieArr[0] === "N/E" || pieArr[0] === "n/s"){
                           $(cellContainer).html(pieArr[0]);
                    }else if(pieArr[0] === 0 && pieArr[1] === 0){
                           $(cellContainer).html("N/A");
                    }else{
                        if( !isNaN(pieArr[0]) && !isNaN(pieArr[1])){
                            var pieChartData = this.getRelationshipArray(pieArr);
                            var totalSize = (+pieArr[0]) + (+pieArr[1]);
                            totalSize = 'Total Size: '+Util.bytesToSize(totalSize,1);
                            $(cellContainer).html("").removeAttr("title");
                            $(cellContainer).append('<div id="'+pieChartID+'"> </div>');

                            if(pieChart){
                                pieChart.svg.remove();
                            }

                            $(this.el+' .pie_chart').empty();
                            pieChart = new healthChart('#'+pieChartID, 50, 50, 5, false, usePercentage);
                            pieChart.updatePieData(pieChartData);

                            var legendStr = '<div class="table_pie_chart_legend used" title="'+totalSize+'">'+Util.bytesToSize(pieArr[0],2)+'</div>';
                            legendStr += '<div class="table_pie_chart_legend free" title="'+totalSize+'">'+Util.bytesToSize(pieArr[1],2)+'</div>';
                            $(cellContainer).append(""+legendStr);
                        }else{
                            $(cellContainer).html("N/A");
                        }
                    }

                    return pieChart;
                }catch(e){
                   console.info(e.toString());
                }
        },
        jqCustomBulletChartFormatter: function(container, rowID, config, tickLabels, usedPct, availablePct, colIndex, propName, used){
                try{
                    var cellContainer = container+' tr#'+rowID+' td:nth-child('+(colIndex+1)+')' ;
                    var pieChartID = container+colIndex+rowID;
                    pieChartID = pieChartID.substr(1);
                    $(cellContainer).html('');
                    $(cellContainer).append('<div id="'+pieChartID+'"> </div>');
                    BulletChart.initialize('#'+pieChartID, config, tickLabels, usedPct, availablePct,propName,used);

                }catch(e){
                    console.info(e);
                }
        },
        create2LevelTable: function(tableName, id, expandClass, rowData){
            var tableStr = '<table id="'+id+'" class="'+expandClass+'">';
                    tableStr += '<tr>';
                        tableStr += '<th>Variable Name</th>';
                        tableStr += '<th>Value</th>';
                    tableStr += '</tr>';
                    var formatType = false;
                    var description = "";
                    for(var varName in VarDetails[tableName]){
                        description = VarDetails[tableName][varName][0];
                        formatType = VarDetails[tableName][varName][1];
                        tableStr += JqGridHelper.add2Table(rowData, description, varName, formatType);
                    }
                tableStr += '</table>';

            return tableStr;
        },
        add2Table :function(rowData, description, varName, formatType){
            var value;
            if(typeof rowData[varName] === 'undefined'  || rowData[varName] ==='N/A' || rowData[varName] === null){
                value = 'N/A';
            }else if(rowData[varName] ==='N/E'){
                value = 'N/E';
            }else if(formatType === false || rowData[varName] === 'n/s'){
                value = rowData[varName];
            }else{
            	if(varName === 'write_master' || varName ==='write_prole'){
            		value = rowData[varName];
            	} else {
            		value = JqGridHelper.formatExpandRow(rowData[varName], formatType);
            	}

            }
            var col = [varName, value];
            return JqGridHelper.buildExpandRowHtml(col, description);
        },
        formatExpandRow: function(data, formatType){
            var value;

            if(typeof data === 'undefined' || typeof formatType === 'undefined'){
                return 'N/A';
            }else if(data === 'N/A' || data === 'N/E'){
                return data;
            }

            if(formatType === 'size'){
                value = Util.bytesToSize(data);
            }else if(formatType === 'number'){
                value = data.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }else if(formatType === 'time-seconds'){
                //value = Util.secToTime(data);
                value = Util.secToTimeWithDays(data);
            }else if(formatType === 'time-milliseconds'){
                value = Util.msecToTime(data);
            }else if(formatType === 'pct'){
                value = data + '%';
            }else if(formatType === 'sec'){
                data = data.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                value = data + ' sec';
            }if(formatType === 'millisec'){
                data = data.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                value = data + ' millisec';
            }
            return value;
        },
        buildExpandRowHtml: function(columnData, title){
            var tempRowHtml = '<tr title="'+title+'">';
            for(var colID in columnData){
                tempRowHtml += '<td>';
                if(typeof columnData[colID] === 'undefined'){

                }
                tempRowHtml += columnData[colID];
                tempRowHtml += '</td>';
            }
            tempRowHtml += '</tr>';
            return tempRowHtml;
        },
        columnHeaderTitleFormatter :function(grid, columnList){
            var colName;
            var colTitle;
            try{
                for(var i in columnList){
                    colName = columnList[i].name;
                    colTitle = columnList[i].title;
                    grid.jqGrid ('setLabel', colName, '', '',{'title':colTitle});
                }
            }catch(e){
                console.info(e.toString());
            }
        },
        getRelationshipArray : function(data){
			var parent = [];
            parent.push({name : "Used", title : "Used", value : data[0], color : "#61CAFF"});
            parent.push({name : "Free", title : "Free", value : data[1], color : "#DDD"});

			return parent;
		}

    };

    return JqGridHelper;

 });
