define(['jquery', 'underscore', 'backbone', 'helper/notification'], 
function($, _, Backbone, Notification) {
  function validateEmail(email) {
    // see http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  var AlertEmailsView = Backbone.View.extend({
    initialize: function() {
      _.bindAll(this, 'addEmail', 'removeEmail', 'render');
      this.listenTo(this.model, 'change', this.render, this);
    },

    render: function() {
      var emails = this.model.attributes.emails;
      var tmpl = this.template(emails);
      this.$el.html(tmpl);
      return this;
    },

    events: {
      'click li .icon-cancel-circle': 'removeEmail',
      'click button': 'addEmail',
    },

    removeEmail: function(evt) {
      var email = evt.target.parentElement.innerText;
      var emails = [email];
      this.model.remove(emails, 
        function success() {
          Notification.toastNotification('green', 'Email: ' + email + ' removed successfully');
        },
        function failure() {
          Notification.toastNotification('red', 'Unable to remove email: ' + email);
        }
      );
    },

    addEmail: function() {
      var input = this.$('form input[name=email]');
      var email = input.val();
      var valid = validateEmail(email);
      var err = this.$('.err-text');
      if(!valid) {
        err.show();
        window.setTimeout(function() {
          err.hide();
        }, 2000);
        return;
      } 
      err.hide();
      this.model.add([email],
        function success() {
          Notification.toastNotification('green', 'Email: ' + email + ' added successfully');
        },
        function failure() {
          Notification.toastNotification('red', 'Unable to add email: ' + email);
        }
      );
    },

    template: function(emails) {
      var tmpl = '<ul>';
      if(!emails || emails.length === 0) {
        tmpl += '<li> <p> No emails configured to receive alerts </p> </li>';
      } else {
        _.each(emails, function(email) {
          tmpl += '<li class="alert-email" style="line-height: 30px; padding: 2px; border-bottom: 1px solid #e5e5e5">' + 
                    '<span class="icon-cancel-circle" style="font-size: 10px; cursor: pointer; margin-right: 10px" title="Remove email"></span>' + 
                    email + 
                  '</li>';
        });   
      };
      tmpl += '</ul>';

      tmpl += '<form>' +
                '<input type="email" name="email" required placeholder="Email">' +
                '<button type="button" style="margin-left: 10px" class="btn blue_btn"> Add </button>' +
                '<span class="err-text" style="display: none; color: orange"> Invalid email </span>' + 
              '</form>';
      return tmpl;
    },
  });

  return AlertEmailsView;
});





