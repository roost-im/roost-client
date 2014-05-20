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
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessagePane.__super__.constructor.apply(this, arguments);
      }

      MessagePane.prototype.className = 'message-pane';

      MessagePane.prototype.initialize = function(options) {
        this.session = options.session;
        this.messageLists = options.messageLists;
        this.childViews = [];
        this.listenTo(this.messageLists, 'add', this._addPaneView);
        return this.listenTo(this.messageLists, 'remove', this._removePaneView);
      };

      MessagePane.prototype.render = function() {
        var paneModel, _i, _len, _ref, _results;
        this.$el.empty();
        _ref = this.messageLists.models;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          paneModel = _ref[_i];
          _results.push(this._addPaneView(paneModel));
        }
        return _results;
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
        paneView.$el.scrollTop(paneView.$el[0].scrollHeight);
        return this.listenTo(paneModel, 'messagesSet', ((function(_this) {
          return function() {
            return paneView.$el.scrollTop(paneView.$el[0].scrollHeight);
          };
        })(this)));
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
        model.off();
        this._recalculateWidth();
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
