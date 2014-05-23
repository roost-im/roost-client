(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    var MAX_PANES_ON_SCREEN;
    MAX_PANES_ON_SCREEN = 3;
    return com.roost.MessagePane = (function(_super) {
      __extends(MessagePane, _super);

      function MessagePane() {
        this._recalculateWidth = __bind(this._recalculateWidth, this);
        this._removePaneView = __bind(this._removePaneView, this);
        this._addPaneView = __bind(this._addPaneView, this);
        this._clearPaneFilters = __bind(this._clearPaneFilters, this);
        this._sendPaneToTop = __bind(this._sendPaneToTop, this);
        this._sendPaneToBottom = __bind(this._sendPaneToBottom, this);
        this._setSelection = __bind(this._setSelection, this);
        this._moveSelection = __bind(this._moveSelection, this);
        this._setSelectionOnClick = __bind(this._setSelectionOnClick, this);
        this._togglePanes = __bind(this._togglePanes, this);
        this._toggleKeyboard = __bind(this._toggleKeyboard, this);
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
        this.listenTo(this.settingsModel, 'change:keyboard', this._toggleKeyboard);
        this.listenTo(this.settingsModel, 'change:panes', this._togglePanes);
        Mousetrap.bind('left', ((function(_this) {
          return function() {
            return _this._moveSelection(1);
          };
        })(this)));
        Mousetrap.bind('right', ((function(_this) {
          return function() {
            return _this._moveSelection(-1);
          };
        })(this)));
        Mousetrap.bind('>', this._sendPaneToBottom);
        Mousetrap.bind('<', this._sendPaneToTop);
        return Mousetrap.bind('shift+v', this._clearPaneFilters);
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
          return this._setSelection();
        }
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

      MessagePane.prototype._setSelectionOnClick = function(evt) {
        this.selectedPosition = this.$('.message-pane-view').index(evt.currentTarget);
        return this._setSelection();
      };

      MessagePane.prototype._moveSelection = function(diff) {
        this.selectedPosition = this.selectedPosition - diff;
        this.selectedPosition = Math.min(this.selectedPosition, this.childViews.length - 1);
        this.selectedPosition = Math.max(this.selectedPosition, 0);
        return this._setSelection();
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

      MessagePane.prototype._sendPaneToBottom = function() {
        this.childViews[this.selectedPosition].model.set('position', null);
        return this.childViews[this.selectedPosition].model.trigger('reload');
      };

      MessagePane.prototype._sendPaneToTop = function() {
        this.childViews[this.selectedPosition].model.set('position', null);
        return this.childViews[this.selectedPosition].model.trigger('toTop');
      };

      MessagePane.prototype._clearPaneFilters = function() {
        return this.childViews[this.selectedPosition].model.set('filters', {});
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
          return this.$el.append($('<div class="no-panes">').text('Click "New Pane" above to start browsing your messages.'));
        }
      };

      MessagePane.prototype._recalculateWidth = function() {
        var index, view, width, _i, _len, _ref, _results;
        width = Math.max(Math.floor(100 / this.childViews.length), Math.floor(100 / MAX_PANES_ON_SCREEN));
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

      return MessagePane;

    })(Backbone.View);
  })();

}).call(this);
