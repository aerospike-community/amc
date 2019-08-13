define(["jquery", "underscore", "backbone", "helper/util", "config/app-config", "views/configs/roleadminview", "helper/AjaxManager"] , function($, _, Backbone, Util, AppConfig, RoleAdminView, AjaxManager) {
	var UserModel = Backbone.Model.extend({
		initialize : function(){
			this.availablePrivileges = { UserAdmin : "user-admin", SystemAdmin : "sys-admin", ReadWrite : "read-write", Read : "read", ReadWriteUdf : "read-write-udf", DataAdmin : "data-admin", Write: "write"};
			this.privilegeMap = {
                'role-read': this.availablePrivileges.Read,
                'role-write': this.availablePrivileges.Write,
                'role-read-write': this.availablePrivileges.ReadWrite,
                'role-user-admin': this.availablePrivileges.UserAdmin,
                'role-sys-admin': this.availablePrivileges.SystemAdmin,
                'role-read-write-udf': this.availablePrivileges.ReadWriteUdf,
                'role-data-admin' : this.availablePrivileges.DataAdmin
            };
            this.globalPrivileges = ["user-admin", "sys-admin", "data-admin"];

			this.view = new RoleAdminView({model : this});
			this.fetch();
		},

		initEventListeners: function(){
			var that = this;

			function viewDestroy(){
                $(document).off("view:Destroy", viewDestroy);
                that.destroy();
            }
            
			$(document).off("view:Destroy", viewDestroy).on("view:Destroy", viewDestroy);
		},

		url : function(){
			return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.roleAdmin.getAllRoles;
		},

		parse: function(data, options){
			if(data.status !== "success")
				return null;

			var roles = [];

			for(role in data.roles){
				roles.push({
					'role': _.keys(data.roles[role])[0],
					'privileges': _.values(data.roles[role])[0]
				});
			}

			return {roles: roles};
		},

		validateRole: function(roleName, privileges, onlyRoleName){
			var that = this;
			var roleRegex = /[\ ]+/;
			roleName = roleName.trim();
			if(roleName == null || roleName === ""){
				return "Error : Role name cannot be blank";
			} else if( _.contains(_.values(that.availablePrivileges), roleName) ){
				return "Error : Update operation on default roles are not allowed";
			} else if( roleName.search(roleRegex) !== -1 ){
				return "Error : Invalid Role Name";
			} else if( !onlyRoleName && (privileges == null || _.isEmpty(privileges)) ){
				return "Error : No privileges assigned";
			} 

			return true;
		},

		addNewRole: function(roleName, privileges, callback){
			var that = this;
			var validationResponse = null;

			var postData = {
				role: roleName, 
				privileges: (privileges.join(","))
			};

			if( (validationResponse = this.validateRole(roleName, privileges)) && validationResponse === true){
				
				AjaxManager.sendRequest( AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + "/roles/" + roleName + AppConfig.roleAdmin.addRole, 
					{type: AjaxManager.POST, data: postData}, 
					function(response){ //SUCCESS
						that.fetch();
						callback && callback(response.status, (response.status === "success" ? "Add Role Successful" : response.error));
					},

					function(response){	//FAILURE
						callback && callback("failure", "Unknown error");
					}
				);
			} else {
				//error handling
				callback && callback("failure", validationResponse);
			}
		},

		updateRole: function(roleName, privileges, oldPrivileges, callback){
			var that = this;
			var validationResponse = null;

			var postData = {
				role: roleName, 
				privileges: (privileges.join(",")), 
				old_privileges: oldPrivileges.join(",")
			};

			if( (validationResponse = this.validateRole(roleName, privileges)) && validationResponse === true){
				
				AjaxManager.sendRequest( AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + "/roles/" + roleName + AppConfig.roleAdmin.updateRole, 
					{type: AjaxManager.POST, data: postData}, 
					function(response){ //SUCCESS
						that.fetch();
						callback && callback(response.status, (response.status === "success" ? "Update Role Successful" : response.error));
					},

					function(response){	//FAILURE
						callback && callback("failure", "Unknown error");
					}
				);
			} else {
				//error handling
				callback && callback("failure", validationResponse);
			}
		},

		removeRole: function(roleName, callback){
			var that = this;
			var validationResponse = null;

			if( (validationResponse = this.validateRole(roleName, null, true)) && validationResponse === true){
				AjaxManager.sendRequest( AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + "/roles/" + roleName + AppConfig.roleAdmin.deleteRole, 
					{type: AjaxManager.POST},
					function(response){ //SUCCESS
						that.fetch();
						callback && callback(response.status, (response.status === "success" ? "Drop Role Successful" : response.error));
					},

					function(response){	//FAILURE
						callback && callback("failure", "Unknown error");
					}
				);
			} else {
				//error handling
				callback && callback("failure", validationResponse);
			}
		}

	});

	return UserModel;
	
});