define(["jquery", "underscore", "config/app-config", "helper/AjaxManager", "helper/notification", "helper/overlay"],
function($, _, AppConfig, AjaxManager, Notification, Overlay){

	var availableCommands = [
		{
			syntax: "bins/<NAMESPACE>",
			lookup: ["bins", "/", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "build",
			lookup: ["build"]
		},
		{
			syntax: "dun:nodes=[<NODE_ID>[,<NODE_ID>...]]",
			lookup: ["dun:nodes=", (/^[a-zA-Z0-9_]+(\,[a-zA-Z0-9_]+)*/)]
		},
		{
			syntax: "get-config[:context=<CONTEXT>]",
			lookup: ["get-config", ":", "context=", (/^[a-zA-Z0-9_]+/), ";", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "histogram:namespace=<NAMESPACE>;type=<ttl|object-size|object-size-linear>;set=<SET>",
			lookup: ["histogram", ":", "namespace=", (/^[a-zA-Z0-9_]+/), ";", "type=", (/^(ttl|object-size|object-size-linear)/), ";", "set=", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "hist-track-start:[back=<BACK>;slice=<SLICE>;thresholds=<THRESHOLDS>;hist=<HIST>]",
			lookup: ["hist-track-start", ":", [
				["back=", (/^[a-zA-Z0-9_]+/), ";"],
				["slice=", (/^[a-zA-Z0-9_]+/), ";"],
				["thresholds=", (/^[a-zA-Z0-9_]+/), ";"],
				["hist=", (/^[a-zA-Z0-9_]+/), ";"]
			]]
		},
		{
			syntax: "hist-track-stop:[hist=<HIST>]",
			lookup: ["hist-track-stop", ":", "hist=", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "jobs:module=<MODULE>;[cmd=<COMMAND>;trid=<TRANSACTION_ID>[;value=<VALUE>]]",
			lookup: ["jobs", ":", [
				["module=", (/^[a-zA-Z0-9_]+/), ";"],
				["cmd=", (/^[a-zA-Z0-9_]+/), ";"],
				["trid", (/^[a-zA-Z0-9_]+/), ";"],
				["value", (/^[a-zA-Z0-9_]+/), ";"]
			]]
		},
		{
			syntax: "latency:[hist=<HISTOGRAM>;][back=<BACK>;][duration=<DURATION>;][slice=<SLICE>]",
			lookup: ["latency:", [
				["back=", (/^[a-zA-Z0-9_]+/), ";"],
				["slice=", (/^[a-zA-Z0-9_]+/), ";"],
				["duration=", (/^[a-zA-Z0-9_]+/), ";"],
				["hist=", (/^[a-zA-Z0-9_]+/), ";"]
			]]
		},
		{
			syntax: "logs",
			lookup: ["logs"]
		},
		{
			syntax: "log/<SINK_ID>/<CONTEXT>",
			lookup: ["log", "/", (/[0-9]+/), "/", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "log-set:id=<SINK_ID>;<CONTEXT>=<VERBOSITY>",
			lookup: ["log-set:id=", (/[0-9]+/), ";", (/^[a-zA-Z0-9_]+/), "=", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "mcast",
			lookup: ["mcast"]
		},
		{
			syntax: "mesh",
			lookup: ["mesh"]
		},
		{
			syntax: "namespace[/<NAMESPACE>]",
			lookup: ["namespace", "/", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "service",
			lookup: ["service"]
		},
		{
			syntax: "services",
			lookup: ["services"]
		},
		{
			syntax: "services-alumni",
			lookup: ["services-alumni"]
		},
		{
			syntax: "set-config:context=<CONTEXT>;<PARAM=VALUE>",
			lookup: ["set-config:context=", (/^[a-zA-Z0-9_]+/), ";", "PARAM=", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "set-config:context=namespace;<id=NAMESPACE>;<PARAM=VALUE>",
			lookup: ["set-config:context=namespace;", "id=", (/^[a-zA-Z0-9_]+/), ";", "PARAM=", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "sets[/<NAMESPACE>[/<SET>]]",
			lookup: ["sets", "/", (/^[a-zA-Z0-9_]+/), "/", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "sindex[/<NAMESPACE>[/<SINDEX>]]",
			lookup: ["sindex", "/", (/^[a-zA-Z0-9_]+/), "/", (/^[a-zA-Z0-9_]+/)]
		},
		{
			syntax: "sindex-create:ns=<NAMESPACE>;indexname=<INDEX_NAME>;indexdata=<BIN_NAME>,<BIN_TYPE>[;set=<SET>]",
			lookup: ["sindex-create:", [
				["ns=", (/^[a-zA-Z0-9_]+/), ";"],
				["set=", (/^[a-zA-Z0-9_]+/), ";"],
				["indexname=", (/^[a-zA-Z0-9_]+/), ";"],
				["indexdata=", (/^[a-zA-Z0-9_]+/), ",", (/^[a-zA-Z0-9_]+/), ";"]
			]]
		},
		{
			syntax: "sindex-delete:ns=<NAMESPACE>;indexname=<INDEX_NAME>[;set=<SET>]",
			lookup: ["sindex-delete:", [
				["ns=", (/^[a-zA-Z0-9_]+/), ";"],
				["set=", (/^[a-zA-Z0-9_]+/), ";"],
				["indexname=", (/^[a-zA-Z0-9_]+/), ";"]
			]]
		},
		{
			syntax: "sindex-histogram:ns=<NAMESPACE>;[set=<SET>];indexname=<INDEX>;enable=<ENABLE>",
			lookup: ["sindex-histogram:", [
				["ns=", (/^[a-zA-Z0-9_]+/), ";"],
				["set=", (/^[a-zA-Z0-9_]+/), ";"],
				["indexname=", (/^[a-zA-Z0-9_]+/), ";"],
				["enable=", (/^[a-zA-Z0-9_]+/), ";"]
			]]
		},
		{
			syntax: "statistics",
			lookup: ["statistics"]
		},
		{
			syntax: "status",
			lookup: ["status"]
		},
		{
			syntax: "throughput:[hist=<HISTOGRAM>;][back=<BACK>;][duration=<DURATION>;][slice=<SLICE>]",
			lookup: ["throughput:", [
				["back=", (/^[a-zA-Z0-9_]+/), ";"],
				["slice=", (/^[a-zA-Z0-9_]+/), ";"],
				["duration=", (/^[a-zA-Z0-9_]+/), ";"],
				["hist=", (/^[a-zA-Z0-9_]+/), ";"]
			]]
		},
		{
			syntax: "tip:host=<HOST>;port=<MESH-PORT>",
			lookup: ["tip:host=", (/^[a-zA-Z0-9_\.]+/), ";", "port=", (/^[0-9]+/)]
		},
		{
			syntax: "tip-clear",
			lookup: ["tip-clear"]
		},
		{
			syntax: "undun:nodes=<NODE ID>[, <NODE ID>...]",
			lookup: ["undun:nodes=", (/^[a-zA-Z0-9_]+(\,[a-zA-Z0-9_]+)*/)]
		}
	];

	var lastHiglight = null;
	var inputEl = null, outputEl = null, executeBtn = null;

	var lastInput = null;
	var currentSuggestionRange = null;
	var cmdHistoryLength = 25;
	var cmdCache = [];

	var CliHelper = {
		init: function(input, output, execButton, enableSyntaxSuggestion){
			enableSyntaxSuggestion = enableSyntaxSuggestion != null ? enableSyntaxSuggestion : true;
			inputEl = $(input);
			outputEl = $(output);
			executeBtn = $(execButton);
			this.bindInput(inputEl, executeBtn, enableSyntaxSuggestion);
			this.setupFloatingHeader(outputEl);
			this.bindExecButton(inputEl, outputEl, executeBtn);
			this.setupReExecute(outputEl);
			executeBtn.attr("disabled", "disabled");
		},

		bindExecButton: function(inputEl, outputEl, execButton){
			var that = this;
			inputEl.autocomplete("close");
			execButton.off("click").on("click", function(event){
				outputEl.scrollTop(outputEl.prop("scrollHeight"));
				try{
					var spinner = new Overlay("cliInputContainer");
					$("#cliInputContainer :input").attr("disabled", "disabled");
					that.executeCommand(inputEl.val(), function(status, response){
						if(status === "success"){
							that.insertOutput(outputEl, that.getPrintContent(inputEl.val(), that.format.call(that, response)));
						} else if(status === "failure"){
							that.insertOutput(outputEl, that.getPrintContent(inputEl.val(), that.format.call(that, response)));
						}

						spinner.stopOverlay();
						$("#cliInputContainer :input").removeAttr("disabled");
						inputEl.val("").trigger("keyup");
						inputEl.autocomplete("close");
						inputEl.focus();
					});
				} catch(err){
					outputEl.append(that.getPrintContent(inputEl.val(), that.formatError(err)));
				}
			});
		},

		getPrintContent: function(input, output){
			return "<div class='cli-container'><div class='cli-output-title'><div class='cli-redo-button icon-redo2' title='Re-Execute Command'></div><div class='cli-input-timestamp' title='Re-Execute Command'>[" + ((new Date()).toTimeString().split(" ")[0]) + "]</div><div class='cli-input-statement' title='Re-Execute Command'>" + input + "</div></div>" + "<div class='cli-output-container'><div class='cli-output-tables'>" + output + "</div></div></div><br>";
		},

		insertOutput: function(outputEl, data){
			var that = this;
			outputEl.prepend(data);
			outputEl.scrollTop(0);
			that.setPositionAttr(outputEl);
			var outputs = outputEl.find(".cli-container");
			if(outputs.length > cmdHistoryLength){
				outputEl.find(".cli-container + br").slice(cmdHistoryLength).remove();
				outputs.slice(cmdHistoryLength).remove();
			}
			outputEl.trigger("scroll");
		},

		setPositionAttr: function(container, elements){
			container = container || outputEl;
			elements = elements || outputEl.find(".cli-output-container");

			elements.each(function(index, el){
				var $el = $(el);
				$el
					.attr("data-height", $el.height())
					.attr("data-offset-top", (($el.offset().top - container.offset().top) + container.scrollTop()));
			});
		},

		setupReExecute: function(container){
			container.off("click").on("click", function(event){
				console.log(event.target);
				var target = $(event.target);
				var reExecuteTargets = container.find(".cli-input-statement, .cli-redo-button, .cli-input-timestamp");
				if(reExecuteTargets.is(event.target) || $.contains(reExecuteTargets, event.target)){
					inputEl.val(target.parent().find(".cli-input-statement").text());
					executeBtn.trigger("click");
				}
			});
		},

		bindInput: function(inputEl, execButton, makeSyntaxSuggestion){

			inputEl.off("keyup");

			if(makeSyntaxSuggestion){

				function partialMatchSlice(source, target){
					if(typeof target === "string"){

						if(source === target || target.indexOf(source) === 0 || source.indexOf(target) === 0)
							return source.substr(target.length);

					} else if(target instanceof RegExp){

						var match = source.match(target);
						if(match != null)
							return source.substr(match[0].length);

					} else if(target instanceof Array){

					}

					return false;
				}

				function makeMatch(req, lookup, returnPartial){
					for(var i=0; i < lookup.length && req !== "" ; i++){
						
						if(lookup[i] instanceof Array){
							for(j = 0; j<lookup[i].length; j++){
								var newMatch = makeMatch(req, lookup[i][j], true);

								if(newMatch != null && (typeof newMatch === "string") && req !== newMatch && req.indexOf(newMatch) !== -1){
									j = -1;
									req = newMatch;
								} else if(newMatch === true || newMatch === ""){
									req = true;
									break;
								}
							}
						} else if( _.isBoolean(req) || req === ""){
							break;
						} else {
							req = partialMatchSlice(req, lookup[i]);
						}
					}

					if(_.isBoolean(req))
						return req;
					else if(req === "")
						return true;
					else if(returnPartial){
						return req;
					} else {
						return false;
					}
				}

				inputEl.autocomplete({
					minLength: 0,
					appendTo: "div.ui-front.cli-input",
					source: function( request, response ){
						var matcher = [], match = null;;
						availableCommands.forEach(function(command){
							if(makeMatch(request.term, command.lookup)){
								matcher.push({label: command.syntax, value: command.lookup[0]});
							}
						});
						response(matcher);
					},

					select: function( event, ui ){
						var inputValue = inputEl.val();
						if(inputValue.length >= ui.item.value.length){
							event.preventDefault();
						} else if(ui.item.value.trim() !== ""){
							inputEl.attr("data-autocomplete-input", "true")
								.trigger("change");	
						}
					},

					focus: function( event, ui ) {
						event.preventDefault();
					},

					search: function( event, ui ){
						if(event.keyCode === 38 && this.value.trim().length === 0){
							event.preventDefault();
						}
					}
				});

				inputEl.on("keyup", function(event){
					var suggestBoxVisible = inputEl.parent().find(".cli-input").is(":visible");
					if(event.keyCode === 38 && !suggestBoxVisible){
						console.log("Show Command History");
					} else if(inputEl.attr("data-autocomplete-input") === "true"){
						inputEl.removeAttr("data-autocomplete-input");
					} else if (event.keyCode === 13 && !suggestBoxVisible) {
	                    $(execButton).trigger('click');
	                }

	                if(inputEl.val().trim() === ""){
	                	execButton.attr("disabled", "disabled");
	                }else {
	                	execButton.removeAttr("disabled");
	                }
				});

				inputEl.off("change").on("change", function(event){
					if(!event.isTrigger && inputEl.val().trim() === ""){
	                	execButton.attr("disabled", "disabled");
	                }else {
	                	execButton.removeAttr("disabled");
	                }
				});
			}

		},

		setupFloatingHeader: function(outputContainer){
			var that = this;
			var scrollStopTimer = null;

			function isOverFlowing(element, pScrollTop){
				outputOffsetTop = +element.dataset["offsetTop"];
				height = +element.dataset["height"];
				return (outputOffsetTop < pScrollTop && (outputOffsetTop + height) > pScrollTop);
			}

			function checkStopAndCall(event){
				clearInterval(scrollStopTimer);
				scrollStopTimer = setTimeout(function(){
					var scrollTop = outputContainer.scrollTop();

					var overflowing, lastOverflowed = outputContainer.find(".overflowing");

					if(lastOverflowed.parent()[0] == null || !isOverFlowing(lastOverflowed.parent()[0], scrollTop)){

						for(var i = 0, outputs = outputContainer.find(".cli-output-container"); i < outputs.length; i++){
							if( isOverFlowing(outputs[i], scrollTop) ){
								lastOverflowed
									.removeClass("overflowing")
									.css("top", "");

								overflowing = outputContainer.find(outputs[i]).find(".cli-output-header");

								overflowing.addClass("overflowing");

								break;
							}
						}

					} else {
						overflowing = lastOverflowed;
					}

					if(overflowing)
						overflowing.css("top", (outputContainer.scrollTop() - overflowing.parent().prop("offsetTop") - 5));
					else
						lastOverflowed.removeClass("overflowing").css("top", "");

				}, 100);
			}

			outputContainer.off("scroll").on("scroll", checkStopAndCall);

			function handleWindowResize(event){
				that.setPositionAttr();
				outputContainer.trigger("scroll");
			}

			window.addEventListener('resize', handleWindowResize, true);
		},

		executeCommand: function(cmd, callback){
			cmd = cmd.trim();
			if(cmd === ""){
				callback("Command Error", "Invalid Command");
			} else {
				cmdCache.push(cmd);
				inputEl.attr("data-history-index", 0);
				if(cmdCache.length > cmdHistoryLength)
					cmdCache.shift();

				AjaxManager.sendRequest(AppConfig.baseUrl + AMCGLOBALS.persistent.clusterID +  AppConfig.commandLine.resourceUrl, {
	                cache: false,
	                async: true,
	                type: AjaxManager.POST,
	                dataType: "text",
	                data: {command: cmd}
	            }, function(response) {
	                if (response.error == null) {
	                    callback("success", response);
	                } else {
	                	callback("error", response.error);
	                }
	            }, function(response) {
	                callback("failure", "Failed to execute command");
	            });
			}
		},

		format: function(output){
			var outputString;

			var nodesToPrint = _.intersection(_.keys(output), AMCGLOBALS.persistent.selectedNodes);
			var range = _.max( _.map( _.values(output), function(outputArray){ return outputArray instanceof Array ? outputArray.length : 1; } ) );
			var outputVal;

			outputString = this.getHeaderTemplate(nodesToPrint, output);
			outputString +="<table class='cli-output'><thead><tr>";
			
			for(var i in nodesToPrint){
				outputString += "<th style='min-width: " + AppConfig.commandLine.nodeColoumnWidth + "; width: " + (100/nodesToPrint.length) + "%;'></th>"
			}

			outputString += "</tr></thead>";
			outputString += "<tbody>";

			for(var i=0; i < range; i++){
				outputString += "<tr>";

				for(node in nodesToPrint){
					if(output[nodesToPrint[node]] != null){
						outputVal = (output[nodesToPrint[node]] === -1 ? "Node Status: Off" : output[nodesToPrint[node]][i]) || "";
					} else {
						outputVal = "Invalid Command";
					}

					outputVal = outputVal.trim();
					outputVal =  outputVal.replace(/(\:|\,)/g, "$1 ");
					
					if(outputVal.indexOf("=") !== -1){
						outputVal = outputVal.replace(/(^|\ )([a-z\-]+\=[a-zA-Z_\-0-9]+)\,|$/g, "$1<div>$2</div>");
					}

					if(outputVal === ""){
						outputVal = "&nbsp;"
					}

					outputString += "<td>" + outputVal + "</td>";
				}

				outputString += "</tr>";
			}

			outputString += "</tbody></table>";
			
			return outputString;
		},

		formatError: function(outputString){
			return "<div class='error_message'>" + outputString + "</div>";
		},

		getHeaderTemplate: function(nodes, output){
			var html = "<div class='cli-output-header'><table><thead><tr class='cli-header-colomn-title'>";

			for(var node in nodes){
				html += "<th style='min-width: " + AppConfig.commandLine.nodeColoumnWidth + "; width: " + (100/nodes.length) + "%; " + (output[nodes[node]] === -1 ? "background-color: red;" : "") + "'>";
				html += "<div class='cli-cell'>" + nodes[node] + "</div>";
				html += "</th>";
			}

			html += "</tr></thead></table></div>";

			return html;
		},

	};

	return CliHelper;
});
