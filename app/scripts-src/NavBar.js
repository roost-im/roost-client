(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.NavBar = (function(_super) {
      __extends(NavBar, _super);

      function NavBar() {
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return NavBar.__super__.constructor.apply(this, arguments);
      }

      NavBar.prototype.className = 'navbar';

      NavBar.prototype.events = {
        'click .btn-login': 'handleLogin'
      };

      NavBar.prototype.initialize = function(options) {
        this.userInfo = options.userInfo;
        return this.listenTo(this.userInfo, 'change', this.render);
      };

      NavBar.prototype.render = function() {
        var template;
        console.log(this.userInfo.attributes);
        this.$el.empty();
        template = com.roost.templates['NavBar'];
        return this.$el.append(template(_.defaults({
          loggedIn: this.userInfo.get('username') != null
        }, this.userInfo.attributes)));
      };

      return NavBar;

    })(Backbone.View);
  })();

}).call(this);
