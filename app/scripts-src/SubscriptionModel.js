(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.SubscriptionModel = (function(_super) {
      __extends(SubscriptionModel, _super);

      function SubscriptionModel() {
        this.defaults = __bind(this.defaults, this);
        return SubscriptionModel.__super__.constructor.apply(this, arguments);
      }

      SubscriptionModel.prototype.defaults = function() {
        return {
          "class": "",
          classKey: "",
          instance: "",
          instanceKey: "",
          recipient: ""
        };
      };

      return SubscriptionModel;

    })(Backbone.Model);
  })();

}).call(this);
