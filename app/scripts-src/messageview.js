(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    var TIME_FORMAT;
    TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a';
    return com.roost.MessageView = (function(_super) {
      __extends(MessageView, _super);

      function MessageView() {
        this.updateTime = __bind(this.updateTime, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessageView.__super__.constructor.apply(this, arguments);
      }

      MessageView.prototype.className = 'message-view';

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
        return this.updateTime();
      };

      MessageView.prototype.updateTime = function() {
        return this.$('.time.from-now').text(this.message.get('time').fromNow());
      };

      return MessageView;

    })(Backbone.View);
  })();

}).call(this);
