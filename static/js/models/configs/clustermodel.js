/******************************************************************************
*Copyright 2008-2014 by Aerospike, Inc. All rights reserved.
*THIS IS UNPUBLISHED PROPRIETARY SOURCE CODE. THE COPYRIGHT NOTICE
*ABOVE DOES NOT EVIDENCE ANY ACTUAL OR INTENDED PUBLICATION.
******************************************************************************/
define(["jquery", "underscore", "backbone", "helper/util", "collections/configs/namespaces", "collections/configs/nodes", "collections/configs/xdr","collections/configs/sindex", "config/app-config", "helper/edit-config", "models/configs/backupmodel", "models/configs/restoremodel","helper/AjaxManager","helper/notification","helper/servicemanager", "models/configs/useradminmodel", "models/configs/roleadminmodel", "helper/authmanager", "helper/servicemanager", "helper/command-line"],
    function($, _, Backbone, Util, NamespaceCollection, NodeCollection, XDRCollection, SIndexCollection, AppConfig, StatTable, BackupModel, RestoreModel,AjaxManager,Notification,ServiceManager, UserAdminModel, RolesAdminModel, AuthManager, ServiceManager, CommandLine){
    var ClusterModel = Backbone.Model.extend({
        initialize: function(){
			this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();
            this.onChangeEvents();
            this.startEventListeners();
			//initiate tab event
            Util.initVerticleTabs();
            //Util.stopIfWindowNotVisible(this);
            window.AMCGLOBALS.pageSpecific.inputBoxClicked = StatTable.inputBoxInFocus;
            window.AMCGLOBALS.pageSpecific.inputBoxOutOfFocus = StatTable.inputBoxOutOfFocus;
            window.AMCGLOBALS.pageSpecific.configGridSet = false;

			this.backupModel = new BackupModel();
            this.restoreModel = new RestoreModel();
			this.availableSets = [];

            if(ServiceManager.isUserHasAccessToService("USER_EDITOR")){
                this.userAdminModel = new UserAdminModel();
            }

            if(ServiceManager.isUserHasAccessToService("ROLE_EDITOR")){
                this.roleAdminModel = new RolesAdminModel();
            }

            if(Util.setGlobalClusterInfoInModel("clusters", this)){
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
        },

        url: function(){
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID;
        },
        fetchSuccess: function(response){

            Util.setGlobalClusterInfo({type : "clusters", attributes : response.attributes});
            Util.removeEnviromentSetupUI();

            if(response.roleAdminModel){
                response.roleAdminModel.set({namespaces: response.get("namespaces")});
                response.roleAdminModel.set({cluster_builds : response.get("cluster_builds")});
            }

            if(response.userAdminModel){
                response.userAdminModel.set({cluster_builds: response.get("cluster_builds")});
            }

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
                this.setSelectedNodes();

                if(ServiceManager.isUserHasAccessToService(ServiceManager.serviceComponentMap.MANAGE_PAGE.EDIT_CONFIG.SERVICE_KEY)){
                	this.onNodeChange();
                }

            });
			this.on('change:update_interval', function(){
				Util.setUpdateInterval(this.get("update_interval"));
				this.updatePollingInterval();
            });
            this.on('change:namespaces', function(){
            	if(ServiceManager.isUserHasAccessToService(ServiceManager.serviceComponentMap.MANAGE_PAGE.EDIT_CONFIG.SERVICE_KEY)){
            		that.onNamespaceChange();
                }
            });
            this.on("change:different_cluster_nodes",function(){
			    	var differentClusterNodes = this.get('different_cluster_nodes');
			    	if(differentClusterNodes.length !== 0 ){
			    		Util.showClusterDivertPopup("Node <strong>" + (differentClusterNodes[0]) + "</strong> cannot be monitored here as it belongs to a different cluster");
			    	}
			});

			this.updateIntervalEventHandler();
        },
		updateIntervalEventHandler: function(){
            $("#changePasswordSubmit").off("click").on("click", function(){
                if(AuthManager._validateChangePasswordData()){
                    AuthManager.executeChangePasswordRequest(AuthManager._getChangePasswordFormData(), function(status){
                        if(status === "success"){
                            $("#changePasswordContainer input:not(#changePasswordSubmit)").val("");
                        }
                    });
                }
            });

		},
		updatePollingInterval: function(){
            var that = this;
			Util.updateModelPoller(that, AppConfig.updateInterval['cluster'], true);
			Util.updateModelPoller(window.AMCGLOBALS.persistent.models.alertModel, AppConfig.updateInterval['alerts'], true);
			that.backupModel.updatePoller();
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
                this.startStats();
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
            window.AMCGLOBALS.pageSpecific.configGridSet = false;
            that.startStats();
            that.statSearch();
        },
        startStats: function(){
            var that = this;

            if(window.AMCGLOBALS.persistent.showAttributesFor === 'nodes'){
                that.initNodeStatCollection();
                that.focusGridSearchInput();
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'namespace'){
                that.initNamespaceStatCollection(that);
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'xdr'){
                that.initXDRStatCollection(that);
                that.focusGridSearchInput();
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'sindex'){
                that.initSIndexNamespaceCollection(that);
//              that.focusGridSearchInput();
            }
            Util.setStatUrl();
        },
        focusNamespaceSelect: function(){
            setTimeout(function(){
                    $('#selectNamespace:first').focus();
            },500);
        },
        focusGridSearchInput: function(){
            /*setTimeout(function(){
                $('#attribute-search').focus();
            },500);*/
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
            that.hideNamespaceSubSelect();
            that.hideXdrSubSelect();
            that.hideSIndexSubSelect();
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
        cleanAndStartNewStatCollection: function(showAttributesFor, specialParam){
            var that = this;
            var clusterID = window.AMCGLOBALS.persistent.clusterID;
         //   this.statCollection.clearAndInitGridData();
         //   this.checkAndCleanStatCollection(that);
            window.AMCGLOBALS.persistent.showAttributesFor = showAttributesFor;
            this.createNewGridCollection(this.statCollection, clusterID, specialParam);
            Util.setStatUrl();
        },
        initNamespaceStatCollection: function(that){
            that.hideXdrSubSelect();
            that.hideSIndexSubSelect();
            that.showNamespaceSubSelect();
            that.setAndDisplayNamespaceSelectOption();
            that.namespaceChangeEventListener(that);
            if(window.AMCGLOBALS.persistent.namespaceName !== null){
                $('#selectNamespace').val(window.AMCGLOBALS.persistent.namespaceName).trigger("change");
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
                }
            }else{
                window.AMCGLOBALS.persistent.namespaceName = null;
                window.AMCGLOBALS.persistent.indexName = null;
            }
        },
        namespaceChangeEventListener: function(that){
            $('#selectNamespace').off('change');
            $('#selectNamespace').on('change', function(e){
                var selectedNamespace = this.value;
                if(selectedNamespace === 'not-selected'){
                    that.checkAndCleanStatCollection(that);
                    window.AMCGLOBALS.persistent.namespaceName = null;
                    window.AMCGLOBALS.persistent.indexName = null;
                    that.reInitializeCollection(that);
                }else{
                    window.AMCGLOBALS.persistent.namespaceName = selectedNamespace;
                    //that.checkAndCleanStatCollection(that);
                    Util.updateTabLinks(window.AMCGLOBALS.persistent.seedNode);
                    that.initSelectedNamespace(that);
                }
            });
        },
        namespaceSIndexChangeEventListener: function(that, isSelected){
            $('#selectNamespaceSIndex').off('change');
            $('#selectNamespaceSIndex').on('change', function(e){
                var selectedNamespace = this.value;
                if(selectedNamespace === 'not-selected'){
                    that.checkAndCleanStatCollection(that);
                    window.AMCGLOBALS.persistent.namespaceName = null;
                    window.AMCGLOBALS.persistent.indexName = null;
                    that.reInitializeCollection(that);
                }else{
                    window.AMCGLOBALS.persistent.namespaceName = selectedNamespace;
                    $('#selectIndexSIndex').prop("disabled", false);
                    that.setIndexSIndexSelectOption();
                    that.indexSIndexChangeEventListener(that);
                }
            });

        },
        indexSIndexChangeEventListener: function(that){
            $('#selectIndexSIndex').off('change');
            $('#selectIndexSIndex').on('change', function(e){
                if(this.value === 'not-selected'){
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

//            if(isSelectFocus){
//                that.focusNamespaceSelect();
//            }else{
//                that.focusGridSearchInput();
//            }

        },
        setAndDisplaySIndexSelectOption: function(that){
            var subSelectDiv = '#sIndex-namespace-attribute-subSelect';
            if(that.isOldVersion){
                $(subSelectDiv).empty();
                Util.displayOldVersionMsg(subSelectDiv);
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
        initNodeStatCollection: function(){
            this.statCollection = new NodeCollection();
            this.cleanAndStartNewStatCollection('nodes', 'tobeUsedNode');
            this.hideXdrSubSelect();
            this.hideNamespaceSubSelect();
            this.hideSIndexSubSelect();

        },
        initXDRStatCollection: function(that){
            that.setAndDisplayXdrPortOption(that);
            Util.numbericInputValidation('#xdrPortInput', '#changeXdrPortBtn');
            $('#xdrPortInput').val(window.AMCGLOBALS.persistent.xdrPort);
            that.initXdrWithPort(that);
            that.startMonitoringPortChange(that);
        },
        initXdrWithPort: function(that){
                that.statCollection = new XDRCollection();
                that.cleanAndStartNewStatCollection('xdr', window.AMCGLOBALS.persistent.xdrPort);
        },
        initSelectedNamespace: function(that){
                that.statCollection = new NamespaceCollection();
                that.cleanAndStartNewStatCollection('namespace', window.AMCGLOBALS.persistent.namespaceName);
        },
        initSelectedSIndex: function(that){
                that.statCollection = new SIndexCollection();
                var indexOptions = [window.AMCGLOBALS.persistent.namespaceName, window.AMCGLOBALS.persistent.indexName];
                that.cleanAndStartNewStatCollection('sindex', indexOptions);
        },
        refreshNodeCheckBoxList: function(that){
            var visibileColList = that.saveColumnVisibiltyState();
            window.AMCGLOBALS.persistent.nodeListView.render(that.get("nodes"), visibileColList, that);
        },
        changeRefreshInterval: function(that){
            try{
                    var oldStatRefreshInterval = AppConfig.updateInterval['stat']/1000;
                    var newStatRefreshInterval = parseInt($('#refreshIntervalInput').val());
                    if(isNaN(newStatRefreshInterval) || newStatRefreshInterval < 0 || newStatRefreshInterval > 3600 || (newStatRefreshInterval === oldStatRefreshInterval) ){
                        //console.info(newStatRefreshInterval)

                        $('#refreshIntervalInput').val(AppConfig.updateInterval['stat']/1000);
                    }else{
                        AppConfig.updateInterval['stat'] = newStatRefreshInterval*1000;
                        if(newStatRefreshInterval === 0){
                            //STOP Polling
                            Util.stopStatPoller(that);
                            Util.stopPollingCollection(that);
                        }else{
                            //RESET POLLING
                            Util.startStatPoller(that);
                            Util.startVisibleColPolling(that);
                        }
                    }

                }catch(e){
                }
        },
        startEventListeners: function(){
            var that = this;
            $("#applyConfigBtn").off('click').on('click',function(e){
                e.stopPropagation();
                StatTable.updateConfig();
            });
            this.refreshIntervalInputValidation(this);

            $("#nodesCheckBox").off('change').on('change',function(e){
                e.preventDefault();
                e.stopPropagation();
                window.AMCGLOBALS.persistent.showAttributesFor = 'nodes';
                that.reInitializeCollection(that);
            });
            $("#xdrCheckBox").off('change').on('change',function(e){
                e.preventDefault();
                e.stopPropagation();
                window.AMCGLOBALS.persistent.showAttributesFor = 'xdr';
                that.reInitializeCollection(that);
            });
            $("#namespaceCheckBox").off('change').on('change',function(e){
                e.preventDefault();
                e.stopPropagation();
                window.AMCGLOBALS.persistent.showAttributesFor = 'namespace';
                that.reInitializeCollection(that);
            });

            $("#sIndexCheckBox").off('click').on('click',function(e){
                e.preventDefault();
                e.stopPropagation();
                window.AMCGLOBALS.persistent.showAttributesFor = 'sindex';
                that.reInitializeCollection(that);
            });

            $('#attribute-search').off('keydown').on('keydown', function(e){
                window.setTimeout(that.statSearch,500);
            });

            CommandLine.init("#cliInput","#cliOutput", "#cliExecute", true);

            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            }

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);

            window.$("#amcConfigContainer .title-bar").off("click", Util.triggerManageFirstTab).on("click", Util.triggerManageFirstTab);

            window.$("#nodeListSelectBtn").off('click').on('click', function(e){
                var container = $("#all_address_checkboxes");
                $("#nodeListSelectable li.ui-selected").removeClass("unselectable").addClass("selectable");
                $("#nodeListSelectable li").not("#nodeListSelectable li.ui-selected").removeClass("selectable").addClass("unselectable");
                Util.checkMaxLimitAndResetToDefaultMax(container, that);
                $(container).find('li').each(function() {
                    try{
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
                        Util.updateTabLinks();
                        Util.setStatUrl();
                        Util.updateSelectAllToggle();

                    }catch(e){
                        console.info('error in LI iterator');
                    }

                });
            });
        },
        statSearch: function(){
            var searchStr = jQuery("#attribute-search").val();
            StatTable.searchInGrid(AppConfig.stat.statTableDiv, 'stat', 'cn', searchStr);
        },
        checkAndCleanStatCollection: function(that){
                try{

                    if(that.statCollection){
                        var modelsToBeDeleted = that.getAllModels(that.statCollection.models);
                        that.deleteAndDestroyAllModels(that.statCollection, modelsToBeDeleted);
                    }

                }catch(e){
                    console.info(e);
                }
        },
        createNewGridCollection: function(collection, clusterID, specialParam){
            var model;
            if(AppConfig.updateInterval['stat'] === 0){
                AppConfig.updateInterval['stat'] = 5000;
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
        }

    });
    return ClusterModel;
});
