define(["jquery", "underscore", "backbone", "config/app-config", "helper/util", "helper/AjaxManager"], function($, _, Backbone, AppConfig, Util, AjaxManager) {
    var UserAdminView = Backbone.View.extend({
        initialize: function() {
            this.gridInitialized = false;
            this.initEventHandlers();
            this.availableSetup = null;
            this.showDataAdmin = true;
        },

        initEventHandlers: function() {
        	var that = this;
            this.model.on("change:roles", this.lazyRender, this);
            $("#addNewRole").off("click").on("click", function(){
            	that.displayAlterRoleForm(true);
            });

            this.model.on("change:namespaces", function(model, namespaces){
                that.availableSetup = [];
                namespaces.forEach(function(namespace){
                    AjaxManager.sendRequest( AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.sets.resourceUrl + namespace + "/sets", 
                        {type: AjaxManager.GET},
                        function(response){ //SUCCESS
                            that.availableSetup.push({namespaceName : namespace, sets : _.map(response.sets, function(set){return set.set_name;})});
                        },

                        function(response){ //FAILURE
                            console.info("Warning : Namespace info not available");
                        }
                    );
                });
            });

            this.model.on("change:cluster_builds", function(model, cluster_builds){
                for(var i=0 ; i < cluster_builds.length ;i++){
                    if(Util.versionCompare(cluster_builds[i], "3.5.14") < 0){
                        that.showDataAdmin = false;
                        break;
                    }
                }
                if(i == cluster_builds.length)
                    that.showDataAdmin = true;
            });
        },

        lazyRender: function(){
            var that = this;
            if( $("#aerospikeRoleEditor").is(":visible") ){
                that.render();
            } else {
                window.$("#aerospikeRoleEditor").off("createGrid").on("createGrid", function(){
                    // window.$("#aerospikeRoleEditor").off("createGrid");
                    that.render();
                    that.model.fetch();
                });
            }
        },

        render: function() {
            var that = this;
            if (that.gridInitialized) {
                that.updateGrid(that.model.get("roles"));
            } else {
                that.initGrid(that.model.get("roles"));
                
            }
        },

        initGrid: function(gridData) {
            var that = this;
            var container = AppConfig.roleAdmin.tableDiv;
            var containerWidth = $(container).parent().width();
            var prefix = AppConfig.roleAdmin.roleTablePrefix;

            var grid = jQuery(container).jqGrid({
                idPrefix: prefix,
                datatype: 'local',
                data: gridData,
                hidegrid: false,
                colNames: AppConfig.roleManagementGridColumnNames,
                colModel: AppConfig.roleManagementGridColumn,
                height: 'auto',
                loadui: 'disable',
                loadonce: true,
                subGrid: false,
                headertitles: true,
                rowNum: 10,
                rowList: [10, 20, 50, 100, 200, 300],
                sortname: "role",
                sortorder: "asc",
                pager: '#rolespager1',
                pagerpos: (innerWidth <= 755 ? 'left' : 'center'),
                rownumbers: (innerWidth > 755),
                recordpos: 'left',
                pgbuttons: true,
                width: containerWidth,
                gridview: true,
                onSelectRow: function(row_id) {
                    var role = $(container).getRowData(row_id);
                    that.displayAlterRoleForm(false, role);
                },
                afterSaveCell: function(rowid, cellname, value, iRow, iCol) {
                        // var userName = $(container).getRowData(row_id).user;
                        // that.updateUser(userName, that.model.roleMap[cellname], value);
                    }
                    // loadComplete: function () {
                    // }
            });

            function handler() {
                if (window.AMCGLOBALS.activePage !== "admin-console") {
                    window.removeEventListener("resize", handler, true);
                    return;
                }
                $(container).setGridWidth(Math.max($(".tab-content:visible").width(), 550));
            }
            window.addEventListener('resize', handler, true);

            that.gridInitialized = true;
        },

        userData: function(container, oldData) {
            var originalContainer = $(container);
            var clonedContainer = originalContainer.clone();

        },

        updateGrid: function(gridData) {
            var container = $(AppConfig.roleAdmin.tableDiv);
            container.jqGrid('clearGridData');
            container.setGridParam({data : gridData});
            container.trigger("reloadGrid");
        },

        displayAlterRoleForm: function(newRole, roleData) {
            var view = this;

            var html = "<div class='user-popup-container'>";
            html += "<form class='user-form'>";
            html += "<div class='user-form user-header user-form-row-binder'>";
            html += "<label for='user-data-role'>Role Name</label> <input type='text' id='user-data-role' name='rolename' style='width: 175px;' placeholder='Role' " + (newRole ? "" : "disabled='disabled'") + " value='" + (newRole ? "" : roleData.role) + "'>";
            html += "</div>";

            html += "<br>";
            html += "<div class='user-form-row-binder user-form-aggregator' style='text-align: left;'>";
            html += "<div class='user-form-row-binder user-header user-form-aggregator-header' style='text-align: center;'>Privileges</div>";
            _.values(view.model.availablePrivileges).forEach(function(privilege){
                if(privilege == "data-admin"){
                    if(view.showDataAdmin){
                        html += "<div class='user-form user-form-content' style='min-width:120px;'> <label for='user-data-role-" + privilege + "'>" + privilege + "</label>";
                        html += "<input type='radio' id='user-data-role-" + privilege + "' name='role-privilege' value='role-" + privilege + "' style='width:auto;'></div>"; 
                    }
                } else{
                    html += "<div class='user-form user-form-content' style='min-width:120px;'> <label for='user-data-role-" + privilege + "'>" + privilege + "</label>";
                    html += "<input type='radio' id='user-data-role-" + privilege + "' name='role-privilege' value='role-" + privilege + "' style='width:auto;'></div>"; 
                }          
            });
            html += "</div>";

            html += "<div class='user-form-row-binder user-form-aggregator'>";
            html += "<div class='user-form-row-binder user-header user-form-aggregator-header'>Scopes</div>";

            html += "<div class='user-form user-header user-form-row-binder'>";
            html += "<label for='user-data-namespace'>Namespace</label> <select id='user-data-namespace' name='namespace'>";
            html += "<option value='GLOBAL' selected='selected'>GLOBAL</option>";

            for (var i = 0; i < view.availableSetup.length; i++) {
                html += "<option value='" + view.availableSetup[i].namespaceName + "'>" + view.availableSetup[i].namespaceName + "</option>";
            };

            html += "</select></div>";

            html += "<div class='user-form user-header user-form-row-binder'>";
            html += "<label for='user-data-set'>Set</label> <select id='user-data-set' name='set'>";

            html += "</select></div>";
            html += "</div>";
            html += "<div class='user-form user-header user-form-row-binder'>";
            html += "<input id='user-privilege-add' type='submit' value='Add' class='btn green_btn' style='margin-left: 5px; color: white;'>";
            html += "</div><br>";
            html += "<div class='user-form-aggregator user-form-row-binder' style='height: 200px;'>";
            html += "<table id='rolePrivilegesTable' class='user-form user-form-content user-form-row-binder' style='background: rgba(0,0,0,0.05);'></table>";
            html += "</div>";

            html += "</form>";
            html += "</div>";

            function showError(status, message){
            	if(status === "failure"){
            		$("#userUpdateConfirm .update-popup-container .popup-error-display").text(message).show();
            	}
            }

            Util.createModal(
                {text: (newRole ? 'Add Role' : 'Edit Role')},               //title
                'Please confirm the following Role configuration :',        //header
                html,                                                       //content
                {                                                           //submit
                    value : (newRole ? 'Add Role' : 'Update'),
                    visible : true,
                    disabled : false,
                    data : {
                        'newRole' : newRole,
                        'roleData' : roleData
                    },
                    exec : function(event, callback) {
                        var that = this;

                        var role = {
                            role : null,
                            privileges : []
                        };

                        var update = false;

                        role.role = $("#user-data-role").val();

                        var tableData = $("#rolePrivilegesTable").getRowData();

                        for (var i = 0; i < tableData.length; i++) {
                            var rowData = tableData[i];
                            var privilegeSpan = rowData.privileges.match(/\<span\ *class\ *\=\ *\"[a-z0-9A-Z_\-]*tag[a-z0-9A-Z_\-]*\"\>[a-z\-A-Z]+\<\/span\>/g);

                            for (var j = 0; j < privilegeSpan.length; j++) {
                                var start = privilegeSpan[j].indexOf(">");
                                start++;
                                var end = privilegeSpan[j].indexOf("<", start);
                                privilegeSpan[j] = privilegeSpan[j].substr(start, end - start);
                            }

                            var fullPrivilegeStr = privilegeSpan.join(".");
                            
                            if(rowData.namespace !== "GLOBAL")
                                fullPrivilegeStr = fullPrivilegeStr + "." + rowData.namespace;

                            if(rowData.set !== "GLOBAL")
                                fullPrivilegeStr = fullPrivilegeStr + "." + rowData.set;

                            role.privileges.push(fullPrivilegeStr);
                        }

                        if (event.data.newRole) {
                            view.model.addNewRole(role.role, role.privileges, callback);
                        } else if( !_.isEqual(role, event.data.roleData) ){
                            view.model.updateRole(role.role, role.privileges, event.data.roleData.privileges, callback);
                        }
                    }
                },

                {
                    value : 'Cancel',
                    visible : true,
                    data : {
                        'newRole' : newRole,
                        'roleData' : roleData
                    },
                    exec : function(event, callback){
                        callback && callback(true, true);
                    }
                },

                {
                    visible : !newRole,
                    value : 'Drop Role',
                    disabled : false,
                    data : {
                        'newRole' : newRole,
                        'roleData' : roleData
                    },
                    exec : function(event, callback){
                        var that = this;
                        
                        setTimeout(function(){
                            view.displayDropConfirm.call(view, event.data.roleData['role']);   
                        }, 20);

                        callback && callback(true, true);
                    }
                },

                function(){
                    
                    var roleContainer = $("#rolePrivilegesTable");
                    var roleTablePrefix = AppConfig.roleAdmin.roleTablePrefix;

                    roleContainer.jqGrid({
                        datatype: 'local',
                        prefix: roleTablePrefix,
                        hidegrid: false,
                        headertitles: false,
                        colNames: ['Privileges', 'namespace', 'set'],
                        colModel: [{name: "privileges" ,width: '150', sortable: false, resizable: false, align: "left", title: "User Roles", formatter: function(rolesArr){
                            var roles = _.clone(rolesArr);
                            var html = '';
                            html += '<span class="drop-index-btn hover-drop-btn icon-cancel-circle remove-node-icon persist"></span><div class="user-role" style="margin-left: 20px;">'
                            for (var i = 0; i < roles.length; i++) {
                                html += "<span class='tag'>" + roles[i] + "</span><br>";
                            };
                            
                            html += "</div>"; 
                            console.log(html);
                            return html;
                        }, unformat: function(cellvalue, options){

                            console.log(cellvalue);
                        }},
                        {name: "namespace" ,width: '80', sortable: false, resizable: false, align: "center", title: "Namespace Scope"},
                        {name: "set" ,width: '80', sortable: false, resizable: false, align: "center", title: "Set Scope"}],
                        sortorder: "asc",
                        sortname: "role",
                        width: roleContainer.width(),
                        loadComplete: function(){
                            if(!newRole){
                                for (var i = 0; i < roleData.privileges.length; i++) {
                                    var roleDataDisintegrate = roleData.privileges[i].split(".");
                                    var roles = [], namespace = "GLOBAL", set = "GLOBAL";

                                    roles = _.intersection(roleDataDisintegrate, _.values(view.model.availablePrivileges));
                                    namespace = _.intersection(roleDataDisintegrate, _.pluck(view.availableSetup, 'namespaceName'))[0] || "GLOBAL";

                                    set = (_.find(view.availableSetup, function(namespaceSet){
                                        return namespaceSet.namespaceName === namespace;
                                    }));

                                    if(set != null){
                                        set = (_.intersection(roleDataDisintegrate, set.sets ))[0];
                                    }

                                    set = set || "GLOBAL";

                                    roleContainer.addRowData(roleTablePrefix + "-" + roles.join("."), {privileges: roles, namespace: namespace, set: set});
                                };

                                view.bindPrivilegeRemove();
                            }
                        }
                    });
                    
                    var roleAddButton = $("#user-privilege-add").attr("disabled", "disabled");
                    var privilegeEl = $("form.user-form").find(":input[type='radio']");
                    var namespaceEl = $("#user-data-namespace");
                    var setEl = $("#user-data-set");

                    if( _.contains(view.model.globalPrivileges, view.model.privilegeMap[privilegeEl.val()] ) ){
                        namespaceEl.attr("disabled", "disabled");
                    }

                    setEl.empty()
                        .attr("disabled", "disabled")
                        .append("<option value='GLOBAL' selected='selected'>GLOBAL</option>");

                    roleAddButton.off("click").on("click", function(event){
                        event.preventDefault();
                        var checkedRoles = privilegeEl.filter(":input:checked");
                        var enabledSelects = $("form.user-form").find("select:not(:disabled)");
                        
                        var roles = [];
                        var namespace = enabledSelects.filter("[name='namespace']").val() || "GLOBAL";
                        var set = enabledSelects.filter("[name='set']").val()  || "GLOBAL";
                        checkedRoles.each(function(index, element){
                            roles.push(view.model.privilegeMap[ element.getAttribute("value") ]);
                        });

                        roleContainer.addRowData(roleTablePrefix + "-" + roles.join("."), {privileges: roles, namespace: namespace, set: set});

                        $("#userUpdateConfirm form input[type=radio]").prop("checked", false);
                        $("#userUpdateConfirm form select").attr("disabled", "disabled").val("GLOBAL");
                        roleAddButton.attr("disabled", "disabled");
                        
                        view.bindPrivilegeRemove();
                    });

                    privilegeEl.off("click").on("click", function(event){
                        var globalChecked = false;
                        var checkedInputs = privilegeEl.filter(":input:checked");

                        checkedInputs.each(function(index, element){
                            if( _.contains(view.model.globalPrivileges, view.model.privilegeMap[ element.getAttribute("value") ] ) ){
                                globalChecked = true;
                            }
                        });

                        if(checkedInputs.length === 0){
                            roleAddButton.attr("disabled", "disabled");
                        } else {
                            roleAddButton.removeAttr("disabled");
                        }

                        if(globalChecked){
                            $("#userUpdateConfirm form select").val("GLOBAL").attr("disabled", "disabled");
                        }else {
                            namespaceEl.removeAttr("disabled");
                        }

                    });

                    namespaceEl.off("change").on("change", function(event){
                        var selectedNamespace = namespaceEl.val();
                        
                        setEl.empty()
                            .append("<option value='GLOBAL' selected='selected'>GLOBAL</option>");

                        if(selectedNamespace === "GLOBAL"){
                            setEl.attr("disabled", "disabled");
                            return;
                        }

                        var namespace = _.find(view.availableSetup, function(namespace){
                            return namespace.namespaceName === selectedNamespace;
                        });

                        
                        
                        namespace.sets.forEach(function(set){
                            setEl.append("<option value='" + set + "'>" + set + "</option>");
                        });

                        setEl.removeAttr("disabled");
                    });

                }
            );
        },

        bindPrivilegeRemove: function(){
            var roleContainer = $("#rolePrivilegesTable");
            roleContainer.find(".drop-index-btn").off("click").on("click", function(event){
                event.preventDefault();
                var rowId = $(this).parent().parent().attr("id");
                roleContainer.delRowData(rowId);
            });
        },

        displayDropConfirm: function(roleName) {
            var that = this;
            var html = "<div class='user-popup-container'>";
            html += "Please confirm to Drop role " + roleName + " from cluster."
            html += "</div>";

            Util.createModal(
                {text: 'User Editor'},
                ' ',
                html,
                {
                    value : 'confirm',
                    visible : true,
                    data : {
                        'userName' : roleName
                    },
                    exec : function(event, callback){
                        that.model.removeRole(roleName, callback);
                    }
                },

                {
                    value : 'cancel',
                    visible : true,
                    data : null,
                    exec : function(event, callback){
                        callback && callback(true, true);
                    }
                },

                {
                    value : '',
                    visible : false,
                }
            );
        }
    });

    return UserAdminView;
});
