define(["jquery", "underscore", "backbone", "helper/util", "config/app-config", "views/configs/useradminview", "helper/AjaxManager"] , function($, _, Backbone, Util, AppConfig, UserAdminView, AjaxManager) {
	var UserModel = Backbone.Model.extend({
		initialize : function(){
			this.availableRoles = { UserAdmin : "user-admin", SystemAdmin : "sys-admin", ReadWrite : "read-write", Read : "read", ReadWriteUdf : "read-write-udf", DataAdmin : "data-admin", Write: "write"};
			this.roleMap = {
                'role-read': this.availableRoles.Read,
                'role-write': this.availableRoles.Write,
                'role-read-write': this.availableRoles.ReadWrite,
                'role-user-admin': this.availableRoles.UserAdmin,
                'role-system-admin': this.availableRoles.SystemAdmin,
                'role-data-admin' : this.availableRoles.DataAdmin,
            };
			this.view = new UserAdminView({model : this});
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
			return AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.userAdmin.getAllUsers;
		},

		parse: function(data, options){
			var that = this;
			if(data.status !== "success")
				return null;

			var users = [];
			for(user in data.users){
				users.push({
					'user': data.users[user].user,
					'roles': data.users[user].roles
				});
			}

			return {'users' : users, availableRoles: (data.roles || _.map(_.values(that.availableRoles), function(role){ 
					var newRole = {}; 
					newRole[role] = [role]; 
					return newRole;
				})
			)};
		},

		validateUserCredentials : function(userName, password, repeatPassword, roles, checkForEmptyPassword){

			var response = null;
			var userObject = {};

			if(typeof (response = this.validateUserName(userName)) === "string"){
				return response;
			} else {
				userObject.user = userName;
			}

			if(password !== "" && typeof (response = this.validatePassword(password, repeatPassword)) === "string"){
				return response;
			} else if(password !== ""){
				userObject.password = password;
			} else if(checkForEmptyPassword && password.trim() === ""){
				return "Error : Password can not be empty";
			}else {
				userObject.password = null;
			}

			if( roles == null || _.isEmpty(roles) ){
				return "Error : No roles assigned"
			}

			userObject.roles = roles != null ? roles.toString() : null;

			return userObject;
		},

		validateUserName: function(userName){
			var userRegex = /[\ ]+/;
			if(userName == null || userName.trim() === ""){
				return "Error : Username cannot be blank";
			} else if( userName.search(userRegex) !== -1 ){
				return "Error : Invalid User Name";
			}

			return true;
		},

		validatePassword: function(password, repeatPassword){
			var passwordRegex = /[\ ]+/;
			if(password == null || password.trim() === ""){
				return "Error : Password cannot be blank";
			}else if(password.search(passwordRegex) !== -1){
				return "Error : Invalid password";
			} else if( password !== repeatPassword ){
				return "Error : Passwords don't match";
			}

			return true;
		},

		addNewUser: function(userName, password, repeatPassword, roles, callback){
			//POST
			var that = this;
			var validationResponse = null;

			if( (validationResponse = this.validateUserCredentials(userName, password, repeatPassword, roles, true)) && validationResponse != null && typeof validationResponse === "object"){
				AjaxManager.sendRequest( AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + AppConfig.userAdmin.addUser, {type: AjaxManager.POST, data:validationResponse},
					function(response){ //SUCCESS
						that.fetch();
						callback && callback(response.status, (response.status === "success" ? "Add User Successful" : response.error));
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

		updateUser: function(userName, password, repeatPassword, roles, oldRoles, callback){
			var that = this;
			var validationResponse = null;

			var updateOnSelf = (sessionStorage.getItem("username") === userName);

			if( (validationResponse = this.validateUserCredentials(userName, password, repeatPassword, roles)) && validationResponse != null && typeof validationResponse === "object"){
				
				validationResponse['old_roles'] = "" + oldRoles;
				
				if(updateOnSelf){
					Util.pauseAllActivePollers(false, true);
				}

				AjaxManager.sendRequest( AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + "/user/" + validationResponse.user + AppConfig.userAdmin.updateUser, 
					{type: AjaxManager.POST, data:validationResponse},
					function(response){ //SUCCESS
						if(updateOnSelf){
							Util.resumeAllActivePollers(true);
						}
						that.fetch();
						callback && callback(response.status, (response.status === "success" ? "Update User Successful" : response.error));
					},

					function(response){	//FAILURE
						if(updateOnSelf){
							Util.resumeAllActivePollers(true);
						}
						callback && callback("failure", "Unknown error");
					}
				);
			} else {
				//error handling
				callback && callback("failure", validationResponse);
			}
		},

		removeUser: function(userName, callback){
			var that = this;
			var validationResponse = null;

			if( (validationResponse = this.validateUserName(userName)) && validationResponse === true){
				AjaxManager.sendRequest( AppConfig.baseUrl + window.AMCGLOBALS.persistent.clusterID + "/user/" + userName + AppConfig.userAdmin.deleteUser, 
					{type: AjaxManager.POST},
					function(response){ //SUCCESS
						that.fetch();
						callback && callback(response.status, (response.status === "success" ? "Drop User Successful" : response.error));
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