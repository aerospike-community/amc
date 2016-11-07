/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/job-table", "helper/jqgrid-helper", "config/view-config", "config/app-config", "helper/util", "timechart", "helper/overlay" ], function($, _, Backbone, JobTable, GridHelper, ViewConfig, AppConfig, Util, TimeChart, Overlay){
    
    var NodeView = Backbone.View.extend({
        isInitialized: false,
		initialize: function(model){
			this.initMainContainers(model);
			this.spinner = new Overlay(Util.removeDotAndColon(model.address)+'-nodeLatencyContainer' );
			this.initialized = false;
			this.el = null;
			this.address = model.address;
        },
		
		initMainContainers: function(model){
			var templateStr =   '<div class="node-latency-container card_layout" id="'+ Util.removeDotAndColon(model.address) +'-nodeLatencyContainer">'+
								'	<div class="sub-title-bar" id="'+Util.removeDotAndColon(model.address)+'-sparklineTitleBar">'+
								'		<div class="img-icon-node icon-node"></div>'+
								'		<div class="title-bar-header" title="Click to show/hide panel">'+
								'			Node '+model.address+
								'			<span class="toggle-to-state" style="font-size:12px">(Hide)</span>'+
								'		</div>'+
								'	</div>'+
								'	<div class="box-container" style="padding-top:0px !important">'+
								'		<div name="'+model.address+'" class="all-sparkline-chart-container">' + 
								'		</div>' + 
								'	</div>' + 
								'</div>';
								
			$('#nodesLatencyChartsContainer').append(templateStr);
		},
		
		initContainers: function(model){
			var templateStr = '';
			
			for(var attr in model.attrList){
				templateStr += this.sparkLineChartTemplate(model.attrList[attr]);
			}
			
			$('#' + Util.removeDotAndColon(model.address) + '-nodeLatencyContainer .all-sparkline-chart-container').append(templateStr);
			
			this.chartEventHandler(model);
		},
		
		chartEventHandler: function(model){
			var nodeLatencyContainer = this.nodeLatencyContainer = $('#'+Util.removeDotAndColon(model.address)+'-nodeLatencyContainer');
			var sparkLineContainer = nodeLatencyContainer.find('.sparkline-chart');
			var titleBar = $(nodeLatencyContainer.find('.sub-title-bar')[0]);
			
			titleBar.off('click');
			titleBar.on('click',function(){
				if(model.attributes.node_status === 'on'){
					var boxContainer = $(nodeLatencyContainer.find('.box-container')[0]);
					if(nodeLatencyContainer.find(".sub-title-bar").hasClass("close") || (nodeLatencyContainer.find(".selected").length == 0 && nodeLatencyContainer.find(".rowDisabled").length == 0)){
						var containerVisible = boxContainer.css("display") === 'none' ? false : true;	
						var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['latency']);
						var modelPoller = Util.initPoller(model,polOptions);
						if(containerVisible === true){
							//STOP MODEL POLLING
							// modelPoller.stop();
							// model.polling = false;
							Util.subTitleToggle(boxContainer, false);
						}else{
							//START MODEL POLLING
							// model.polling = true;
							//modelPoller.start();
							// model.collection.each(function(nodeModel){
							// 	if(nodeModel.polling === true){
							// 		var tempPoller = Util.initPoller(nodeModel,polOptions);
							// 		tempPoller.stop();
							// 		tempPoller.start();
							// 	}
							// });
							Util.subTitleToggle(boxContainer, true);
							document.dispatchEvent(new CustomEvent("resize"));
						}
					}
				}
			});
					
			sparkLineContainer.off('click');
			sparkLineContainer.on('click',function(){
				//$(container).removeClass('selected');
				$('#nodesLatencyChartsContainer').find('.sub-title-bar').not('.rowDisabled').find('.title-bar-header').attr("title","Click to show/hide panel");
				$('#nodesLatencyChartsContainer').find('.selected').removeClass("selected");
				
				$('#nodesLatencyChartsContainer').find('.sparkline-chart').each(function(index, element){
					var container = $(this).parent().parent().parent();
					if(container.css("display") === 'none'){
						container.parent().find('.sub-title-bar').not('.rowDisabled').find('.toggle-to-state').html('(Show)');
					} else{
						container.parent().find('.sub-title-bar').not('.rowDisabled').find('.toggle-to-state').html('(Hide)');
					}
				});				
				
				var address = model.address;
				var latencyType = $(this).parent().attr('name');
				var container = $(this).parent().parent().parent();
				
				if(container.parent().find('.box-container').css("display") === "none"){
					container.parent().find('.sub-title-bar').trigger("click");
				}
				
				$(this).addClass('selected');
				container.parent().find('.sub-title-bar').addClass("selected");
				container.parent().find('.sub-title-bar').find('.title-bar-header').attr("title","Node selected");
				model.rowView.sparkline[latencyType].addSecondaryChart({id : window.AMCGLOBALS.activePageModel.mainChart.id, preProcessor : Util.mainChartPreProcessor});
				window.AMCGLOBALS.activePageModel.updateChartTitle("#mainLatencyChartTitle", latencyType + " [" + address + "]");
				window.AMCGLOBALS.activePageModel.updateLegend("#legend",model.legend);
				$("#mainLatencyChartControl .controlsContainer").attr("title","Pause graph updates");
				if(container.css("display") === "none"){
					container.parent().find('.sub-title-bar').trigger("click");
				}
				//$('#mainLatencyChartContainer').html(address+' ->'+latencyType);
			});
		
		},
		templateStrFn: function(that, model){
			that.container = '#'+Util.removeDotAndColon(model.address)+'-nodeLatencyContainer';
			var str='<div class="node-latency-container card_layout" id="'+Util.removeDotAndColon(model.address)+'-nodeLatencyContainer" >'+
							'<div class="sub-title-bar" id="'+Util.removeDotAndColon(model.address)+'-sparklineTitleBar">'+
							'	<div class="img-icon-node icon-node"></div>'+
							'	<div class="title-bar-header" title="Click to show/hide panel">'+
							'		Node '+model.address+
							'		<span class="toggle-to-state" style="font-size:12px">(Hide)</span>'+
							'	</div>'+
							'</div>'+
							'<div class="box-container" style="padding-top:0px !important">'+
							'<div name="'+model.address+'" class="all-sparkline-chart-container">';
			for(var attr in model.attrList){
				str += this.sparkLineChartTemplate(model.attrList[attr]);
			}							
	
			str +=	'</div></div></div>';			
			return str;
		},
		sparkLineChartTemplate: function(type){
			return '<div name="'+type+'" class="sparkline-container"><div class="sparkline-chart"></div><div class="sparkline-chart-title">'+type+'</div></div>';
		},
		render: function(model, latencyData){
			
			function renderOnDemand(){
				var that = this;
				var nodeLatencyContainer = this.nodeLatencyContainer = $('#'+Util.removeDotAndColon(model.address)+'-nodeLatencyContainer');
				var boxContainer = $(nodeLatencyContainer.find('.box-container')[0]);
				var subTitle = nodeLatencyContainer.find('.sub-title-bar');
				var containerVisible = boxContainer.css("display") === 'none' ? false : true;
				model.rowView.spinner.stopOverlay();
				if((typeof model.attributes.node_status === 'undefined' || model.attributes.node_status === 'on') && model.latencyAvailable){
					
					if( $('#nodesLatencyChartsContainer .node-latency-container').length == 1 && 
						$('#nodesLatencyChartsContainer .node-latency-container .selected').length > 0 &&
						$('#nodesLatencyChartsContainer .node-latency-container .sub-title-bar').hasClass("close")){
						
							$('#nodesLatencyChartsContainer .node-latency-container .selected').removeClass('selected');
							$('#nodesLatencyChartsContainer .node-latency-container .sub-title-bar').removeClass("rowDisabled");
							$('#nodesLatencyChartsContainer .node-latency-container .sub-title-bar').trigger("click");
							window.AMCGLOBALS.activePageModel.bindMainChart();
						}
					
					if(!subTitle.hasClass("selected")){
						subTitle.find(".title-bar-header").attr("title","Click to show/hide panel");
					}
					subTitle.removeClass("rowDisabled");
					nodeLatencyContainer.removeClass("rowDisabled");
					
					if(containerVisible){
						subTitle.find('.toggle-to-state').text('(Hide)');
					} else{
						subTitle.find('.toggle-to-state').text('(Show)');
					}
					
					if(typeof model.rowView.sparkline === 'undefined' && latencyData != null){
						//model.rowView.initSparkline(model.rowView);
						if((model.rowView.nodeLatencyContainer.find('.sub-title-bar').hasClass("open") && !containerVisible) ){
								
							var boxContainer = model.rowView.nodeLatencyContainer.find('.box-container');
							boxContainer.slideToggle(200);
							subTitle.removeAttr("style").find('.toggle-to-state').text('(Hide)');
	// 						//var width = boxContainer.css("width");
	// 						//boxContainer.css("display","block").css("position","fixed").css("bottom", -1000).css("width",width);
						}
						
						model.rowView.initSparkline(model.rowView);
						if($('#nodesLatencyChartsContainer .node-latency-container').length == 1){
							window.AMCGLOBALS.activePageModel.bindMainChart();
						}
					}
						
					for(var attr in latencyData){
						model.rowView.sparkline[attr].updateSeries(latencyData[attr]);
					}
				} else{

					function closeContainer(){

						function removeSparklineAndRebind(){
							for(var attr in that.sparkline){
								that.sparkline[attr].remove();
							}
							delete that.sparkline;

							if(nodeLatencyContainer.find(".selected").length !== 0){
								nodeLatencyContainer.find(".selected").removeClass("selected");
								window.AMCGLOBALS.activePageModel.bindMainChart();
							}
						}

						if(containerVisible){
							boxContainer.slideToggle(200,function(){
								boxContainer.parent().children(".sub-title-bar").css("border-radius","5px 5px 5px 5px");
								
								boxContainer.parent().children(".sub-title-bar").removeClass("close").addClass("open");
								setTimeout(removeSparklineAndRebind, 1000);
							});
						} else{
							removeSparklineAndRebind();
							boxContainer.parent().children(".sub-title-bar").removeClass("open").addClass("close");
						}
						
						
					}
					
					var subTitle = nodeLatencyContainer.find('.sub-title-bar');
					
					if(!subTitle.hasClass("rowDisabled"))
						closeContainer();
					
					subTitle.addClass("rowDisabled");
					nodeLatencyContainer.addClass("rowDisabled");
					
					if(model.attributes.node_status === 'off'){
						subTitle.find(".title-bar-header").attr("title","Node Status is off");
						boxContainer.parent().find("span.toggle-to-state").html("(Node status : Off)");
					} else if(!model.latencyAvailable){
						subTitle.find(".title-bar-header").attr("title","Latency Info unavailable");
						boxContainer.parent().find("span.toggle-to-state").html("(Latency Info : N/A)");
					}

				}
			}
			
			try{
				if(window.AMCGLOBALS.activePageModel.mainChart.secondarySource.id.indexOf(model.address.replace(/\./g,"_").replace(/\:/g,"_")) !== -1){
					renderOnDemand();
				} else{
					Util.checkVisibilityAndCall(this, renderOnDemand);
				}
			} catch(e){
				Util.checkVisibilityAndCall(this, renderOnDemand);
			}
        },
        renderNetworkError: function(model , newData){
            model.data = newData;
			//console.info('ne');
        },
        renderLoading: function(model){
			try{
				var that = model.rowView;
				
			}catch(e){
				console.error(e);
			}
        },
		cleanView: function(that){
			$(that.container).remove();
			for(var chart in that.sparkline){
				that.sparkline[chart].remove();
			}
			delete that.sparkline;
		},
		
		initSparkline: function(view){
			var boxContainer = $(view.nodeLatencyContainer.find('.box-container')[0]);
			var sparklineContainer = boxContainer.find('.sparkline-container');
			
			view.sparkline = {};
			sparklineContainer.each(function(){
				var that = this;
				var container = $(that);
				view.sparkline[container.attr("name")] = timechart({
					id : "Node" + container.parent().attr("name").replace(/\./g,"_").replace(/\:/g,"_") + container.attr("name"), 
					container : "div.all-sparkline-chart-container[name='" + container.parent().attr("name") + 
								"'] div.sparkline-container[name='" + container.attr("name") + "'] div.sparkline-chart"
				});
				
				view.sparkline[container.attr("name")].initialize({
					updateInterval : 0,
					fixedSnapShotLength : false,
					fixScaleY : false,
					autoResize : true,
					xAxisShowTickLines : false,
					yAxisShowTickLines : false,
					showHoverBubble : false,
					xAxisVisible : false,
					yAxisVisible : true,
					marginTop : 5,
					marginBottom : 5,
					marginRight : 10,
					marginLeft : 10,
					yAxisNumberOfTicks : 2,
					yAxisTickOrientation : 'right',
					scaleYCeilOffset : '5%'
				});
			});

			if(!this.initialized){
				this.el = "#" + Util.removeDotAndColon(this.address)+'-nodeLatencyContainer';
				this.initialized = true;
			}
		}
       
    });
    
    return NodeView;
});




