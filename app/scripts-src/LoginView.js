(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.LoginView = (function(_super) {
      __extends(LoginView, _super);

      function LoginView() {
        this._handleLogin = __bind(this._handleLogin, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return LoginView.__super__.constructor.apply(this, arguments);
      }

      LoginView.prototype.className = 'login-view';

      LoginView.prototype.events = {
        'click .login': '_handleLogin'
      };

      LoginView.prototype.initialize = function(options) {
        this.userInfo = options.userInfo;
        return this.listenTo(this.userInfo, 'change', this.render);
      };

      LoginView.prototype.render = function() {
        var template;
        this.$el.empty();
        if (this.userInfo.get('username') != null) {
          return this.$el.hide();
        } else {
          this.$el.show();
          template = com.roost.templates['LoginView'];
          return this.$el.append(template({}));
        }
      };

      LoginView.prototype._handleLogin = function() {
        return this.userInfo.trigger('login');
      };

      return LoginView;

    })(Backbone.View);
  })();

}).call(this);
