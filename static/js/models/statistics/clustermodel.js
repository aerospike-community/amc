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

define(["underscore", "backbone", "helper/util", "collections/statistics/namespaces", "collections/statistics/nodes", "collections/statistics/xdr","collections/statistics/sindex", "config/app-config", "helper/stat-table", "models/statistics/stattracker"], function(_, Backbone, Util, NamespaceCollection, NodeCollection, XDRCollection, SIndexCollection, AppConfig, StatTable, StatTracker){

    var ClusterModel = Backbone.Model.extend({
        initialize: function(){
			this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();
            this.onChangeEvents();
            this.startEventListeners();
			 
            if( Util.setGlobalClusterInfoInModel("clusters", this) ){
                this.fetchSuccess(this);
            }
        }, 
        initVariables: function(){
            this.statTableInitialized = false;
            this.statCollection = null;
            this.clusterInitialized = false;
            this.namespaceInitialized = false;
            this.isOldVersion = false;
            this.connectionReqErrCount = 0;
            this.statTracker = new StatTracker(5);
        },
        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID;
        }, 
        fetchSuccess: function(response){
            
            Util.setGlobalClusterInfo({type : "clusters", attributes : response.attributes});
            Util.removeEnviromentSetupUI();
            
        	response.connectionReqErrCount = 0;
        	Util.hideAMCNEErrorAlert();
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
			
			if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				this.clusterID = window.AMCGLOBALS.persistent.clusterID;
				 
			}
			
			if(typeof response.attributes.error !== 'undefined' && response.attributes.error.indexOf("Invalid cluster id") != -1){
				delete response.attributes.error;
				Util.clusterIDReset();				
			}
        },
        fetchError: function(response){
			if(response.CID !== window.AMCGLOBALS.currentCID){
				response.destroy(); return;
			}
			if(this.xhr.status === 401) {
        		Util.showUserSessionInvalidateError();
        		return;
        	}
			if(AMCGLOBALS.pageSpecific.GlobalPollingActive){
            	if(AppConfig.maxConnectionRequestErrorBeforeAlert <= ++response.connectionReqErrCount){
            		Util.showAMCNEErrorAlert();
            	} 
            }
            var that = this;
			!AMCGLOBALS.pageSpecific.GlobalPollingActive && Util.updateModelPoller(response, window.AMCGLOBALS.persistent.updateInterval, false);
        },
        onChangeEvents: function(){
            var that = this;
            this.on('change:nodes', function(){
				Util.setUpdateInterval(this.get("update_interval"));
				Util.updateModelPoller(this, AppConfig.updateInterval['cluster'], true);
                if(Util.isBelowVersion3(this.get('build'))){
                    this.isOldVersion = true;
                }else{
                    window.AMCGLOBALS.pageSpecific.indexes = this.get("indexes");
                }

                window.AMCGLOBALS.persistent.nodeList = this.get("nodes");
                window.AMCGLOBALS.pageSpecific.namespaceList = this.get("namespaces");
                Util.updateNodesColorList(window.AMCGLOBALS.persistent.nodeList);
                this.setSelectedNodes();
                this.onNodeChange();
            });
            this.on('change:namespaces', function(){
                that.onNamespaceChange();
            });
			this.on('change:update_interval', function(){
				if(typeof this.previous("update_interval") !== 'undefined'){
					Util.setUpdateInterval(this.get("update_interval"));
					this.updatePollingInterval();
				}
            });
			
		    		    
		    this.on("change:different_cluster_nodes",function(){
		    	var differentClusterNodes = this.get('different_cluster_nodes');
		    	if(differentClusterNodes.length !== 0 ){
		    		Util.showClusterDivertPopup("Node <strong>" + (differentClusterNodes[0]) + "</strong> cannot be monitored here as it belongs to a different cluster");
		    	}
		    });
        },
		updatePollingInterval: function(){
            var that = this;
			Util.updateModelPoller(that, AppConfig.updateInterval['cluster'], true);
			Util.updateModelPoller(window.AMCGLOBALS.persistent.models.alertModel, AppConfig.updateInterval['alerts'], true);
            Util.startVisibleColPolling(that);
        },
        setSelectedNodes: function(){
            var nodeList = [];
            if(window.AMCGLOBALS.persistent.selectedNodesStr === null){
                nodeList = window.AMCGLOBALS.persistent.nodeList;
            }else{
            	var previousNodeList = this._previousAttributes.nodes;
            	var tempSelectedNodes = window.AMCGLOBALS.persistent.selectedNodesStr.split(',');
            	if(previousNodeList){
            		var currentNodeList =  window.AMCGLOBALS.persistent.nodeList;
                	var newNodeList = _.difference(currentNodeList,previousNodeList);
                	if(window.AMCGLOBALS.persistent.selectedNodes.length < AppConfig.maxStartNodes){
                		for(var newNode in newNodeList){
                			if(tempSelectedNodes.length >= AppConfig.maxStartNodes){
                				break;
                			}
                			if( _.indexOf(window.AMCGLOBALS.persistent.unSelectedNodes,newNodeList[newNode] !== -1)){
                				tempSelectedNodes.push(newNodeList[newNode]);
                			}
                		}
                	} 
            	}
                nodeList = _.intersection(window.AMCGLOBALS.persistent.nodeList, tempSelectedNodes);
                if(nodeList.length === 0){
                    nodeList = window.AMCGLOBALS.persistent.nodeList;
                }
            }
            this.initNodeList(nodeList,nodeList.length);
            window.AMCGLOBALS.persistent.nodeListView.render(this);
        },
        initNodeList: function(nodeList, totalNodes){
            if(totalNodes > AppConfig.maxStartNodes){
                    window.AMCGLOBALS.persistent.selectedNodes = _.first(nodeList, AppConfig.maxStartNodes);
                    window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(window.AMCGLOBALS.persistent.nodeList, window.AMCGLOBALS.persistent.selectedNodes);
                }else{
                    window.AMCGLOBALS.persistent.selectedNodes = nodeList;
                    window.AMCGLOBALS.persistent.unSelectedNodes = [];
                }
            
//            Util.setStatUrl();
        },
        onNodeChange: function(){
            if(this.statTableInitialized === false){
                this.startStats(this);
                this.statTableInitialized = true;
            }else{
                this.reInitializeCollection(this);
            }
        },
        onNamespaceChange: function(){
            if(typeof this.previous('namespaces') !== 'undefined'){
                if(this.statTableInitialized === true){
                    if(window.AMCGLOBALS.persistent.showAttributesFor === 'namespace' || window.AMCGLOBALS.persistent.showAttributesFor === 'sindex'){
                       this.reInitializeCollection(this);
                    }
                }
            }
        },
        reInitializeCollection: function(that){
            $(AppConfig.stat.statTableDiv).off("renderall");
            that.checkAndCleanStatCollection(that);
            $(AppConfig.stat.statTableDiv).jqGrid('GridUnload');
            that.startStats(that);
            that.statSearch();
        },
        startStats: function(that){
            
            if(window.AMCGLOBALS.persistent.showAttributesFor === 'nodes'){
                StatTable.startInitGrid(AppConfig.nodeStatsList);
                that.initNodeStatCollection(that);
                that.focusGridSearchInput();
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'namespace'){
                StatTable.startInitGrid(AppConfig.namespaceStatsList);
				//StatTable.startInitGrid([]);
                that.initNamespaceStatCollection(that);
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'xdr'){
            	StatTable.startInitGrid(AppConfig.xdrStatsList);
                that.initXDRStatCollection(that);
                that.focusGridSearchInput();
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'sindex'){
                StatTable.startInitGrid(AppConfig.sIndexStatsList);
				//StatTable.startInitGrid([]);
                that.initSIndexNamespaceCollection(that);
//                    that.focusGridSearchInput();
            }
           Util.setStatUrl();
        },        
        focusNamespaceSelect: function(){
            setTimeout(function(){
                    $('#selectNamespace:first').focus();
            },500);
        },
        focusGridSearchInput: function(){
            setTimeout(function(){
                $('#attribute-search').focus();
            },500);
        },
        hideNamespaceSubSelect: function(){
            $('#namespace-attribute-subSelect').hide();
        },
        showNamespaceSubSelect: function(){
            $('#namespace-attribute-subSelect').show();
        },
        hideSIndexSubSelect: function(){
            $('#sIndex-namespace-attribute-subSelect').hide();
        },
        showSIndexSubSelect: function(){
            $('#sIndex-namespace-attribute-subSelect').show();
        },
        hideXdrSubSelect: function(){
            $('#xdr-attribute-subSelect').hide();
        },
        showXdrSubSelect: function(){
            $('#xdr-attribute-subSelect').show();
        },
        setAndDisplayXdrPortOption: function(that){
            var xdrInputHtml = '';
            xdrInputHtml += '<span class="sub_select_label"> Select XDR Port </span>';
            xdrInputHtml += '<input type="text" id="xdrPortInput" maxlength="5"/>';
            xdrInputHtml += '<button type="submit" id="changeXdrPortBtn">Connect</button';
            that.hideNamespaceSubSelect();
            that.showXdrSubSelect();
            that.hideSIndexSubSelect();
            $('#xdr-attribute-subSelect').html(xdrInputHtml);

        },
        
        refreshIntervalInputValidation:function(that){
                var inputID = '#refreshIntervalInput';
                var changeBtn = '#refreshIntervalBtn';
                $(inputID).val(AppConfig.updateInterval.stat/1000);
                Util.numbericInputValidation(inputID, changeBtn);
        },    

        startMonitoringPortChange: function(that){
            var changeXdrBtn = '#changeXdrPortBtn';
            var xdrInput = '#xdrPortInput';
            $(changeXdrBtn).off('click');
            $(changeXdrBtn).on('click', function(e){
                var tempXdrPort = $(xdrInput).val();
                if(tempXdrPort === '' || isNaN(tempXdrPort) || tempXdrPort <= 0 || tempXdrPort > 65535){
                    $(xdrInput).val(window.AMCGLOBALS.persistent.xdrPort);
                }else if(tempXdrPort !== window.AMCGLOBALS.persistent.xdrPort){
                    window.AMCGLOBALS.persistent.xdrPort = tempXdrPort;
                    that.reInitializeCollection(that);
                }
            });
        },

        cleanAndStartNewStatCollection: function(that, showAttributesFor, specialParam){
            var clusterID = window.AMCGLOBALS.persistent.clusterID;//that.get('cluster_id');
            that.statCollection.clearAndInitGridData();
            that.checkAndCleanStatCollection(that);
            window.AMCGLOBALS.persistent.showAttributesFor = showAttributesFor;
            that.createNewGridCollection(that.statCollection, clusterID, specialParam);
            Util.setStatUrl();
        },
        initNamespaceStatCollection: function(that){
            that.hideXdrSubSelect();
            that.hideSIndexSubSelect();
            that.showNamespaceSubSelect();
            that.setAndDisplayNamespaceSelectOption();
            that.namespaceChangeEventListener(that);
            if(window.AMCGLOBALS.persistent.namespaceName != null && window.AMCGLOBALS.persistent.namespaceName !== "undefined"){
                $('#selectNamespace').val(window.AMCGLOBALS.persistent.namespaceName).trigger("change");
            } else {
            	$("#nodeStatListGrid").addClass("statNotInitialized").attr("data-noInitText", "Namespace Not Selected");
            }
        },
        initSIndexNamespaceCollection: function(that){
            that.hideXdrSubSelect();
            that.hideNamespaceSubSelect();
            that.showSIndexSubSelect();
            that.setAndDisplaySIndexSelectOption(that);
            that.namespaceSIndexChangeEventListener(that, true);            
            
            if(_.contains(window.AMCGLOBALS.pageSpecific.namespaceList, window.AMCGLOBALS.persistent.namespaceName)){
                $('#selectNamespaceSIndex').val(window.AMCGLOBALS.persistent.namespaceName).trigger("change");
                if(_.contains(window.AMCGLOBALS.pageSpecific.indexes[window.AMCGLOBALS.persistent.namespaceName], window.AMCGLOBALS.persistent.indexName)){
                    $('#selectIndexSIndex').val(window.AMCGLOBALS.persistent.indexName).trigger("change");
                }else{
                    window.AMCGLOBALS.persistent.indexName = null;
                    $("#nodeStatListGrid").addClass("statNotInitialized").attr("data-noInitText", "Index Not Selected");
                }
            }else{
                window.AMCGLOBALS.persistent.namespaceName = null;
                window.AMCGLOBALS.persistent.indexName = null;
                $("#nodeStatListGrid").addClass("statNotInitialized").attr("data-noInitText", "Namespace Not Selected");
            }
        },
        namespaceChangeEventListener: function(that){
            $('#selectNamespace').off('change');
            $('#selectNamespace').on('change', function(e){
                var selectedNamespace = this.value;
                $("#nodeStatListGrid").removeClass("statNotInitialized").removeAttr("data-noInitText");
                if(selectedNamespace === 'not-selected' || !selectedNamespace){
                    that.checkAndCleanStatCollection(that);
                    window.AMCGLOBALS.persistent.namespaceName = null;
                    window.AMCGLOBALS.persistent.indexName = null;
                    that.reInitializeCollection(that);
                }else{
                    that.checkAndCleanStatCollection(that);
                    window.AMCGLOBALS.persistent.namespaceName = selectedNamespace;
                    that.initSelectedNamespace(that);
                }
            });
        },
        namespaceSIndexChangeEventListener: function(that, isSelected){
            $('#selectNamespaceSIndex').off('change');
            $('#selectNamespaceSIndex').on('change', function(e){
                var selectedNamespace = this.value;
                $("#nodeStatListGrid").removeClass("statNotInitialized").removeAttr("data-noInitText");
                if(selectedNamespace === 'not-selected' || !selectedNamespace){
                    that.checkAndCleanStatCollection(that);
                    window.AMCGLOBALS.persistent.namespaceName = null;
                    window.AMCGLOBALS.persistent.indexName = null;
                    that.reInitializeCollection(that);
                }else{
                    window.AMCGLOBALS.persistent.namespaceName = selectedNamespace;
                    $('#selectIndexSIndex').prop("disabled", false);
                    that.setIndexSIndexSelectOption();
                    that.indexSIndexChangeEventListener(that);
                    $("#nodeStatListGrid").addClass("statNotInitialized").attr("data-noInitText", "Select an Index Name");
                }
            });
            
        },
        indexSIndexChangeEventListener: function(that){
            $('#selectIndexSIndex').off('change');
            $('#selectIndexSIndex').on('change', function(e){
            	$("#nodeStatListGrid").removeClass("statNotInitialized").removeAttr("data-noInitText");
                if(this.value === 'not-selected' || !this.value){
                    that.checkAndCleanStatCollection(that);
                    window.AMCGLOBALS.persistent.indexName = null;
                    that.reInitializeCollection(that);
                }else{
                    that.checkAndCleanStatCollection(that);
                    window.AMCGLOBALS.persistent.indexName = this.value;
                    that.initSelectedSIndex(that);
                }
            });
        },
        setAndDisplayNamespaceSelectOption: function(){
            var subSelectDiv = '#namespace-attribute-subSelect';
            var namespaceList = window.AMCGLOBALS.pageSpecific.namespaceList;
            var selectNamespaceHtml = '';
            selectNamespaceHtml += '<span class="sub_select_label">Select Namespace</span><select id="selectNamespace">';
            selectNamespaceHtml += '<option value="not-selected">----</option>'; 
            
            for(var name in namespaceList){
                selectNamespaceHtml +='<option value="'+namespaceList[name]+'" >'+namespaceList[name]+'</option>'; 
            }
            selectNamespaceHtml += '</select>';
            $(subSelectDiv).html(selectNamespaceHtml);            
        },
        setAndDisplaySIndexSelectOption: function(that){
            var subSelectDiv = '#sIndex-namespace-attribute-subSelect';
            if(that.isOldVersion){
                $(subSelectDiv).empty();
                Util.displayOldVersionMsg(subSelectDiv,'stat-old-version-msg');
            }else{
                var namespaceList = window.AMCGLOBALS.pageSpecific.namespaceList;
                var selectNamespaceHtml = '';
                selectNamespaceHtml += '<span class="sub_select_label"></span><select id="selectNamespaceSIndex">';
                selectNamespaceHtml += '<option title="not-selected"  value="not-selected">Namespace</option>'; 

                for(var name in namespaceList){
                    var nbName = namespaceList[name];
                    selectNamespaceHtml +='<option title="'+nbName+'"  value="'+nbName+'" >'+nbName+'</option>'; 
                }
                selectNamespaceHtml += '</select>';
                selectNamespaceHtml += '<select disabled id="selectIndexSIndex">\n\
                                <option title="not-selected" value="not-selected">Index</option>\n\
                                </select>'; 

                $(subSelectDiv).html(selectNamespaceHtml);
            }
        },
        setIndexSIndexSelectOption: function(){
            var indexList = window.AMCGLOBALS.pageSpecific.indexes;
            var namespaceName = window.AMCGLOBALS.persistent.namespaceName;
            var selectedNamespaceIndexList = indexList[namespaceName];
            var optionHtml = '<option value="not-selected">Select Index</option>'; 
            for(var name in selectedNamespaceIndexList){
                optionHtml +='<option value="'+selectedNamespaceIndexList[name]+'" >'+selectedNamespaceIndexList[name]+'</option>'; 
            }
            $('#selectIndexSIndex').html(optionHtml);
            
        },
        initNodeStatCollection: function(that){
            that.statCollection = null;
            that.statCollection = new NodeCollection();
            that.hideXdrSubSelect();
            that.hideNamespaceSubSelect();
            that.hideSIndexSubSelect();
            that.cleanAndStartNewStatCollection(that, 'nodes', 'tobeUsedNode');

            that.setUpCollectionTracker(that.statCollection);
        },

        initXDRStatCollection: function(that){
            that.setAndDisplayXdrPortOption(that);
            Util.numbericInputValidation('#xdrPortInput', '#changeXdrPortBtn');
            $('#xdrPortInput').val(window.AMCGLOBALS.persistent.xdrPort);
            that.initXdrWithPort(that);
            that.startMonitoringPortChange(that);
        },
        initXdrWithPort: function(that){
                that.statCollection   = null;
                that.statCollection = new XDRCollection();
                that.cleanAndStartNewStatCollection(that, 'xdr', window.AMCGLOBALS.persistent.xdrPort);

                that.setUpCollectionTracker(that.statCollection);
        },

        initSelectedNamespace: function(that){
                that.statCollection   = null;
                that.statCollection = new NamespaceCollection();
                that.cleanAndStartNewStatCollection(that, 'namespace', window.AMCGLOBALS.persistent.namespaceName);

                that.setUpCollectionTracker(that.statCollection);
        },
        initSelectedSIndex: function(that){
                that.statCollection   = null;
                that.statCollection = new SIndexCollection();
                var indexOptions = [window.AMCGLOBALS.persistent.namespaceName, window.AMCGLOBALS.persistent.indexName];
                that.cleanAndStartNewStatCollection(that, 'sindex', indexOptions);

                that.setUpCollectionTracker(that.statCollection);
        },
        refreshNodeCheckBoxList: function(that){
            var visibileColList = that.saveColumnVisibiltyState();
            window.AMCGLOBALS.persistent.nodeListView.render(that.get("nodes"), visibileColList, that);
        },
        changeRefreshInterval: function(that){
            try{
                    var oldStatRefreshInterval = AppConfig.updateInterval['stat']/1000;
                    var newStatRefreshInterval = parseInt($('#refreshIntervalInput').val());
					if(newStatRefreshInterval === oldStatRefreshInterval){
						//Same value
						//noty({text : 'New refresh interval is same the old one', type : 'success', timeout : '3000'});
                    }else if(isNaN(newStatRefreshInterval) || newStatRefreshInterval < 0 || newStatRefreshInterval > 3600 ){
                        //console.info(newStatRefreshInterval)
						noty({text : 'Please enter an interger value between 0 and 3600', type : 'red', timeout : '5000'});
                        $('#refreshIntervalInput').val(AppConfig.updateInterval['stat']/1000);
                    }else if(newStatRefreshInterval !== 0 && newStatRefreshInterval < (window.AMCGLOBALS.persistent.updateInterval == null ? (AppConfig.updateInterval['stat']/1000) : (window.AMCGLOBALS.persistent.updateInterval/1000))){
                    	noty({text : 'Stat refresh interval should be greater than or equal to global refresh interval', type : 'red', timeout : '5000'});
                        $('#refreshIntervalInput').val(AppConfig.updateInterval['stat']/1000);
                    }else{
                        AppConfig.updateInterval['stat'] = newStatRefreshInterval*1000;
                        if(newStatRefreshInterval === 0){
                            //STOP Polling
                            Util.stopStatPoller(that);
                            Util.stopPollingCollection(that);
							noty({text : 'Polling has been stopped', type : 'green', timeout : '3000'});
							window.AMCGLOBALS.pageSpecific.isPollingStopped  = true;
                        }else{
                            //RESET POLLING
                            Util.startStatPoller(that);
                            Util.startVisibleColPolling(that);
							noty({text : 'Stat refresh interval set to '+newStatRefreshInterval+ ' second' + (newStatRefreshInterval > 1 ? 's' : ''), type : 'green', timeout : '3000'});
                        }
						
                    }
                    
                }catch(e){
                }
        },
        startEventListeners: function(){
            var that = this;

            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            };

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
           
            $("#refreshIntervalBtn").off("click").on("click", function(e){
            	e.stopPropagation();
                that.changeRefreshInterval(that);
            });
            
            this.refreshIntervalInputValidation(this);
            
            $("#nodesCheckBox").off("change").on("change",function(){
            	$("#nodeStatListGrid").removeClass("statNotInitialized").removeAttr("data-noInitText");
            	window.AMCGLOBALS.persistent.showAttributesFor = 'nodes';
                that.reInitializeCollection(that);
            });
            
            $("#namespaceCheckBox").off("change").on("change",function(){
            	$("#nodeStatListGrid").removeClass("statNotInitialized").removeAttr("data-noInitText");
            	window.AMCGLOBALS.persistent.showAttributesFor = 'namespace';
                that.reInitializeCollection(that);	
            });
            
            $("#sIndexCheckBox").off("change").on("change",function(){
            	$("#nodeStatListGrid").removeClass("statNotInitialized").removeAttr("data-noInitText");
				window.AMCGLOBALS.persistent.showAttributesFor = 'sindex';
				that.reInitializeCollection(that);
            });
          
			$("#xdrCheckBox").off("change").on("change",function(){
				window.AMCGLOBALS.persistent.showAttributesFor = 'xdr';
                that.reInitializeCollection(that);
	        });

            $('#attribute-search').off('keydown').on('keydown', function(event){
                 window.setTimeout(that.statSearch,500);
             });

            window.$("#nodeListSelectBtn").off('click').on('click', function(e){
                var container = $("#all_address_checkboxes");
                $("#nodeListSelectable li.ui-selected").removeClass("unselectable").addClass("selectable");
                $("#nodeListSelectable li").not("#nodeListSelectable li.ui-selected").removeClass("selectable").addClass("unselectable");
                Util.checkMaxLimitAndResetToDefaultMax(container, that);
                $(container).find('li').each(function() {
                    try{  
                        
//                        var nodeAddr = this.title;
                        var nodeAddr = $(this).find('.li-node-addr').text();
                        if($(this).hasClass('ui-selected')){
                            if(!(_.contains(window.AMCGLOBALS.persistent.selectedNodes, nodeAddr))){
                                Util.startPollingModel(that, nodeAddr)
                                jQuery(AppConfig.stat.statTableDiv).jqGrid('showCol',[nodeAddr]);
                                window.AMCGLOBALS.persistent.selectedNodes = _.union(window.AMCGLOBALS.persistent.selectedNodes,[nodeAddr]);
                                window.AMCGLOBALS.persistent.unSelectedNodes = _.difference(window.AMCGLOBALS.persistent.unSelectedNodes, [nodeAddr]);
                            }
                        }else{
                            if(_.contains(window.AMCGLOBALS.persistent.selectedNodes, nodeAddr)){
                                Util.stopPollingModel(that, nodeAddr)
                                jQuery(AppConfig.stat.statTableDiv).jqGrid('hideCol',[nodeAddr]);
                                window.AMCGLOBALS.persistent.selectedNodes = _.difference(window.AMCGLOBALS.persistent.selectedNodes, [nodeAddr]);
                                window.AMCGLOBALS.persistent.unSelectedNodes = _.union(window.AMCGLOBALS.persistent.unSelectedNodes,[nodeAddr]);
                            }
                        }
                        that.statTracker.updateNodeList();
                        Util.updateTabLinks();
                        Util.setStatUrl();
                        Util.updateSelectAllToggle();
                    }catch(e){
                        console.info('error in LI iterator');
                    }

                });
                //console.info(window.AMCGLOBALS.persistent.selectedNodes);
            });
			
			//Binding panel state to pollers
			var container = $("#statContainer .card_layout");
			
			container.off("startPoller", that.startModelPoller).on("startPoller", {model : that}, that.startModelPoller);
			container.off("stopPoller", that.stopModelPoller).on("stopPoller", {model : that}, that.stopModelPoller);
          
        },
		
		startModelPoller: function(event){
			Util.startVisibleColPolling(event.data.model);
		},
		
		stopModelPoller: function(event){
			Util.stopPollingCollection(event.data.model);			
		},

        statSearch: function(){
            var searchStr = jQuery("#attribute-search").val();
            StatTable.searchInGrid(AppConfig.stat.statTableDiv, 'stat', 'cn', searchStr);
        },
        checkAndCleanStatCollection: function(that){
                try{
                    //console.info('clean it')
                    var modelsToBeDeleted = that.getAllModels(that.statCollection && that.statCollection.models);
                    that.deleteAndDestroyAllModels(that.statCollection, modelsToBeDeleted);
                    Util.updateTabLinks(window.AMCGLOBALS.persistent.seedNode);
                }catch(e){
                    console.info(e);
                }
        },
        createNewGridCollection: function(collection, clusterID, specialParam){
            var model;

            if(Util.isMobile.any())
                    AppConfig.updateInterval['stat'] = 10000;
                
            if(AppConfig.updateInterval['stat'] === 0){
                AppConfig.updateInterval['stat'] = 5000;
                if(Util.isMobile.any())
                    AppConfig.updateInterval['stat'] = 10000;
                $('#refreshIntervalInput').val(AppConfig.updateInterval['stat']/1000);
            }
            for(var i in window.AMCGLOBALS.persistent.nodeList){
                model = collection.addModel(window.AMCGLOBALS.persistent.nodeList[i], clusterID, specialParam);
                if(_.contains(window.AMCGLOBALS.persistent.selectedNodes, window.AMCGLOBALS.persistent.nodeList[i])){
                    Util.startStatPoller(model);
                }else{
                    Util.stopStatPoller(model);
                }
                
                
            }
        },
        deleteAndDestroyAllModels: function(collection, modelsToBeDeleted){
            for(var modelI in modelsToBeDeleted){
                var model = modelsToBeDeleted[modelI];
                Util.stopStatPoller(model);
                window.clearTimeout(model.setTimeOut);
                Util.destroyModel(model);
                collection.remove(model);
            }
            collection = null;
        },
        getAllModels : function(models){
            var modelObjs = [];
            if(models === null){
                return;
            }
            for(var modelI in models){
                modelObjs[modelI] = models[modelI];
            }
            return modelObjs;
        },

        setUpCollectionTracker: function(collection, stat){
            var that = this;
            that.statTracker.setCollection(collection);
        },
		
    });
    return ClusterModel;
});

