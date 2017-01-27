define(['jquery', 'underscore', 'models/common/PopupModel'], function($, _, PopupModel) {
  var modal = {
    showModalDialog : function(DOM, modalSettings, submit, cancel){
        $("#ModalWrapper").remove();
        $("body").append(DOM);
        $("#ModalWrapper").dialog(_.extend({
            modal: true,
            resizable: false
        }, modalSettings));

        if(submit){
            $("#ModalSubmit").on("click", submit);
        }

        if(cancel){
            $("#ModalCancel").on("click", cancel);
        }

        $("#modalBody .modal-content").on("keydown", function(e){
            if (e.keyCode === 13) {
                submit(e);
            }
        });
        $(window).resize(function() {
            $("#ModalWrapper").dialog("option", "position", "center");
        });
    },

    hideModalDialog : function(){
        $("#ModalWrapper").remove();
    },

    confirmModal: function(title, content, onselect, oncancel) {
      var popupModel = new PopupModel({
        cancelButtonValue: 'Cancel',
        content: '<div style="padding: 15px; font-size: 16px; margin-bottom: 20px">' + content + '</div>',
        modalClass: 'user-popup',
        submitButtonValue: 'OK',
        title: title,
      });
      var DOM = _.template($("#ModalTemplate").text(), popupModel.toJSON());
      var modalSettings = {width: '600px', closeOnEscape: true, dialogClass: 'no-dialog-title'};

      var success = function() {
        modal.hideModalDialog();
        onselect && onselect();
      };
      var cancel = function() {
        modal.hideModalDialog();
        oncancel && oncancel();
      };
      modal.showModalDialog(DOM, modalSettings, success, cancel);
    },

    messageModal: function(title, content, callback) {
      var popupModel = new PopupModel({
        showCancelButton: false,
        content: '<div style="padding: 15px; font-size: 16px; margin-bottom: 20px">' + content + '</div>',
        modalClass: 'user-popup',
        submitButtonValue: 'OK',
        title: title,
      });
      var DOM = _.template($("#ModalTemplate").text(), popupModel.toJSON());
      var modalSettings = {width: '600px', closeOnEscape: true, dialogClass: 'no-dialog-title'};

      var success = function() {
        modal.hideModalDialog();
        callback && callback();
      };
      modal.showModalDialog(DOM, modalSettings, success);
    },
  };

  return modal;
});  
  

