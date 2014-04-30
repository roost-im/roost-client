(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.MessagePaneView = (function(_super) {
      __extends(MessagePaneView, _super);

      function MessagePaneView() {
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessagePaneView.__super__.constructor.apply(this, arguments);
      }

      MessagePaneView.prototype.className = 'message-pane-view';

      MessagePaneView.prototype.initialize = function(options) {
        this.model = options.model;
        this.childViews = [];
        return this.listenTo(this.model.get('messages'), 'reset', this.render);
      };

      MessagePaneView.prototype.render = function() {
        var message, view, _i, _j, _len, _len1, _ref, _ref1, _results;
        _ref = this.childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.remove();
        }
        this.$el.empty();
        _ref1 = this.model.get('messages').models;
        _results = [];
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          message = _ref1[_j];
          view = new com.roost.MessageView({
            message: message,
            paneModel: this.model
          });
          view.render();
          this.$el.append(view.$el);
          _results.push(this.childViews.push(view));
        }
        return _results;
      };

      return MessagePaneView;

    })(Backbone.View);
  })();

}).call(this);
