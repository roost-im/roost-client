(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.MessagePaneView = (function(_super) {
      __extends(MessagePaneView, _super);

      function MessagePaneView() {
        this._removeBottomMessage = __bind(this._removeBottomMessage, this);
        this._removeTopMessage = __bind(this._removeTopMessage, this);
        this._prependMessage = __bind(this._prependMessage, this);
        this._appendMessage = __bind(this._appendMessage, this);
        this._addMessages = __bind(this._addMessages, this);
        this._scrollHandle = __bind(this._scrollHandle, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessagePaneView.__super__.constructor.apply(this, arguments);
      }

      MessagePaneView.prototype.className = 'message-pane-view';

      MessagePaneView.prototype.initialize = function(options) {
        this.model = options.model;
        this.childViews = [];
        this.listenTo(this.model.get('messages'), 'reset', this.render);
        this.listenTo(this.model.get('messages'), 'add', this._addMessages);
        this.throttled = _.throttle(this._scrollHandle, 50);
        return this.$el.scroll(this.throttled);
      };

      MessagePaneView.prototype.render = function() {
        var message, view, _i, _j, _len, _len1, _ref, _ref1;
        _ref = this.childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.remove();
        }
        this.$el.empty();
        _ref1 = this.model.get('messages').models;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          message = _ref1[_j];
          view = new com.roost.MessageView({
            message: message,
            paneModel: this.model
          });
          view.render();
          this.$el.append(view.$el);
          this.childViews.push(view);
        }
        this.$el.append('<div class="filler-view">');
        this.model.trigger('messagesSet');
        this.currentTop = 0;
        return this.currentBottom = this.model.get('messages').length;
      };

      MessagePaneView.prototype._scrollHandle = function() {
        var limit, message, messages, _i, _j, _len, _len1, _ref, _ref1, _results, _results1;
        console.log(this.currentTop + ', ' + this.currentBottom);
        messages = this.model.get('messages').models;
        if (this.$el.scrollTop() < this.$el[0].scrollHeight * 0.25) {
          if (this.currentTop > 0) {
            limit = Math.max(this.currentTop - com.roost.EXPANSION_SIZE, 0);
            _ref = messages.slice(limit, this.currentTop);
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              message = _ref[_i];
              this._prependMessage(message);
              this._removeBottomMessage();
              _results.push(this.currentBottom -= 1);
            }
            return _results;
          } else {
            return this.model.trigger('scrollUp');
          }
        } else if (this.$el.scrollTop() > this.$el[0].scrollHeight * 0.75 - this.$('.filler-view').height()) {
          if (this.currentBottom < messages.length) {
            limit = Math.min(this.currentBottom + com.roost.EXPANSION_SIZE, messages.length);
            _ref1 = messages.slice(this.currentBottom, limit);
            _results1 = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              message = _ref1[_j];
              this._appendMessage(message);
              _results1.push(this._removeTopMessage());
            }
            return _results1;
          }
        }
      };

      MessagePaneView.prototype._addMessages = function(message, collection, options) {
        if (options.at === 0) {
          this._prependMessage(message);
          return this._removeBottomMessage();
        } else {
          this._appendMessage(message);
          return this._removeTopMessage();
        }
      };

      MessagePaneView.prototype._appendMessage = function(message) {
        var view;
        view = new com.roost.MessageView({
          message: message,
          paneModel: this.model
        });
        view.render();
        this.$('.filler-view').before(view.$el);
        this.childViews.push(view);
        return this.currentBottom += 1;
      };

      MessagePaneView.prototype._prependMessage = function(message) {
        var change, newHeight, oldHeight, view;
        oldHeight = this.$el[0].scrollHeight;
        view = new com.roost.MessageView({
          message: message,
          paneModel: this.model
        });
        view.render();
        this.$el.prepend(view.$el);
        this.childViews.unshift(view);
        this.currentTop = Math.max(this.currentTop - 1, 0);
        newHeight = this.$el[0].scrollHeight;
        change = newHeight - oldHeight;
        return this.$el.scrollTop(this.$el.scrollTop() + change);
      };

      MessagePaneView.prototype._removeTopMessage = function() {
        var change, newHeight, oldHeight, view;
        oldHeight = this.$el[0].scrollHeight;
        view = this.childViews.shift();
        view.undelegateEvents();
        $(view.$el).removeData().unbind();
        view.remove();
        delete view.$el;
        delete view.el;
        this.currentTop += 1;
        newHeight = this.$el[0].scrollHeight;
        change = oldHeight - newHeight;
        return this.$el.scrollTop(this.$el.scrollTop() - change);
      };

      MessagePaneView.prototype._removeBottomMessage = function() {
        var view;
        view = this.childViews.pop();
        view.undelegateEvents();
        $(view.$el).removeData().unbind();
        view.remove();
        delete view.$el;
        return delete view.el;
      };

      return MessagePaneView;

    })(Backbone.View);
  })();

}).call(this);
