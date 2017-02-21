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

define(["underscore", "backbone", "helper/util", "config/app-config", "models/definitions/sindexmodel", "models/definitions/setsmodel", "models/definitions/storagemodel", "models/definitions/udfmodel", "models/definitions/xdrmodel", "helper/definitions/sindex-table"], function(_, Backbone, Util, AppConfig, SIndexModel, SetsModel, StorageModel, UdfModel, XdrModel, SIndexTable) {
    var ClusterModel = Backbone.Model.extend({
        initialize: function() {
			this.CID = window.AMCGLOBALS.currentCID;
            this.initVariables();

            $("#addNewIndex").add("#addNewUDF").add("#namespaceTableContainer").add("#udfTableContainer").hide();
			this.on('change:nodes', function(){
				Util.setUpdateInterval(this.get("update_interval"));
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
			 
			
            if(Util.setGlobalClusterInfoInModel("clusters", this)){
                this.fetchSuccess(this);
            }

        },
		
        initVariables: function() {
            this.sIndexModel = null;
            this.setModel = null;
            this.storageModel = null;
            this.udfModel = null;
            this.isOldVersion = false;
            this.firstTimeResponseCome = false;
            this.connectionReqErrCount = 0;
            this.version;
        },
        url: function() {
            return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID/*this.get("cluster_id")*/;// + AppConfig.cluster.resourceUrl;
        },
        fetchSuccess: function(clusterModel) {
            this.version = clusterModel.get('build');
            clusterModel.version = clusterModel.get('build');

            Util.setGlobalClusterInfo({type : "clusters", attributes : clusterModel.attributes});
            Util.removeEnviromentSetupUI();
            
        	clusterModel.connectionReqErrCount = 0;
        	Util.hideAMCNEErrorAlert();
			if(clusterModel.CID !== window.AMCGLOBALS.currentCID){
				clusterModel.destroy();
			}
			if(!clusterModel.firstTimeResponseCome){
				 if(Util.isBelowVersion3(clusterModel.get('build'))){
	            	console.log("older version found : " + (clusterModel.get('build')));
	            	clusterModel.isOldVersion = true;
	             }	
				 window.AMCGLOBALS.pageSpecific.namespaceList = clusterModel.get("namespaces");
		         window.AMCGLOBALS.persistent.nodeList = clusterModel.get("nodes");
		         clusterModel.initSelectedNodes();        
		         Util.updateTabLinks();
		         clusterModel.startEventListeners();
		         clusterModel.firstTimeResponseCome = true;
			}
            			
			if(this.clusterID !== window.AMCGLOBALS.persistent.clusterID){
				this.clusterID = window.AMCGLOBALS.persistent.clusterID;
			}  
			
			if(typeof clusterModel.attributes.error !== 'undefined' && clusterModel.attributes.error.indexOf("Invalid cluster id") != -1){
				delete clusterModel.attributes.error;
				Util.clusterIDReset();				
			}
			
        },
        fetchError: function(response) {
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
        initUdfTable: function(that) {
            if(that.isOldVersion){
                $('#nodeStatListGrid3').empty();
                Util.displayOldVersionMsg('#nodeStatListGrid3');
            }else{
                var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['def']);
                that.udfPoller = null;
                that.udfModel = new UdfModel({"cluster_id" : window.AMCGLOBALS.persistent.clusterID/*that.get("cluster_id")*/});
                that.udfPoller = Util.initPoller(that.udfModel,polOptions);
                that.udfPoller.start();
            }
        },
        unloadUdfTable: function(that) {
            $($('#udfTable')).jqGrid('GridUnload');
            if(that.udfModel !== null){
                Util.stopStatPoller(that.udfModel);
                that.udfModel = Util.destroyModel(that.udfModel);
            }
        },
        initSelectedNodes: function(){
            if(window.AMCGLOBALS.persistent.selectedNodesStr !== null){
                var tempSelectedNodes = window.AMCGLOBALS.persistent.selectedNodesStr.split(',');
                window.AMCGLOBALS.persistent.selectedNodes = _.intersection(window.AMCGLOBALS.persistent.nodeList, tempSelectedNodes);
            }
        },
        initNamespaceTable: function(that) {

            var polOptions = AppConfig.pollerOptions(AppConfig.updateInterval['def']);
            
            if(that.isOldVersion){
                $('#nodeStatListGrid').empty();
                Util.displayOldVersionMsg('#nodeStatListGrid');
            }else{
                that.sIndexPoller = null;
                that.sIndexModel = new SIndexModel({"cluster_id" : window.AMCGLOBALS.persistent.clusterID/*that.get("cluster_id")*/,"version" : that.version});
                that.sIndexPoller = Util.initPoller(that.sIndexModel,polOptions);
                that.sIndexPoller.start();
            }
            
            that.setPoller = null;
            that.setModel = new SetsModel({"cluster_id" : window.AMCGLOBALS.persistent.clusterID/*that.get("cluster_id")*/});
            that.setPoller = Util.initPoller(that.setModel,polOptions);
            that.setPoller.start();
            
            that.storagePoller = null;
            that.storageModel = new StorageModel({"cluster_id" : window.AMCGLOBALS.persistent.clusterID, "update_interval" : 5});
            that.storagePoller = Util.initPoller(that.storageModel,polOptions);
            that.storagePoller.start();

        },
        unloadNamespaceTable: function(that) {
            try{
                $($('#sIndexTable')).jqGrid('GridUnload');
                $($('#setsTable')).jqGrid('GridUnload');
                $($('#storageTable')).jqGrid('GridUnload');
                if(that.sIndexModel !== null){
                    Util.stopStatPoller(that.sIndexModel);
                    that.sIndexModel = Util.destroyModel(that.sIndexModel);
                }
                if(that.setModel !== null){
                    Util.stopStatPoller(that.setModel);
                    that.setModel = Util.destroyModel(that.setModel);
                }
                if(that.storageModel !== null){
                    Util.stopStatPoller(that.storageModel);
                    that.storageModel = Util.destroyModel(that.storageModel);
                }
            }catch(e){
                console.info('NAMESPACE TABLE NOT INIT')
            }
        },
        setAndDisplayNamespaceSelectOption: function(){
            var subSelectDiv = '#namespace-attribute-subSelect';
            $(subSelectDiv).empty();
            $(subSelectDiv).hide();
            var namespaceList = window.AMCGLOBALS.pageSpecific.namespaceList;
            var selectNamespaceHtml = '';
            selectNamespaceHtml += '<span class="sub_select_label">Select Namespace</span><select id="selectNamespace">';
            selectNamespaceHtml += '<option value="not-selected">----</option>'; 
            
            for(var name in namespaceList){
                selectNamespaceHtml +='<option value="'+namespaceList[name]+'" >'+namespaceList[name]+'</option>'; 
            }
            selectNamespaceHtml += '</select>';
            $(subSelectDiv).html(selectNamespaceHtml);
            $(subSelectDiv).show();
           
        },
        focusNamespaceSelect: function() {
            setTimeout(function() {
                $('#selectNamespace:first').focus();
            }, 500);
        },
        hideNamespaceSubSelect: function() {
            $('#namespace-attribute-subSelect').hide();
        },
        showNamespaceSubSelect: function() {
            $('#namespace-attribute-subSelect').show();
        },
        hideNamespaceTable: function(){
            $('#namespaceTableContainer').hide();
        },
        showNamespaceTable: function(namespaceAvailable){
        	var namespaceContainer = $('#namespaceTableContainer');
        	if(!namespaceAvailable){
        		namespaceContainer.addClass("statNotInitialized").attr("data-noInitText", "Select a namespace");
        	} else {
        		namespaceContainer.removeClass("statNotInitialized").removeAttr("data-noInitText");
        	}

            namespaceContainer.slideDown(300);
        },
        hideUdfTable: function(){
            $('#udfTableContainer').hide();
        },
        showUdfTable: function(){
            $('#udfTableContainer').slideDown(150);
        },
        hideSubSelect: function() {
            $('#xdr-attribute-subSelect').hide();
        },
        showSubSelect: function() {
            $('#xdr-attribute-subSelect').show();
        },
        
        prepareNamespaceTable: function(that){
            that.unloadUdfTable(that);
            that.unloadNamespaceTable(that);
            
            that.hideUdfTable();
            that.showNamespaceTable(!!window.AMCGLOBALS.persistent.namespaceName);
            that.showNamespaceSubSelect();
            
            that.setAndDisplayNamespaceSelectOption();
        },
        prepareUdfTable: function(that){
            try{
                that.unloadUdfTable(that);
                that.unloadNamespaceTable(that);
            }catch (e) {
            }
            that.showUdfTable();
            that.hideNamespaceSubSelect();
            that.hideNamespaceTable();
        },
        namespaceChangeEventHandler: function(that){
//            $('#selectNamespace').off('change');
            $('#selectNamespace').on('change', function(e){
                //console.log(this.value)
                if(this.value === 'not-selected'){
                    window.AMCGLOBALS.persistent.namespaceName = null;
                    that.unloadNamespaceTable(that);
                    that.showNamespaceTable(false);
                }else{
                    window.AMCGLOBALS.persistent.namespaceName = this.value;
                    that.unloadNamespaceTable(that);
                    that.initNamespaceTable(that);
                    that.showNamespaceTable(true);
                }
                Util.setDefUrl();
            });
            if(window.AMCGLOBALS.persistent.namespaceName !== null){
                if(_.contains(window.AMCGLOBALS.pageSpecific.namespaceList, window.AMCGLOBALS.persistent.namespaceName)){
                    $('#selectNamespace').val(window.AMCGLOBALS.persistent.namespaceName).trigger('change');
                }
            }
        },
        startEventListeners: function() {
            var that = this;
            $("#namespaceCheckBox").off("change").on("change",function(e){
            	window.AMCGLOBALS.persistent.showAttributesFor = 'namespace';
                that.prepareNamespaceTable(that);
                that.namespaceChangeEventHandler(that);
                Util.setDefUrl();
            });
            $("#udfCheckBox").off("change").on("change",function(){
            	 window.AMCGLOBALS.persistent.showAttributesFor = 'udf';
                 that.prepareUdfTable(that);
                 that.initUdfTable(that);
                 Util.setDefUrl();
            });
            
            if(window.AMCGLOBALS.persistent.showAttributesFor === 'namespace'){
                $('#namespaceCheckBox').prop('checked', true);   
                $("#namespaceCheckBox").trigger('change');
            }else if(window.AMCGLOBALS.persistent.showAttributesFor === 'udf'){
                $('#udfCheckBox').prop('checked', true);   
                $("#udfCheckBox").trigger('change');
            }

            function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            }

            $(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
            
        },
		updatePollingInterval: function(){
            var that = this;
			Util.updateModelPoller(window.AMCGLOBALS.persistent.models.alertModel, AppConfig.updateInterval['alerts'], true);
        }
        
    });
    return ClusterModel;
});
