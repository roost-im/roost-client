(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.MessagePane = (function(_super) {
      __extends(MessagePane, _super);

      function MessagePane() {
        this.addPaneView = __bind(this.addPaneView, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessagePane.__super__.constructor.apply(this, arguments);
      }

      MessagePane.prototype.className = 'message-pane';

      MessagePane.prototype.initialize = function(options) {
        this.messageLists = options.messageLists;
        this.childViews = [];
        return this.listenTo(this.messageLists, 'add', this.addPaneView);
      };

      MessagePane.prototype.render = function() {
        var paneModel, _i, _len, _ref, _results;
        this.$el.empty();
        _ref = this.messageLists.models;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          paneModel = _ref[_i];
          _results.push(this.addPaneView(paneModel));
        }
        return _results;
      };

      MessagePane.prototype.addPaneView = function(paneModel) {
        var paneView;
        paneView = new com.roost.MessagePaneView({
          model: paneModel
        });
        this.childViews.push(paneView);
        paneView.render();
        return this.$el.append(paneView.$el);
      };

      return MessagePane;

    })(Backbone.View);
  })();

}).call(this);
