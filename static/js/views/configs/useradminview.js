define(["jquery", "underscore", "backbone", "config/app-config", "helper/util"], function($, _, Backbone, AppConfig, Util) {
    var UserAdminView = Backbone.View.extend({
        initialize: function() {
            this.gridInitialized = false;
            this.initEventHandlers();
            this.showDataAdmin = true;
        },

        initEventHandlers: function() {
            var that = this;
            this.model.on("change:users", this.lazyRender, this);
            $("#addNewUser").off("click").on("click", function(){
                that.displayAlterUserForm(true, that.model.get("availableRoles"));
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
            if( $("#aerospikeUserEditor").is(":visible") ){
                that.render();
            } else {
                window.$("#aerospikeUserEditor").off("createGrid").on("createGrid", function(){
                    // window.$("#aerospikeUserEditor").off("createGrid");
                    that.render();
                    that.model.fetch();
                });
            }
        },

        render: function() {
            if (this.gridInitialized) {
                this.updateGrid(this.model.get("users"));
            } else {
                this.initGrid(this.model.get("users"));
            }
        },

        initGrid: function(gridData) {
            var that = this;
            var container = AppConfig.userAdmin.tableDiv;
            var containerWidth = $(container).parent().width();
            var prefix = AppConfig.userAdmin.userTablePrefix;

            var grid = jQuery(container).jqGrid({
                idPrefix: prefix,
                datatype: 'local',
                data: gridData,
                hidegrid: false,
                colNames: AppConfig.userManagementGridColumnNames,
                colModel: AppConfig.userManagementGridColumn,
                height: 'auto',
                loadui: 'disable',
                loadonce: true,
                subGrid: false,
                headertitles: true,
                rowNum: 10,
                rowList: [10, 20, 50, 100, 200, 300],
                sortname: "user",
                sortorder: "asc",
                pager: '#userpager1',
                pagerpos: (innerWidth <= 755 ? 'left' : 'center'),
                rownumbers: (innerWidth > 755),
                recordpos: 'left',
                pgbuttons: true,
                width: containerWidth,
                gridview: true,
                onSelectRow: function(row_id) {
                    var userData = $(container).getRowData(row_id);
                    that.displayAlterUserForm(false, that.model.get("availableRoles"), userData);
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

            this.gridInitialized = true;
        },

        userData: function(container, oldData) {
            var originalContainer = $(container);
            var clonedContainer = originalContainer.clone();

        },

        updateGrid: function(gridData) {
            var container = $(AppConfig.userAdmin.tableDiv);
            container.jqGrid('clearGridData');
            container.setGridParam({data : gridData});
            container.trigger("reloadGrid");
        },

        displayAlterUserForm: function(newUser, availableRoles, userData) {
            var view = this;
            var sameUser = false;

            if(!newUser){
                sameUser =(sessionStorage.getItem("username") === userData.user);
            }            

            var html = "<div class='user-popup-container'>";
            html += "<form class='user-form'>";
            html += "<div class='user-form user-header user-form-row-binder'>";
            html += "<label for='user-data-user'>Username </label> <input type='text' id='user-data-user' name='user' style='width: 175px;' placeholder='Username' " + (sameUser ? "disabled='disabled'" : "") + " " + (newUser ? "" : ("value='" + userData.user + "' disabled='disabled'")) + ">";
            html += "</div>";
            html += "<div class='user-form user-form-content user-form-row-binder'>";
            html += "<label for='user-data-password'>Password </label> <input type='password' id='user-data-password' name='password' placeholder='" + (newUser ? "Password" : "leave blank for no change") + "' "+ (sameUser ? "disabled='disabled'" : "") +" style='width: 175px;'></div>";
            html += "<div class='user-form user-form-content user-form-row-binder' style='text-align: left; display: inline-block; width: 284px;'>";
            html += "<label for='user-data-repeatpassword'>Password </label> <input type='password' id='user-data-repeatpassword' name='repeatpassword' placeholder='Confirm Password' "+ (sameUser ? "disabled='disabled'" : "") +" style='width: 175px'></div>";

            if(availableRoles){
                html += "<div class='user-form user-header user-form-row-binder'>";
                html += "<label for='user-data-user'>Add Role </label> <select id='user-data-add-user' name='adduser' style='width: 98px;'>";

                for (var i = 0; i < availableRoles.length; i++) { 
                    if(!view.showDataAdmin){
                        var values = _.values(availableRoles[i]);
                        for(var j=0;j < values.length;j++){
                            if(values[j] == "data-admin")
                                break;
                        } 
                        if(j == values.length){
                            var role = _.keys(availableRoles[i])[0];
                            html += "<option value='" + role + "'>" + role + "</option>"; 
                        }
                    } else {
                        var role = _.keys(availableRoles[i])[0];
                        html += "<option value='" + role + "'>" + role + "</option>";
                    }
                    
                }

                html += "</select>";
                html += "<input id='user-role-add' type='submit' value='Add' class='btn green_btn' style='margin-left: 5px; color: white;'>";
                html += "</div>";
            }

            html += "<br/>";
            html += "<div class='user-form-aggregator user-form-row-binder' style='height: 200px;'>";
            html += "<table id='userRolesTable' class='user-form user-form-content user-form-row-binder' style='background: rgba(0,0,0,0.05);'></table>";
            html += "</div>";
            html += "</form>";
            html += "</div>";

            function showError(status, message){
                if(status === "failure"){
                    $("#userUpdateConfirm .update-popup-container .popup-error-display").text(message).show();
                }
            }

            Util.createModal(
                {text : (newUser ? 'Add User' : 'Edit User')},
                'Please confirm the following user configuration :',
                html,
                {
                    value : (newUser ? 'Add User' : 'Update'),
                    visible : true,
                    disabled : sameUser,
                    data : {
                        'newUser' : newUser,
                        'userData' : userData
                    },
                    exec : function(event, callback) {
                        var that = this;
                        var user = {
                            user: null,
                            roles: null
                        };

                        var update = false;
                        var roleContainer = $("#userRolesTable");
                        var roleStrStart = ("userrole-").length;

                        $("#userUpdateConfirm form.user-form input").each(function(index, element) {
                            var value = null;
                            if (element.type === 'text' || element.type === "password") {
                                user[element.name] = element.value;

                                if(update === false && event.data.newUser === false){
                                    if(element.type === "password" && element.value !== "") {
                                        update = true;
                                    }
                                }

                            }
                        });

                        user.roles = _.map(roleContainer.getDataIDs(), function(role){ return role.substr(roleStrStart);});

                        if (event.data.newUser) {
                            view.model.addNewUser(user.user, user.password, user.repeatpassword, user.roles, callback);
                        } else {
                            var oldRoles = event.data.userData.roles;
                            
                            if( !_.isEqual(oldRoles, user.roles))
                                update = true;

                            if (update){
                                view.model.updateUser(user.user, user.password, user.repeatpassword, user.roles, oldRoles, callback);
                            }
                        }
                    }
                },

                {
                    value : (sameUser ? 'Close' : 'Cancel'),
                    visible : true,
                    data : {
                        'newUser' : newUser,
                        'userData' : userData
                    },
                    exec : function(event, callback){
                        callback && callback(true, true);
                    }
                },

                {
                    visible : !newUser,
                    value : 'Drop User',
                    disabled : sameUser,
                    data : {
                        'newUser' : newUser,
                        'userData' : userData
                    },
                    exec : function(event, callback){
                        var that = this;
                        
                        setTimeout(function(){
                            view.displayDropConfirm.call(view, event.data.userData['user']);   
                        }, 20);

                        callback && callback(true, true);
                    }
                },

                function(){
                    function passwordCompare(){
                        var repeatPass = $("#userUpdateConfirm input[name=repeatpassword]");
                        var orignalPass = $("#userUpdateConfirm input[name=password]");

                        if(repeatPass.val().trim() !== orignalPass.val().trim() && (orignalPass.val().trim() !== "" || repeatPass.val().trim() !== "")){
                            $("#userUpdateConfirm input[type=password]").removeClass("match").addClass("no-match");
                        } else if(orignalPass.val().trim() === ""){
                            $("#userUpdateConfirm input[type=password]").removeClass("no-match").removeClass("match");
                        }else {
                            $("#userUpdateConfirm input[type=password]").removeClass("no-match").addClass("match");
                        }
                    }

                    $("#userUpdateConfirm input[name=repeatpassword]").off("change").on("change", function(event){
                        passwordCompare();                        
                        $("#userUpdateConfirm input[type=password]").off("change").on("change", function(event){
                            passwordCompare();
                        });
                    });

                    // $("#userUpdateConfirm input[name=role-read-write]").off("change").on("change", function(event){
                    //     if( $(this).prop("checked") ){
                    //         $("#userUpdateConfirm input[name=role-read]").prop("checked", true);
                    //     }
                    // });

                    var roleContainer = $("#userRolesTable"),
                        userTablePrefix = "userrole",
                        userRoles = userData != null ? _.map(userData.roles, function(role){return {role: role};}) : [];

                    $("#user-role-add").off("click").on("click", function(event){
                        event.preventDefault();
                        var role = $("#user-data-add-user").val();
                        var existingRole = roleContainer.getRowData("userrole-" + role);
                        if( _.isEmpty(existingRole) ){
                            roleContainer.addRowData(userTablePrefix + "-" + role, {role: role});
                            view.bindRoleRemove();
                        }
                    });

                    roleContainer.jqGrid({
                        datatype: 'local',
                        prefix: userTablePrefix,
                        hidegrid: false,
                        headertitles: false,
                        colNames: ['Assigned Roles'],
                        colModel: [{name: "role" ,width: '100', sortable: false, resizable: false, align: "center", title: "User Roles", formatter: function(role){
                            return '<span class="drop-index-btn hover-drop-btn persist icon-cancel-circle remove-node-icon"></span><span class="user-role">' + role + "</span>"; 
                        }}],
                        sortorder: "asc",
                        sortname: "role",
                        width: roleContainer.width(),
                        loadComplete: function(){
                            for (var i = 0; i < userRoles.length; i++) {
                                roleContainer.addRowData(userTablePrefix + "-" + userRoles[i].role, userRoles[i]);
                            }

                            view.bindRoleRemove();
                            
                        }
                    });
                }
            );
        },

        bindRoleRemove: function(){
            var roleContainer = $("#userRolesTable");
            roleContainer.find(".drop-index-btn").off("click").on("click", function(event){
                event.preventDefault();
                var rowId = $(this).parent().parent().attr("id");
                roleContainer.delRowData(rowId);
            });
        },

        displayDropConfirm: function(userName) {
            var that = this;
            var html = "<div class='user-popup-container'>";
            html += "Please confirm to Drop user " + userName + " from cluster."
            html += "</div>";

            Util.createModal(
                {text: 'User Editor'},
                ' ',
                html,
                {
                    value : 'confirm',
                    visible : true,
                    data : {
                        'userName' : userName
                    },
                    exec : function(event, callback){
                        that.model.removeUser(event.data.userName, callback);
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
        },

        showUpdateStatus : function(status, message){
            if(status === "success"){
                noty({text : message || "Success", type : 'green', layout: "center", timeout: 8000});
            } else{
                noty({text : message || "Failure", type : 'red', layout: "center", timeout: 8000});
            }
        }
    });

    return UserAdminView;
});
