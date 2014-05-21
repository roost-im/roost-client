(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    com.roost.STARTING_SIZE = 40;
    com.roost.EXPANSION_SIZE = 10;
    com.roost.CACHE_SIZE = 200;
    return com.roost.MessagePaneController = (function() {
      function MessagePaneController(options) {
        this._processMesssage = __bind(this._processMesssage, this);
        this._clearBottomOfCache = __bind(this._clearBottomOfCache, this);
        this._clearTopOfCache = __bind(this._clearTopOfCache, this);
        this.addMessagesToBottomOfList = __bind(this.addMessagesToBottomOfList, this);
        this.addMessagesToTopOfList = __bind(this.addMessagesToTopOfList, this);
        this.onFilterChange = __bind(this.onFilterChange, this);
        this.onPositionJump = __bind(this.onPositionJump, this);
        this._onScrollDown = __bind(this._onScrollDown, this);
        this._onScrollUp = __bind(this._onScrollUp, this);
        this.fetchFromBottom = __bind(this.fetchFromBottom, this);
        $.extend(this, Backbone.Events);
        this.model = options.model;
        this.api = options.api;
        this.messageModel = new MessageModel(this.api);
        this.listenTo(this.model, 'scrollUp', this._onScrollUp);
        this.listenTo(this.model, 'scrollDown', this._onScrollDown);
        this.listenTo(this.model, 'toBottom', this.fetchFromBottom);
        this.lastReverseStep = 0;
        this.lastForwardStep = 0;
      }

      MessagePaneController.prototype.fetchFromBottom = function() {
        this.reverseTail = this.messageModel.newReverseTail(null, this.model.get('filters'), this.addMessagesToTopOfList);
        this.reverseTail.expandTo(com.roost.STARTING_SIZE);
        return this.lastReverseStep = com.roost.STARTING_SIZE;
      };

      MessagePaneController.prototype._onScrollUp = function() {
        this.lastReverseStep += com.roost.EXPANSION_SIZE;
        return this.reverseTail.expandTo(this.lastReverseStep);
      };

      MessagePaneController.prototype._onScrollDown = function() {
        this.lastForwardStep += com.roost.EXPANSION_SIZE;
        return this.forwardTail.expandTo(this.lastForwardStep);
      };

      MessagePaneController.prototype.onPositionJump = function() {};

      MessagePaneController.prototype.onFilterChange = function() {};

      MessagePaneController.prototype.addMessagesToTopOfList = function(msgs, isDone) {
        var message, messages, _i, _j, _len, _len1, _ref, _results;
        this.model.set('isTopDone', isDone);
        messages = this.model.get('messages');
        for (_i = 0, _len = msgs.length; _i < _len; _i++) {
          message = msgs[_i];
          this._processMesssage(message);
        }
        if (!this.model.get('loaded')) {
          this.model.set('loaded', true);
          messages.reset(msgs);
          if (msgs.length === 0) {
            this.model.set('isBottomDone', true);
            this.forwardTail = this.messageModel.newTailInclusive(null, this.model.get('filters'), this.addMessagesToBottomOfList);
          } else {
            this.forwardTail = this.messageModel.newTailInclusive(msgs[msgs.length - 1].id, this.model.get('filters'), this.addMessagesToBottomOfList);
          }
          return this._onScrollDown();
        } else {
          if (messages.length >= com.roost.CACHE_SIZE) {
            this._clearBottomOfCache(msgs.length);
          }
          _ref = msgs.slice(0).reverse();
          _results = [];
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            message = _ref[_j];
            _results.push(messages.add(message, {
              at: 0
            }));
          }
          return _results;
        }
      };

      MessagePaneController.prototype.addMessagesToBottomOfList = function(msgs, isDone) {
        var message, messages, _i, _j, _len, _len1, _ref, _results;
        this.model.set('isBottomDone', isDone);
        messages = this.model.get('messages');
        for (_i = 0, _len = msgs.length; _i < _len; _i++) {
          message = msgs[_i];
          this._processMesssage(message);
        }
        if (messages.length >= com.roost.CACHE_SIZE) {
          this._clearTopOfCache(msgs.length);
        }
        _ref = msgs.slice(0);
        _results = [];
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          message = _ref[_j];
          _results.push(messages.add(message, {
            at: messages.length
          }));
        }
        return _results;
      };

      MessagePaneController.prototype._clearTopOfCache = function(length) {
        var i, messages, oldMsg, _i, _ref;
        messages = this.model.get('messages');
        for (i = _i = 0, _ref = length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          oldMsg = messages.shift();
          oldMsg.off();
        }
        this.reverseTail = this.messageModel.newReverseTail(messages.at(0).id, this.model.get('filters'), this.addMessagesToTopOfList);
        this.model.set('isTopDone', false);
        return this.lastReverseStep = 0;
      };

      MessagePaneController.prototype._clearBottomOfCache = function(length) {
        var i, messages, oldMsg, _i, _ref;
        messages = this.model.get('messages');
        for (i = _i = 0, _ref = length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          oldMsg = messages.pop();
          oldMsg.off();
        }
        this.forwardTail = this.messageModel.newTailInclusive(messages.at(messages.length - 1).id, this.model.get('filters'), this.addMessagesToBottomOfList);
        this.model.set('isBottomDone', false);
        return this.lastForwardStep = 0;
      };

      MessagePaneController.prototype._processMesssage = function(message) {
        message.time = moment(message.time);
        return message.message = message.message.trim();
      };

      return MessagePaneController;

    })();
  })();

}).call(this);
