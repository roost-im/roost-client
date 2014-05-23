(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.NavBar = (function(_super) {
      __extends(NavBar, _super);

      function NavBar() {
        this._toggleKeyboard = __bind(this._toggleKeyboard, this);
        this._togglePanes = __bind(this._togglePanes, this);
        this._addPersonalMessagePane = __bind(this._addPersonalMessagePane, this);
        this._addPane = __bind(this._addPane, this);
        this._handleLogout = __bind(this._handleLogout, this);
        this._handleLogin = __bind(this._handleLogin, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return NavBar.__super__.constructor.apply(this, arguments);
      }

      NavBar.prototype.className = 'navbar';

      NavBar.prototype.events = {
        'click .login': '_handleLogin',
        'click .logout': '_handleLogout',
        'click .add-pane': '_addPane',
        'click .personal-message': '_addPersonalMessagePane',
        'click .toggle-panes': '_togglePanes',
        'click .toggle-keyboard': '_toggleKeyboard'
      };

      NavBar.prototype.initialize = function(options) {
        this.session = options.session;
        this.userInfo = this.session.userInfo;
        this.settings = this.session.settingsModel;
        this.listenTo(this.userInfo, 'change', this.render);
        return this.listenTo(this.settings, 'change', this.render);
      };

      NavBar.prototype.render = function() {
        var gravatar, template;
        this.$el.empty();
        template = com.roost.templates['NavBar'];
        if (this.userInfo.get('username') != null) {
          gravatar = getGravatarFromName(this.userInfo.get('username'), this.userInfo.get('realm'), 100);
        }
        return this.$el.append(template(_.defaults({
          loggedIn: this.userInfo.get('username') != null,
          gravatar: gravatar
        }, this.userInfo.attributes, this.settings.attributes)));
      };

      NavBar.prototype._handleLogin = function() {
        return this.userInfo.trigger('login');
      };

      NavBar.prototype._handleLogout = function() {
        return this.userInfo.trigger('logout');
      };

      NavBar.prototype._addPane = function() {
        return this.session.addPane({});
      };

      NavBar.prototype._addPersonalMessagePane = function() {
        return this.session.addPane({
          filters: {
            class_key: 'message',
            instance_key: 'personal',
            is_personal: true
          }
        });
      };

      NavBar.prototype._togglePanes = function() {
        return this.settings.set('panes', !this.settings.get('panes'));
      };

      NavBar.prototype._toggleKeyboard = function() {
        return this.settings.set('keyboard', !this.settings.get('keyboard'));
      };

      return NavBar;

    })(Backbone.View);
  })();

}).call(this);
