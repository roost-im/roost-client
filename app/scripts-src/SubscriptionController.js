(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    return com.roost.SubscriptionController = (function() {
      function SubscriptionController(options) {
        this._unsubscribe = __bind(this._unsubscribe, this);
        this._subscribe = __bind(this._subscribe, this);
        this.fetchSubscriptions = __bind(this.fetchSubscriptions, this);
        $.extend(this, Backbone.Events);
        this.subscriptions = options.subscriptions;
        this.api = options.api;
        this.userInfo = options.userInfo;
        this.listenTo(this.userInfo, 'change', this.fetchSubscriptions);
        this.listenTo(this.subscriptions, 'add', this._subscribe);
        this.listenTo(this.subscriptions, 'remove', this._unsubscribe);
      }

      SubscriptionController.prototype.fetchSubscriptions = function() {
        return this.api.get("/v1/subscriptions").then(((function(_this) {
          return function(subs) {
            _this.subscriptions.reset(subs);
            return _this.subscriptions.sort();
          };
        })(this)), ((function(_this) {
          return function(err) {
            console.log("Failed to get subscriptions: " + err);
            throw err;
          };
        })(this))).done();
      };

      SubscriptionController.prototype._subscribe = function(subModel) {
        var data, recipPromise, withZephyr;
        withZephyr = subModel.get('recipient') && subModel.get('recipient')[0] !== '@' ? true : false;
        recipPromise = subModel.get('recipient') === "%me%" ? storageManager.principal() : Q(subModel.get('recipient'));
        data = recipPromise.then(((function(_this) {
          return function(msgRecipient) {
            return {
              subscriptions: [subModel.attributes]
            };
          };
        })(this)));
        return this.api.post("/v1/subscribe", data, {
          withZephyr: withZephyr,
          interactive: true
        }).then(((function(_this) {
          return function() {
            return console.log("Subscribed to " + subModel.get('class'));
          };
        })(this)), ((function(_this) {
          return function(err) {
            console.log("Failed to subscribed to " + subModel.get('class') + ": " + err);
            throw err;
          };
        })(this))).done();
      };

      SubscriptionController.prototype._unsubscribe = function(subModel) {
        var data, recipPromise;
        recipPromise = subModel.get('recipient') === "%me%" ? storageManager.principal() : Q(subModel.get('recipient'));
        data = recipPromise.then(((function(_this) {
          return function(msgRecipient) {
            return {
              subscription: subModel.attributes
            };
          };
        })(this)));
        return this.api.post("/v1/unsubscribe", data, {
          interactive: true
        }).then(((function(_this) {
          return function() {
            return console.log("Unsubscribed from " + subModel.get('class'));
          };
        })(this)), ((function(_this) {
          return function(err) {
            console.log("Failed to unsubscribed from " + subModel.get('class') + ": " + err);
            throw err;
          };
        })(this))).done();
      };

      return SubscriptionController;

    })();
  })();

}).call(this);
