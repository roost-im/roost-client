(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    return com.roost.ComposeController = (function() {
      function ComposeController(options) {
        this._sendMessage = __bind(this._sendMessage, this);
        $.extend(this, Backbone.Events);
        this.api = options.api;
        this.model = options.model;
        this.listenTo(this.model, 'sendMessage', this._sendMessage);
      }

      ComposeController.prototype._sendMessage = function() {
        var data;
        data = this.api.userInfo().ready().then((function(_this) {
          return function() {
            var msg, zsig;
            zsig = _this.api.userInfo().get('zsig');
            if (zsig == null) {
              zsig = "Sent from Roost";
            }
            msg = _this.model.get('composeFields');
            return {
              message: {
                "class": msg["class"],
                instance: msg.instance,
                recipient: msg.recipient,
                opcode: "",
                signature: zsig,
                message: msg.content
              }
            };
          };
        })(this));
        return this.api.post("/v1/zwrite", data, {
          withZephyr: true,
          interactive: true
        }).then((function(_this) {
          return function(ret) {
            return console.log("Sent:", ret.ack);
          };
        })(this))["finally"]((function(_this) {
          return function() {
            return _this.model.set({
              showCompose: false,
              sending: false,
              composeFields: {}
            });
          };
        })(this)).done();
      };

      return ComposeController;

    })();
  })();

}).call(this);
