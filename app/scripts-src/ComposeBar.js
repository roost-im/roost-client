(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.ComposeBar = (function(_super) {
      __extends(ComposeBar, _super);

      function ComposeBar() {
        this._updateButton = __bind(this._updateButton, this);
        this._sendMessage = __bind(this._sendMessage, this);
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
        'click .to-bottom': '_jumpToBottom',
        'click .send': '_sendMessage'
      };

      ComposeBar.prototype.initialize = function(options) {
        this.paneModel = options.paneModel;
        this.listenTo(this.paneModel, 'change:showCompose change:composeFields', this.render);
        return this.listenTo(this.paneModel, 'change:sending', this._updateButton);
      };

      ComposeBar.prototype.render = function() {
        var template;
        this.$el.empty();
        template = com.roost.templates['ComposeBar'];
        this.$el.append(template(this.paneModel.attributes));
        return this.$('.class-input').focus();
      };

      ComposeBar.prototype._showCompose = function() {
        return this.paneModel.set('showCompose', true);
      };

      ComposeBar.prototype._hideCompose = function() {
        return this.paneModel.set({
          showCompose: false,
          composeFields: {
            "class": '',
            instance: '',
            recipient: '',
            content: ''
          }
        });
      };

      ComposeBar.prototype._jumpToBottom = function() {
        this.paneModel.set('loaded', false);
        return this.paneModel.trigger('toBottom');
      };

      ComposeBar.prototype._sendMessage = function() {
        if (!this.paneModel.get('sending')) {
          this.paneModel.set('composeFields', {
            "class": this.$('.class-input').val(),
            instance: this.$('.instance-input').val(),
            recipient: this.$('.recipient-input').val(),
            content: this.$('.content-input').val()
          });
          this.paneModel.set('sending', true);
          return this.paneModel.trigger('sendMessage');
        }
      };

      ComposeBar.prototype._updateButton = function() {
        if (this.paneModel.get('sending')) {
          return this.$('.send').addClass('disabled').text('Sending...');
        } else {
          return this.$('.send').removeClass('disabled').text('Send');
        }
      };

      return ComposeBar;

    })(Backbone.View);
  })();

}).call(this);
