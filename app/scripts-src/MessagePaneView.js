(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.MessagePaneView = (function(_super) {
      __extends(MessagePaneView, _super);

      function MessagePaneView() {
        this._restoreScrollHeight = __bind(this._restoreScrollHeight, this);
        this._saveScrollHeight = __bind(this._saveScrollHeight, this);
        this._removeBottomMessage = __bind(this._removeBottomMessage, this);
        this._removeTopMessage = __bind(this._removeTopMessage, this);
        this._prependMessage = __bind(this._prependMessage, this);
        this._appendMessage = __bind(this._appendMessage, this);
        this._addMessages = __bind(this._addMessages, this);
        this._scrollHandle = __bind(this._scrollHandle, this);
        this._updateMessageTimes = __bind(this._updateMessageTimes, this);
        this._updatePosition = __bind(this._updatePosition, this);
        this._getSelectedViewIndex = __bind(this._getSelectedViewIndex, this);
        this.selectedMessagePM = __bind(this.selectedMessagePM, this);
        this.selectedMessageQuote = __bind(this.selectedMessageQuote, this);
        this.selectedMessageReply = __bind(this.selectedMessageReply, this);
        this._setScrollForSelectedMessage = __bind(this._setScrollForSelectedMessage, this);
        this.moveSelectedMessage = __bind(this.moveSelectedMessage, this);
        this.remove = __bind(this.remove, this);
        this.recalculateWidth = __bind(this.recalculateWidth, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessagePaneView.__super__.constructor.apply(this, arguments);
      }

      MessagePaneView.prototype.className = 'message-pane-view';

      MessagePaneView.prototype.initialize = function(options) {
        this.model = options.model;
        this.session = options.session;
        this.childViews = [];
        this.listenTo(this.model.get('messages'), 'reset', this.render);
        this.listenTo(this.model.get('messages'), 'add', this._addMessages);
        this.listenTo(this.model, 'change:position', this._updatePosition);
        this.throttled = _.throttle(this._scrollHandle, 50);
        this.$el.scroll(this.throttled);
        this.interval = setInterval(this._updateMessageTimes, 30000);
        this.index = 0;
        return this.width = 100;
      };

      MessagePaneView.prototype.render = function() {
        var $loading, $noMessages, $positionMessage, message, view, _i, _j, _len, _len1, _ref, _ref1;
        _ref = this.childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.remove();
        }
        this.$el.empty();
        this.childViews = [];
        _ref1 = this.model.get('messages').models;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          message = _ref1[_j];
          view = new com.roost.MessageView({
            message: message,
            paneModel: this.model,
            session: this.session
          });
          view.render();
          this.$el.append(view.$el);
          this.childViews.push(view);
        }
        this.$el.append('<div class="filler-view">');
        if (this.model.get('messages').length === 0) {
          if (this.model.get('loaded')) {
            $noMessages = $('<div class="no-messages">').text('No messages');
            this.$el.prepend($noMessages);
          } else {
            $loading = $('<div class="loading">');
            $loading.append('<i class="fa fa-circle-o-notch fa-spin"></i>');
            this.$el.prepend($loading);
          }
        } else {
          if (this.model.get('position') != null) {
            $positionMessage = this.$('.positioned');
            this.$el.scrollTop(this.$el.scrollTop() + ($positionMessage.offset().top - this.model.get('posScroll')));
          } else {
            this.$el.scrollTop(this.$el[0].scrollHeight);
          }
        }
        this.currentTop = 0;
        this.currentBottom = this.model.get('messages').length;
        this.composeView = new com.roost.ComposeBar({
          paneModel: this.model
        });
        this.composeView.render();
        this.$el.append(this.composeView.$el);
        this.filterView = new com.roost.FilterBar({
          paneModel: this.model,
          session: this.session
        });
        this.filterView.render();
        this.$el.append(this.filterView.$el);
        return this.recalculateWidth(this.index, this.width);
      };

      MessagePaneView.prototype.recalculateWidth = function(index, width) {
        this.index = index;
        this.width = width;
        this._saveScrollHeight();
        this.$el.css({
          width: "" + width + "%"
        });
        this.composeView.$el.css({
          width: "" + width + "%",
          left: "" + (index * width) + "%"
        });
        this.filterView.$el.css({
          width: "" + width + "%",
          left: "" + (index * width) + "%"
        });
        return this._restoreScrollHeight();
      };

      MessagePaneView.prototype.remove = function() {
        var view, _i, _len, _ref;
        this.composeView.remove();
        this.filterView.remove();
        clearInterval(this.interval);
        _ref = this.childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.remove();
        }
        this.undelegateEvents();
        this.stopListening();
        this.$el.removeData().unbind();
        MessagePaneView.__super__.remove.apply(this, arguments);
        delete this.$el;
        return delete this.el;
      };

      MessagePaneView.prototype.moveSelectedMessage = function(diff) {
        var $view, bottomPoint, i, newIndex, newSelectedView, selectedIndex, selectedView, topPoint, _i, _j, _ref, _ref1;
        if (this.model.get('position') != null) {
          selectedIndex = this._getSelectedViewIndex();
          selectedView = this.childViews[selectedIndex];
          if (selectedView != null) {
            $view = selectedView.$el;
            bottomPoint = $view.offset().top + $view.height();
            topPoint = $view.offset().top - 80;
            if ((topPoint < this.$el.height() && topPoint > 0) || (bottomPoint > 0 && bottomPoint < this.$el.height())) {
              newIndex = Math.min(Math.max(selectedIndex + diff, 0), this.childViews.length - 1);
              newSelectedView = this.childViews[newIndex];
              this.model.set('position', newSelectedView.message.get('id'));
              this._setScrollForSelectedMessage(newSelectedView);
              return;
            }
          }
        }
        if (diff < 0) {
          for (i = _i = _ref = this.childViews.length - 1; _ref <= 0 ? _i <= 0 : _i >= 0; i = _ref <= 0 ? ++_i : --_i) {
            selectedView = this.childViews[i];
            $view = selectedView.$el;
            bottomPoint = $view.offset().top + $view.height();
            if (bottomPoint < this.$el.height()) {
              this.model.set('position', selectedView.message.get('id'));
              break;
            }
          }
        } else {
          for (i = _j = 0, _ref1 = this.childViews.length - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
            selectedView = this.childViews[i];
            $view = selectedView.$el;
            topPoint = $view.offset().top - 80;
            if (topPoint > 0) {
              this.model.set('position', selectedView.message.get('id'));
              break;
            }
          }
        }
        return this._setScrollForSelectedMessage(selectedView);
      };

      MessagePaneView.prototype._setScrollForSelectedMessage = function(selectedView) {
        var $view, bottomPoint, scrollDiff, topPoint;
        $view = selectedView.$el;
        bottomPoint = $view.offset().top + $view.height();
        topPoint = $view.offset().top - 80;
        if (topPoint < 0) {
          scrollDiff = 100 - topPoint;
        } else if (bottomPoint > this.$el.height()) {
          scrollDiff = (this.$el.height() - 100) - bottomPoint;
        } else {
          return;
        }
        return this.$el.scrollTop(this.$el.scrollTop() - scrollDiff);
      };

      MessagePaneView.prototype.selectedMessageReply = function() {
        var view;
        view = this.childViews[this._getSelectedViewIndex()];
        return view != null ? view.openReplyBox() : void 0;
      };

      MessagePaneView.prototype.selectedMessageQuote = function() {
        var view;
        view = this.childViews[this._getSelectedViewIndex()];
        return view != null ? view.openQuoteBox() : void 0;
      };

      MessagePaneView.prototype.selectedMessagePM = function() {
        var view;
        view = this.childViews[this._getSelectedViewIndex()];
        return view != null ? view.openMessageBox() : void 0;
      };

      MessagePaneView.prototype._getSelectedViewIndex = function() {
        var i, view, _i, _ref;
        if (this.model.get('position') != null) {
          for (i = _i = 0, _ref = this.childViews.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
            view = this.childViews[i];
            if (view.message.get('id') === this.model.get('position')) {
              return i;
            }
          }
        }
        return -1;
      };

      MessagePaneView.prototype._updatePosition = function() {
        var view, _i, _len, _ref, _results;
        _ref = this.childViews;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          _results.push(view.updatePosition());
        }
        return _results;
      };

      MessagePaneView.prototype._updateMessageTimes = function() {
        var view, _i, _len, _ref, _results;
        _ref = this.childViews;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          _results.push(view.updateTime());
        }
        return _results;
      };

      MessagePaneView.prototype._scrollHandle = function() {
        var limit, message, messages, _i, _j, _len, _len1, _ref, _ref1, _results, _results1;
        messages = this.model.get('messages').models;
        if (this.$el.scrollTop() < this.$el[0].scrollHeight * 0.15) {
          if (this.currentTop > 0) {
            limit = Math.max(this.currentTop - com.roost.EXPANSION_SIZE, 0);
            _ref = messages.slice(limit, this.currentTop).reverse();
            _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              message = _ref[_i];
              this._prependMessage(message);
              _results.push(this._removeBottomMessage());
            }
            return _results;
          } else if (this.currentTop <= 0 && !this.model.get('isTopDone') && !this.model.get('topLoading')) {
            return this.model.trigger('scrollUp');
          }
        } else if (this.$el.scrollTop() + this.$el.height() > this.$el[0].scrollHeight * 0.90 - this.$('.filler-view').height()) {
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
          } else if (this.currentBottom >= messages.length && !this.model.get('isBottomDone') && !this.model.get('bottomLoading')) {
            return this.model.trigger('scrollDown');
          }
        }
      };

      MessagePaneView.prototype._addMessages = function(message, collection, options) {
        this.$('.no-messages').remove();
        this.$('.loading').remove();
        if (options.at === 0) {
          this._prependMessage(message);
          if (this.childViews.length > com.roost.STARTING_SIZE) {
            return this._removeBottomMessage();
          }
        } else {
          this._appendMessage(message);
          if (this.childViews.length > com.roost.STARTING_SIZE) {
            return this._removeTopMessage();
          }
        }
      };

      MessagePaneView.prototype._appendMessage = function(message) {
        var view;
        view = new com.roost.MessageView({
          message: message,
          paneModel: this.model,
          session: this.session
        });
        view.render();
        this.$('.filler-view').before(view.$el);
        this.childViews.push(view);
        return this.currentBottom = Math.min(this.currentBottom + 1, this.model.get('messages').length);
      };

      MessagePaneView.prototype._prependMessage = function(message) {
        var view;
        this._saveScrollHeight();
        view = new com.roost.MessageView({
          message: message,
          paneModel: this.model,
          session: this.session
        });
        view.render();
        this.$el.prepend(view.$el);
        this.childViews.unshift(view);
        this.currentTop = Math.max(this.currentTop - 1, 0);
        return this._restoreScrollHeight();
      };

      MessagePaneView.prototype._removeTopMessage = function() {
        var view;
        this._saveScrollHeight();
        view = this.childViews.shift();
        view.remove();
        this.currentTop = this.currentBottom - this.childViews.length;
        return this._restoreScrollHeight();
      };

      MessagePaneView.prototype._removeBottomMessage = function() {
        var view;
        view = this.childViews.pop();
        view.remove();
        return this.currentBottom = this.currentTop + this.childViews.length;
      };

      MessagePaneView.prototype._saveScrollHeight = function() {
        return this.cachedHeight = this.$el[0].scrollHeight;
      };

      MessagePaneView.prototype._restoreScrollHeight = function() {
        var change, newHeight;
        newHeight = this.$el[0].scrollHeight;
        change = this.cachedHeight - newHeight;
        return this.$el.scrollTop(this.$el.scrollTop() - change);
      };

      return MessagePaneView;

    })(Backbone.View);
  })();

}).call(this);
