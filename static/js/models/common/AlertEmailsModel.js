define(['jquery', 'underscore', 'backbone'], function($, _, Backbone){
  var URL = {
    add    : 'alert-emails',
    list   : 'alert-emails',
    remove : 'delete-alert-emails'
  };

  var AlertEmails = Backbone.Model.extend({
    initialize : function(){
      this.emails = [];
      this.get();

      _.bindAll(this, 'get');
      window.setInterval(this.get, 5*1000);
    },

    get: function() {
      var that = this;
      $.get(URL.list).then(
        function success(emails) {
          that.set({emails: emails});
        }, 
        function error(data) {
          console.error(data);
        }
      );
    },

    add: function(emails, successCallback, failureCallback) {
      var that = this;
      var data = {emails: emails.join(',')};
      $.post(URL.add, data).then(
        function success() {
          that.get();
          successCallback && successCallback();
        },
        function failure() {
          failureCallback && failureCallback();
        }
      );
    },

    remove: function(emails, successCallback, failureCallback) {
      var that = this;
      var data = {emails: emails.join(',')};
      $.post(URL.remove, data).then(
        function success() {
          that.get();
          successCallback && successCallback();
        },
        function failure() {
          failureCallback && failureCallback();
        }
      );
    },
  });

  return AlertEmails;
});

