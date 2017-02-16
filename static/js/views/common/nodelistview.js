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

define(["jquery", "underscore", "backbone", "config/app-config", "helper/util"], function($, _, Backbone, AppConfig, Util) {
    var NodeListView = Backbone.View.extend({
        initialize: function() {
            this.el = this.options.el;
            this.startEventListeners();
            this.initHelp();
        },
        render: function(clusterModel) {
            this.updateNodeList(this.el, clusterModel);
        },
        startEventListeners: function() {

            $("#SelectNodesButton").off("click").on("click", function(){
                Util.selectSelectableElementList("#nodeListSelectable");
                Util.updateSelectAllToggle();
            });

            // $(document).off("mouseup:nodeselect").on("mouseup:nodeselect", function(tEvent, e){
            //     var container = $("#SelectNodesButton").add("div.selectNodesGrid").add("#selectNodesHelp").add(".ui-widget-overlay");
            //     if(((container.find(e.target)).length === 0 && !container.is(e.target) && e.target.className !== "ui-selectable-helper") || $("#selectNodesCloseBtn").is(e.target)){
            //         if($("div.selectNodesGrid").css("display") === "block"){
            //             $("div.selectNodesGrid").fadeOut(200);
            //             $("#SelectNodesButton").removeClass("active");
            //         }
            //     }
            // });
            $("#selectAllToggle").off("click").on("click", function(event){
            	var container = $("#nodeListSelectable");
				var button = $(this);
            	if(button.hasClass("selectedAll") || button.hasClass("selectedFew")){
            		$("li", container).removeClass("ui-selected");
            	} else {
            		$("li", container).addClass("ui-selected");
            	}
				
				Util.updateSelectAllToggle();
            });          
        },
        updateNodeList: function(container, clusterModel) {
            try {
                var nodeListStr = '';
                if(window.$(container).hasClass("ui-selectable")){
                	window.$("#nodeListSelectable").selectable("destroy");
                }
				
				window.$(container).empty();
				
				var idStr = "";
				
				for(var nodeI in window.AMCGLOBALS.persistent.nodeList){
					var node = window.AMCGLOBALS.persistent.nodeList[nodeI];
					idStr = Util.getNodeSelectIDStr(node);
					var nodeColor = window.AMCGLOBALS.persistent.nodesColorList[node];

					if(_.contains(window.AMCGLOBALS.persistent.selectedNodes, node)){
						nodeListStr +=' <li class="address_checkbox_span ui-widget-content selectable" id="'+idStr+'"  title="'+node+'">'+
                                '<span class="nodes-legend-color" style="background-color:'+nodeColor+';"> &nbsp; </span>'+
								'<span class="li-node-addr">'+node+'</span>'+
								'</li>';
					}else{
						//nodeListStr +=' <li class="address_checkbox_span ui-widget-content unselectable" id="'+idStr+'"  title="'+node+'">'+node+'</li>';
                        nodeListStr +=' <li class="address_checkbox_span ui-widget-content unselectable" id="'+idStr+'"  title="'+node+'">'+
                                '<span class="nodes-legend-color" style="background-color:'+nodeColor+';"> &nbsp; </span>'+
								'<span class="li-node-addr">'+node+'</span>'+
								'</li>';
						}
				}
				
			$(container).html(nodeListStr);
      $(container).css({'max-height': '400px', 'overflow': 'auto'});
                
                // if(window.AMCGLOBALS.activePage === "dashboard"){
                //     $(".nodes-legend-color").show();
                // } else{
                //     $(".nodes-legend-color").hide();
                // }
                
				$("#nodeListSelectBtn").show();
									
					var selectableOptions = {
						autoRefresh: true,
						filter: 'li',
                        tolerance: "touch",
						stop : function(){
								$(container).find(".ui-toggle-unselect")
									.removeClass("ui-selected")
									.removeClass("ui-toggle-unselect");
								Util.updateSelectAllToggle();
							}
					};
					
                    window.$(container)
                        .off("mousedown")
                        .on("mousedown", function ( e ) {
                        	var selectable = $(e.toElement);
                        	while( !selectable.is(document) && !selectable.hasClass("selectable") && selectable.length > 0)
                        		selectable = selectable.parent();
                        	
                        	if(selectable.hasClass("ui-selected")){
								selectable.addClass("ui-toggle-unselect");
                        	}

                        	e.metaKey = true;
                        } ).selectable(selectableOptions);
					try{
						Util.selectSelectableElementList($(container));
					}catch(e){
						console.log('ERROR : RETRYING');
					}
					
				//this.disableLastInputCheckBox();


				Util.updateTabLinks();
				
			}catch(e){
				console.error(e);
			}
        },

        onFail: function(video) {
            console.info('ERROR CATCHED');
        },
        initHelp: function() {
            try {

                $('#selectNodesHelpVideoContainer').html(AppConfig.htmlVideo.selectNodes(NodeListView.onFail));

                $("#selectNodesHelpBtn").off('click');

                $("#selectNodesHelpBtn").on('click', function(e) {
                    e.stopPropagation();

                    $("#selectNodesHelp").dialog({
                        modal: true,
                        width: Math.min((window.innerWidth - 50), 940),
                        height: ((Math.min((window.innerWidth - 50), 940)) * (166 / 940)),
                        resizable: false,
                        closeOnEscape: true,
                        dialogClass: 'no-dialog-title',
                        close: function(event, ui) {
                            var selectNodesHelpVideo = document.getElementById("selectNodesHelpVideo");
                            if (!!selectNodesHelpVideo) {
                                selectNodesHelpVideo.currentTime = 0;
                                selectNodesHelpVideo.pause();
                            }
                        }
                    });

                    $("#selectNodesHelpCloseBtn").off('click');

                    $("#selectNodesHelpCloseBtn").on('click', function() {
                        $("#selectNodesHelp").dialog("close");
                    });

                    var selectNodesHelpVideo = document.getElementById("selectNodesHelpVideo");
                    if (!!selectNodesHelpVideo) {
                        selectNodesHelpVideo.play();
                    }

                });
            } catch (e) {
                console.info('Error in selectNodes help');
            }
        },

    });

    return NodeListView;
});
