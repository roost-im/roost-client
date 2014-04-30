(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.MessageModel = (function(_super) {
      __extends(MessageModel, _super);

      function MessageModel() {
        this.defaults = __bind(this.defaults, this);
        return MessageModel.__super__.constructor.apply(this, arguments);
      }

      MessageModel.prototype.defaults = function() {
        return {
          auth: 1,
          "class": "",
          classKey: "",
          classKeyBase: "",
          conversation: "",
          id: "",
          instance: "",
          instanceKey: "",
          instanceKeyBase: "",
          isOutgoing: false,
          isPersonal: false,
          message: "",
          opcode: "",
          receiveTime: 0,
          recipient: "",
          sender: "",
          signature: "",
          time: 0
        };
      };

      return MessageModel;

    })(Backbone.Model);
  })();

}).call(this);
