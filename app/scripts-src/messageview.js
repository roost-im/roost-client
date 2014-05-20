(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    var QUOTE_LINE_PREFIX, TIME_FORMAT;
    TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a';
    QUOTE_LINE_PREFIX = '> ';
    return com.roost.MessageView = (function(_super) {
      __extends(MessageView, _super);

      function MessageView() {
        this._openQuoteBox = __bind(this._openQuoteBox, this);
        this._openMessageBox = __bind(this._openMessageBox, this);
        this._openReplyBox = __bind(this._openReplyBox, this);
        this.remove = __bind(this.remove, this);
        this.updateColors = __bind(this.updateColors, this);
        this.updateTime = __bind(this.updateTime, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessageView.__super__.constructor.apply(this, arguments);
      }

      MessageView.prototype.className = 'message-view';

      MessageView.prototype.events = {
        'click .reply': '_openReplyBox',
        'click .pm': '_openMessageBox',
        'click .quote': '_openQuoteBox'
      };

      MessageView.prototype.initialize = function(options) {
        this.message = options.message;
        return this.paneModel = options.paneModel;
      };

      MessageView.prototype.render = function() {
        var template;
        this.$el.empty();
        template = com.roost.templates['MessageView'];
        this.$el.append(template(_.defaults({}, this.message.attributes, {
          absoluteTime: this.message.get('time').format(TIME_FORMAT)
        })));
        this.updateTime();
        return this.updateColors();
      };

      MessageView.prototype.updateTime = function() {
        return this.$('.time.from-now').text(this.message.get('time').fromNow());
      };

      MessageView.prototype.updateColors = function() {
        var color, lighterColor, string;
        string = this.message.get('class');
        color = shadeColor(stringToColor(string), 0.5);
        lighterColor = shadeColor(color, 0.4);
        this.$('.header').css({
          background: lighterColor
        });
        this.$('.msg-class').css({
          background: color
        });
        return this.$('.divider').css("border-left", "5px solid " + color);
      };

      MessageView.prototype.remove = function() {
        this.undelegateEvents();
        this.stopListening();
        this.$el.removeData().unbind();
        MessageView.__super__.remove.apply(this, arguments);
        delete this.$el;
        return delete this.el;
      };

      MessageView.prototype._openReplyBox = function() {
        return this.paneModel.set({
          composeFields: {
            "class": this.message.get('class'),
            instance: this.message.get('instance'),
            recipient: '',
            content: ''
          },
          showCompose: true
        });
      };

      MessageView.prototype._openMessageBox = function() {
        return this.paneModel.set({
          composeFields: {
            "class": 'message',
            instance: 'personal',
            recipient: shortZuser(this.message.get('sender')),
            content: ''
          },
          showCompose: true
        });
      };

      MessageView.prototype._openQuoteBox = function() {
        var quoted;
        quoted = QUOTE_LINE_PREFIX + this.message.get('message').replace('\n', "\n" + QUOTE_LINE_PREFIX);
        return this.paneModel.set({
          composeFields: {
            "class": this.message.get('class'),
            instance: this.message.get('instance'),
            recipient: '',
            content: quoted
          },
          showCompose: true
        });
      };

      return MessageView;

    })(Backbone.View);
  })();

}).call(this);
