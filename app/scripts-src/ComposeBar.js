(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.ComposeBar = (function(_super) {
      __extends(ComposeBar, _super);

      function ComposeBar() {
        this._jumpToBottom = __bind(this._jumpToBottom, this);
        this._hideCompose = __bind(this._hideCompose, this);
        this._showCompose = __bind(this._showCompose, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return ComposeBar.__super__.constructor.apply(this, arguments);
      }

      ComposeBar.prototype.className = 'compose-bar';

      ComposeBar.prototype.events = {
        'click .compose': '_showCompose',
        'click .close': '_hideCompose',
        'click .to-bottom': '_jumpToBottom'
      };

      ComposeBar.prototype.initialize = function(options) {
        this.paneModel = options.paneModel;
        return this.listenTo(this.paneModel, 'change:showCompose change:composeFields', this.render);
      };

      ComposeBar.prototype.render = function() {
        var template;
        this.$el.empty();
        template = com.roost.templates['ComposeBar'];
        return this.$el.append(template(this.paneModel.attributes));
      };

      ComposeBar.prototype._showCompose = function() {
        return this.paneModel.set('showCompose', true);
      };

      ComposeBar.prototype._hideCompose = function() {
        return this.paneModel.set('showCompose', false);
      };

      ComposeBar.prototype._jumpToBottom = function() {
        this.paneModel.set('loaded', false);
        return this.paneModel.trigger('toBottom');
      };

      return ComposeBar;

    })(Backbone.View);
  })();

}).call(this);
