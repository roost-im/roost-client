(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    var MIN_MESSAGE_WIDTH;
    MIN_MESSAGE_WIDTH = 580;
    return com.roost.MessagePane = (function(_super) {
      __extends(MessagePane, _super);

      function MessagePane() {
        this._hideHelp = __bind(this._hideHelp, this);
        this._showHelp = __bind(this._showHelp, this);
        this._recalculateWidth = __bind(this._recalculateWidth, this);
        this._removePaneView = __bind(this._removePaneView, this);
        this._addPaneView = __bind(this._addPaneView, this);
        this._selectedMessagePM = __bind(this._selectedMessagePM, this);
        this._selectedMessageQuote = __bind(this._selectedMessageQuote, this);
        this._selectedMessageReply = __bind(this._selectedMessageReply, this);
        this._closeSelectedPane = __bind(this._closeSelectedPane, this);
        this._showPaneFilters = __bind(this._showPaneFilters, this);
        this._showPaneCompose = __bind(this._showPaneCompose, this);
        this._clearPaneFilters = __bind(this._clearPaneFilters, this);
        this._moveMessageSelection = __bind(this._moveMessageSelection, this);
        this._sendPaneToTop = __bind(this._sendPaneToTop, this);
        this._sendPaneToBottom = __bind(this._sendPaneToBottom, this);
        this._toggleSubSetting = __bind(this._toggleSubSetting, this);
        this._toggleNavbarSetting = __bind(this._toggleNavbarSetting, this);
        this._handleSwipeRight = __bind(this._handleSwipeRight, this);
        this._handleSwipeLeft = __bind(this._handleSwipeLeft, this);
        this._shiftSelection = __bind(this._shiftSelection, this);
        this._setSelection = __bind(this._setSelection, this);
        this._moveSelection = __bind(this._moveSelection, this);
        this._setSelectionOnClick = __bind(this._setSelectionOnClick, this);
        this._toggleVisibility = __bind(this._toggleVisibility, this);
        this._toggleSwiping = __bind(this._toggleSwiping, this);
        this._toggleNavbar = __bind(this._toggleNavbar, this);
        this._togglePanes = __bind(this._togglePanes, this);
        this._toggleKeyboard = __bind(this._toggleKeyboard, this);
        this._checkSettings = __bind(this._checkSettings, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessagePane.__super__.constructor.apply(this, arguments);
      }

      MessagePane.prototype.className = 'message-pane';

      MessagePane.prototype.events = {
        'click .message-pane-view': '_setSelectionOnClick'
      };

      MessagePane.prototype.initialize = function(options) {
        this.session = options.session;
        this.messageLists = options.messageLists;
        this.settingsModel = this.session.settingsModel;
        this.listenTo(this.messageLists, 'add', this._addPaneView);
        this.listenTo(this.messageLists, 'remove', this._removePaneView);
        this.listenTo(this.session.userInfo, 'change', this._toggleVisibility);
        this.listenTo(this.settingsModel, 'change:keyboard', this._toggleKeyboard);
        this.listenTo(this.settingsModel, 'change:panes', this._togglePanes);
        this.listenTo(this.settingsModel, 'change:showNavbar', this._toggleNavbar);
        this.listenTo(this.settingsModel, 'change:onMobile', this._toggleSwiping);
        Mousetrap.bind('left', ((function(_this) {
          return function(e) {
            return _this._moveSelection(1, e);
          };
        })(this)));
        Mousetrap.bind('shift+left', ((function(_this) {
          return function(e) {
            return _this._shiftSelection(-1, e);
          };
        })(this)));
        Mousetrap.bind('right', ((function(_this) {
          return function(e) {
            return _this._moveSelection(-1, e);
          };
        })(this)));
        Mousetrap.bind('shift+right', ((function(_this) {
          return function(e) {
            return _this._shiftSelection(1, e);
          };
        })(this)));
        Mousetrap.bind('up', ((function(_this) {
          return function(e) {
            return _this._moveMessageSelection(-1, e);
          };
        })(this)));
        Mousetrap.bind('down', ((function(_this) {
          return function(e) {
            return _this._moveMessageSelection(1, e);
          };
        })(this)));
        Mousetrap.bind('>', this._sendPaneToBottom);
        Mousetrap.bind('<', this._sendPaneToTop);
        Mousetrap.bind('shift+v', this._clearPaneFilters);
        Mousetrap.bind('z', this._showPaneCompose);
        Mousetrap.bind('shift+f', this._showPaneFilters);
        Mousetrap.bind('r', this._selectedMessageReply);
        Mousetrap.bind('q', this._selectedMessageQuote);
        Mousetrap.bind('p', this._selectedMessagePM);
        Mousetrap.bind('alt+x', this._closeSelectedPane);
        Mousetrap.bind('?', this._showHelp);
        Mousetrap.bind('esc', this._hideHelp);
        Mousetrap.bind('alt+h', this._toggleNavbarSetting);
        Mousetrap.bind('alt+s', this._toggleSubSetting);
        this.$el.swipe({
          swipeLeft: (function(_this) {
            return function() {
              return _this._moveSelection(-1);
            };
          })(this),
          swipeRight: (function(_this) {
            return function() {
              return _this._moveSelection(1);
            };
          })(this)
        });
        return $(window).resize(this._recalculateWidth);
      };

      MessagePane.prototype.render = function() {
        var paneModel, _i, _len, _ref;
        this.$el.empty();
        this.childViews = [];
        this.selectedPosition = 0;
        _ref = this.messageLists.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          paneModel = _ref[_i];
          this._addPaneView(paneModel);
        }
        if (this.childViews.length > 0) {
          this._setSelection();
        }
        this.subView = new com.roost.SubscriptionPanel({
          settings: this.settingsModel,
          subscriptions: this.session.subscriptions,
          session: this.session
        });
        this.subView.render();
        this.$el.append(this.subView.$el);
        return this._checkSettings();
      };

      MessagePane.prototype._checkSettings = function() {
        this._toggleKeyboard();
        this._togglePanes();
        this._toggleNavbar();
        return this._toggleSwiping();
      };

      MessagePane.prototype._toggleKeyboard = function() {
        var view, _i, _len, _ref, _results;
        if (this.settingsModel.get('keyboard')) {
          Mousetrap.unpause();
          return this._setSelection();
        } else {
          Mousetrap.pause();
          _ref = this.childViews;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            view = _ref[_i];
            _results.push(view.model.set('selected', true));
          }
          return _results;
        }
      };

      MessagePane.prototype._togglePanes = function() {
        var i, _i, _ref, _results;
        if (!this.settingsModel.get('panes') && this.childViews.length > 1) {
          _results = [];
          for (i = _i = _ref = this.childViews.length - 1; _ref <= 1 ? _i <= 1 : _i >= 1; i = _ref <= 1 ? ++_i : --_i) {
            _results.push(this.session.removePane(this.childViews[i].model.cid));
          }
          return _results;
        }
      };

      MessagePane.prototype._toggleNavbar = function() {
        if (!this.settingsModel.get('showNavbar')) {
          return this.$el.addClass('expanded');
        } else {
          return this.$el.removeClass('expanded');
        }
      };

      MessagePane.prototype._toggleSwiping = function() {
        if (this.settingsModel.get('onMobile')) {
          this.$el.swipe('enable');
          return this.undelegateEvents();
        } else {
          this.$el.swipe('disable');
          return this.delegateEvents();
        }
      };

      MessagePane.prototype._toggleVisibility = function() {
        if (this.session.userInfo.get('username') != null) {
          return this.$el.show();
        } else {
          return this.$el.hide();
        }
      };

      MessagePane.prototype._setSelectionOnClick = function(evt) {
        this.selectedPosition = this.$('.message-pane-view').index(evt.currentTarget);
        return this._setSelection();
      };

      MessagePane.prototype._moveSelection = function(diff, e) {
        this.selectedPosition = this.selectedPosition - diff;
        this.selectedPosition = Math.min(this.selectedPosition, this.childViews.length - 1);
        this.selectedPosition = Math.max(this.selectedPosition, 0);
        this._setSelection();
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._setSelection = function() {
        var offset, selectedView, view, width, _i, _len, _ref;
        selectedView = this.childViews[this.selectedPosition];
        if (selectedView != null) {
          _ref = this.childViews;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            view = _ref[_i];
            if (view.cid !== selectedView.cid) {
              view.model.set('selected', false);
            }
          }
          selectedView.model.set('selected', true);
          offset = selectedView.$el.offset().left;
          width = selectedView.$el.width();
          if (offset < 0) {
            return this.$el.scrollLeft(this.$el.scrollLeft() + offset);
          } else if ((offset + width) > this.$el.width()) {
            return this.$el.scrollLeft(this.$el.scrollLeft() + (offset + width - this.$el.width()));
          }
        }
      };

      MessagePane.prototype._shiftSelection = function(diff, e) {
        var currentSelected, jumpTarget, oldScroll;
        if ((this.selectedPosition + diff) <= this.childViews.length - 1 && (this.selectedPosition + diff) >= 0) {
          currentSelected = this.childViews[this.selectedPosition];
          jumpTarget = this.childViews[this.selectedPosition + diff];
          oldScroll = currentSelected.$el.scrollTop();
          if (diff < 0) {
            jumpTarget.$el.before(currentSelected.$el);
          } else {
            jumpTarget.$el.after(currentSelected.$el);
          }
          this.childViews[this.selectedPosition] = jumpTarget;
          this.childViews[this.selectedPosition + diff] = currentSelected;
          this.selectedPosition = this.selectedPosition + diff;
          this._setSelection();
          currentSelected.$el.scrollTop(oldScroll);
          this._recalculateWidth();
        }
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._handleSwipeLeft = function(e) {
        return this._moveSelection(-1, e);
      };

      MessagePane.prototype._handleSwipeRight = function(e) {
        return this._moveSelection(1, e);
      };

      MessagePane.prototype._toggleNavbarSetting = function(e) {
        this.settingsModel.set('showNavbar', !this.settingsModel.get('showNavbar'));
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._toggleSubSetting = function(e) {
        this.settingsModel.set('showSubs', !this.settingsModel.get('showSubs'));
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._sendPaneToBottom = function() {
        this.childViews[this.selectedPosition].model.set('position', null);
        return this.childViews[this.selectedPosition].model.trigger('reload');
      };

      MessagePane.prototype._sendPaneToTop = function() {
        this.childViews[this.selectedPosition].model.set('position', null);
        return this.childViews[this.selectedPosition].model.trigger('toTop');
      };

      MessagePane.prototype._moveMessageSelection = function(diff, e) {
        this.childViews[this.selectedPosition].moveSelectedMessage(diff);
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._clearPaneFilters = function() {
        return this.childViews[this.selectedPosition].model.set('filters', {});
      };

      MessagePane.prototype._showPaneCompose = function(e) {
        this.childViews[this.selectedPosition].model.set('showCompose', true);
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._showPaneFilters = function(e) {
        this.childViews[this.selectedPosition].model.set('showFilters', true);
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._closeSelectedPane = function() {
        return this.session.removePane(this.childViews[this.selectedPosition].model.cid);
      };

      MessagePane.prototype._selectedMessageReply = function(e) {
        this.childViews[this.selectedPosition].selectedMessageReply();
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._selectedMessageQuote = function(e) {
        this.childViews[this.selectedPosition].selectedMessageQuote();
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._selectedMessagePM = function(e) {
        this.childViews[this.selectedPosition].selectedMessagePM();
        if (e != null) {
          e.preventDefault();
        }
        return e != null ? e.stopPropagation() : void 0;
      };

      MessagePane.prototype._addPaneView = function(paneModel) {
        var paneView;
        this.$('.no-panes').remove();
        paneView = new com.roost.MessagePaneView({
          session: this.session,
          model: paneModel
        });
        this.childViews.push(paneView);
        paneView.render();
        this.$el.append(paneView.$el);
        this._recalculateWidth();
        return this._moveSelection(-1 * this.childViews.length);
      };

      MessagePane.prototype._removePaneView = function(model) {
        var toDelete, view, _i, _len, _ref;
        _ref = this.childViews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (view.model.cid === model.cid) {
            toDelete = view;
          }
        }
        toDelete.remove();
        this.childViews = _.reject(this.childViews, ((function(_this) {
          return function(view) {
            return view.cid === toDelete.cid;
          };
        })(this)));
        this._recalculateWidth();
        model.off();
        if (model.get('selected')) {
          this._moveSelection(1);
        }
        if (this.messageLists.length === 0) {
          this.$el.append($('<div class="no-panes">').text('Click "+ New Pane" above to start browsing your messages.'));
          return this.session.settingsModel.set('showNavbar', true);
        }
      };

      MessagePane.prototype._recalculateWidth = function() {
        var index, percentageLimit, view, width, _i, _len, _ref, _results;
        if (this.$el.width() < MIN_MESSAGE_WIDTH) {
          percentageLimit = 100;
        } else {
          percentageLimit = 100 * MIN_MESSAGE_WIDTH / this.$el.width();
        }
        width = Math.max(Math.floor(100 / this.childViews.length), Math.floor(percentageLimit));
        index = 0;
        _ref = this.childViews;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          view.recalculateWidth(index, width);
          _results.push(index += 1);
        }
        return _results;
      };

      MessagePane.prototype._showHelp = function() {
        if ($('.modal-overlay').length === 0) {
          $('body').append(com.roost.templates['HotkeyHelp']({}));
          return $('.close-help').click(this._hideHelp);
        }
      };

      MessagePane.prototype._hideHelp = function() {
        $('.modal-overlay').remove();
        return $('.modal').remove();
      };

      return MessagePane;

    })(Backbone.View);
  })();

}).call(this);
