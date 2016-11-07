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

define(["jquery", "underscore", "backbone", "helper/util", "d3"], function($, _, Backbone, Util, D3){
    var summaryView = Backbone.View.extend({
        initialize: function(){
            this.el = this.options.el;
        	this.buidlMismatchDiv = '<div class="img-warn1" height="30" width="30" alt=""></div>';
        	this.noAlertsDiv = '<div class="img-accept-icon1"></div>';
            this.activeAlertsDiv = '<div class="img-active-icon1"></div>';
            this.currentData = null;
        },
        
        render: function(model, data){
            $("#cluster_setup_overview .overview_container").css("display","block");
            model.summaryView.currentData = data;
            Util.checkVisibilityAndCall(this, function(){
                model.summaryView.unbindEvents();
    			model.summaryView.updateNodeSummary(model.summaryView.currentData.totalNodes, model.summaryView.currentData.nodesUp, model.summaryView.currentData.nodesDown);
                model.summaryView.updateNamespaceSummary(model.summaryView.currentData.namespaces);
                model.summaryView.updateBuildSummary(model.summaryView.currentData);
                model.summaryView.updateAlertsSummary(model.summaryView.currentData.activeRedAlerts);
                model.summaryView.bindEvents(model.summaryView.currentData);
            });
        },

        updateNodeSummary : function(totalNodes, nodesUp, nodesDown){
			$("#totalNodesVal").html("<b>Nodes : </b>" + totalNodes.length);
            $("#nodesUpVal text").text(nodesUp.length);
            $("#nodesDownVal text").text(nodesDown.length);
        },

        updateNamespaceSummary : function(namespaces){
            $("#cluster_setup_overview .namespace_setup").html("<b>Total Namespace" + (namespaces.length>1 ? "s" : "") + " :</b>&nbsp;" + namespaces.length);
        },

       
        updateBuildSummary : function(data){
        	 var that = this;
 			var buildKeys = _.keys(data.buildVersion.version_list);
 			var buildVersion = "Build : &nbsp;" + data.buildVersion["latest_build_no"];
 			
 			if(buildKeys.length == 2){
 				buildVersion = "Builds : &nbsp;" + buildKeys[0] + " [" + data.buildVersion.version_list[buildKeys[0]].length + "], " 
 								+ buildKeys[1] + " [" + data.buildVersion.version_list[buildKeys[1]].length + "]";
 			}		
 			
             var html = "<span class='version_major'>"+ buildVersion + "<span class='version_warn'></span></span>";    
             $("#cluster_setup_overview .build_setup").html(html);

             if(typeof data.buildVersion !== 'undefined' && data.buildVersion != null && 
                         typeof data.buildVersion.version_list != 'undefined' && data.buildVersion.version_list != null){
                 var versionsAvail = 0;
                 for(var version in data.buildVersion.version_list){
                     versionsAvail++;
                 }

                 if(versionsAvail > 2){
 					$("#cluster_setup_overview .build_setup").css("cursor","pointer");
 					$("#cluster_setup_overview .build_setup span.version_warn").css("display","inline-block");
 					 $("#cluster_setup_overview .build_setup span.version_warn").append(that.buidlMismatchDiv);
                     $("#cluster_setup_overview .build_setup span.version_warn span ").attr("height","100%");
                 } else{
 					$("#cluster_setup_overview .build_setup").css("cursor","default");
 				}
             }
        },

        updateAlertsSummary : function(activeRedAlerts){
			var that = this;
			var imageElement = document.getElementById("summaryAlertsImage");

            if(imageElement !== null){
                imageElement.innerHTML = "";
    			if(activeRedAlerts > 0){
                    $("#summaryAlertsValue").text("Active red alert" + (activeRedAlerts > 1 ? "s" : "") + " : " + activeRedAlerts);
                    $("#summaryAlertsValue").removeClass("no-alerts");
                    $("#summaryAlertsImage").removeClass("no-alerts");
    				$("#summaryAlertsImage").append(that.activeAlertsDiv);
                } else{
                    $("#summaryAlertsValue").text("No active red alerts");
                    $("#summaryAlertsValue").addClass("no-alerts");
                    $("#summaryAlertsImage").addClass("no-alerts");
                    $("#summaryAlertsImage").append(that.noAlertsDiv);
                }
    			
    			$("#summaryAlertsImage img").attr("width","100%");
    			$("#summaryAlertsImage img").attr("height","100%");	
            }
        },

        bindEvents : function(data){

            $("#nodesUpVal").on("mouseover mousemove", function(event){
                var html = "<ul>";
                if(data.nodesUp.length > 0){
                    html += "<lh><b>Nodes Up</b><hr><br></lh>";
                    for(var i=0; i<data.nodesUp.length; i++){
                        html += "<li>" + data.nodesUp[i] + "</li>";
                    }
                } else{
                    html += "<lh>No nodes are active.</lh>";
                }

                html+= "</ul>";
                $(".tooltip").remove();
                
                $("<div class='tooltip' style='left : " + ( event.pageX - 95) + "px; top : " + (event.pageY+27) + "px;'>" + 
					"<div class='tooltip-info' style='background-color: #1fbc00;'>" +
					html + "</div>" + "</div>").appendTo("body");
            });
            $("#nodesUpVal").on("mouseout", function(event){
                $(".tooltip").remove();
            });

            /************************************************/
            $("#nodesDownVal").on("mouseover mousemove", function(event){
                var html = "<ul>";
                if(data.nodesDown.length > 0){
                    html += "<lh><b>Nodes Down</b><hr><br></lh>";
                    for(var i=0; i<data.nodesDown.length; i++){
                        html += "<li>" + data.nodesDown[i] + "</li>";
                    }
                } else{
                    html += "<lh>Nodes Down (0)</lh>";
                }

                html+= "</ul>";
                $(".tooltip").remove();
                $("<div class='tooltip' style='left : " + (event.pageX - 110) + "px; top : " + (event.pageY + 27) + "px;'>" + 
					"<div class='tooltip-info' style='background-color: #E42020;'>" +
				html + "</div>" + "</div>").appendTo("body");
            });
            $("#nodesDownVal").on("mouseout", function(event){
                $(".tooltip").remove();
            });

            /************************************************/

            $("#cluster_setup_overview .namespace_setup").on("mouseover mousemove", function(event){
                var html = "<ul>";
                if(data.namespaces.length > 0){
                    html += "<lh><b>Namespaces</b><hr><br></lh>";
                    for(var i=0; i<data.namespaces.length; i++){
                        html += "<li>" + data.namespaces[i] + "</li>";
                    }
                } else{
                    html += "<lh>No namespaces defined.</lh>";
                }

                html+= "</ul>";
                $(".tooltip").remove();
                var windowSize = $(window).width();
                var left = (event.pageX <= 115) ? event.pageX : (event.pageX <= (windowSize - 230) ? event.pageX : event.pageX-115);
                
                $("<div class='tooltip' style='left : " + (left) + "px; top : " + (event.pageY +27) + "px;'>" + 
					"<div class='tooltip-info' style='background-color: rgb(153, 153, 153);'>" +
				html + "</div>" + "</div>").appendTo("body");
            });
            $("#cluster_setup_overview .namespace_setup").on("mouseout", function(event){
                $(".tooltip").remove();
            });

            /************************************************/
			
			var buildKeys = _.keys(data.buildVersion.version_list);
			if(buildKeys.length > 2){
				$("#cluster_setup_overview .build_setup").on("mouseover mousemove", function(event){
					var html = "";
					var versionsAvail = 0;
					if(typeof data.buildVersion !== 'undefined' && data.buildVersion != null && 
							typeof data.buildVersion.version_list != 'undefined' && data.buildVersion.version_list != null){
						for(var version in data.buildVersion.version_list){
							versionsAvail++;
							html += "<ul>";
							html += "<lh>Build version <b>" + version + "</b></lh>";
							for(var i=0; i< data.buildVersion.version_list[version].length && i < 3; i++){
								html += "<li>" +  data.buildVersion.version_list[version][i] + "</li>";
							}
							if(data.buildVersion.version_list[version].length >= 3){
							   html += "<li>" + (data.buildVersion.version_list[version].length - 3) + " more nodes.</li>"; 
							}
							html += "</ul>";
						}

						if(versionsAvail > 1){
							html = "<b>Mismatch in build versions</b><hr><br>" + html;
						}


					} else{
						html += "<ul>";
						html += "<lh>Data not available.</lh>";
						html += "</ul>";
					}
					$(".tooltip").remove();
                    var windowSize = $(window).width();
                    var left = (event.pageX <= 115) ? event.pageX : (event.pageX <= (windowSize - 230) ? event.pageX : event.pageX-115);
                
					$("<div class='tooltip' style='left : " + (left) + "px; top : " + (event.pageY + 27) + "px;'>" + 
						"<div class='tooltip-info' style='background-color: rgb(153, 153, 153);'>" +
						html + "</div>" + "</div>").appendTo("body");
				});
				$("#cluster_setup_overview .build_setup").on("mouseout", function(event){
					$(".tooltip").remove();
				});
			}

            $(".summaryAlertsDetails").not(".no-alerts").on("click", function(){
                 if($("#alert-notify-list-container").css("display") === 'none'){
                    $("#wrap").scrollTop(0);
                    $("#AlertDropdownButton").trigger("click").addClass("active");
                }
            });
        },

        unbindEvents : function(){
            $("#nodesUpVal").off("mouseover mousemove");
            $("#nodesUpVal").off("mouseout");
            $("#nodesDownVal").off("mouseover mousemove");
            $("#nodesDownVal").off("mouseout");
            $("#cluster_setup_overview .namespace_setup").off("mouseover mousemove");
            $("#cluster_setup_overview .namespace_setup").off("mouseout");
            $("#cluster_setup_overview .build_setup").off("mouseover mousemove");
            $("#cluster_setup_overview .build_setup").off("mouseout");
            $(".summaryAlertsDetails").not(".no-alerts").off("click");
        }

    });
    
    return summaryView;
});