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
        this._jumpToTop = __bind(this._jumpToTop, this);
        this._onScrollDown = __bind(this._onScrollDown, this);
        this._onScrollUp = __bind(this._onScrollUp, this);
        this._properStartCb = __bind(this._properStartCb, this);
        this.fetchFromPosition = __bind(this.fetchFromPosition, this);
        $.extend(this, Backbone.Events);
        this.model = options.model;
        this.api = options.api;
        this.messageModel = new MessageModel(this.api);
        this.listenTo(this.model, 'scrollUp', this._onScrollUp);
        this.listenTo(this.model, 'scrollDown', this._onScrollDown);
        this.listenTo(this.model, 'reload change:filters', this.fetchFromPosition);
        this.listenTo(this.model, 'toTop', this._jumpToTop);
        this.lastReverseStep = 0;
        this.lastForwardStep = 0;
      }

      MessagePaneController.prototype.fetchFromPosition = function() {
        var _ref;
        this.model.set({
          topLoading: true,
          loaded: false
        });
        if ((_ref = this.reverseTail) != null) {
          _ref.close();
        }
        this.lastReverseStep = 0;
        if (this.model.get('position') !== null) {
          this.tempForwardTail = this.messageModel.newTailInclusive(this.model.get('position'), this.model.get('filters'), this._properStartCb);
          return this.tempForwardTail.expandTo(2);
        } else {
          this.reverseTail = this.messageModel.newReverseTail(this.model.get('position'), this.model.get('filters'), this.addMessagesToTopOfList);
          this.reverseTail.expandTo(com.roost.STARTING_SIZE);
          return this.lastReverseStep = com.roost.STARTING_SIZE;
        }
      };

      MessagePaneController.prototype._properStartCb = function(msgs, isDone) {
        var start;
        if (msgs.length === 1) {
          start = null;
        } else {
          start = msgs[1].id;
        }
        this.reverseTail = this.messageModel.newReverseTail(start, this.model.get('filters'), this.addMessagesToTopOfList);
        this.reverseTail.expandTo(com.roost.STARTING_SIZE);
        this.lastReverseStep = com.roost.STARTING_SIZE;
        return this.tempForwardTail.close();
      };

      MessagePaneController.prototype._onScrollUp = function() {
        this.model.set('topLoading', true);
        this.lastReverseStep += com.roost.EXPANSION_SIZE;
        return this.reverseTail.expandTo(this.lastReverseStep);
      };

      MessagePaneController.prototype._onScrollDown = function() {
        this.model.set('bottomLoading', true);
        this.lastForwardStep += com.roost.EXPANSION_SIZE;
        return this.forwardTail.expandTo(this.lastForwardStep);
      };

      MessagePaneController.prototype._jumpToTop = function() {
        var _ref, _ref1;
        this.model.set({
          topLoading: false,
          loaded: false,
          bottomLoading: true,
          isTopDone: true
        });
        if ((_ref = this.reverseTail) != null) {
          _ref.close();
        }
        this.lastReverseStep = 0;
        if ((_ref1 = this.forwardTail) != null) {
          _ref1.close();
        }
        this.forwardTail = this.messageModel.newTail(null, this.model.get('filters'), this.addMessagesToBottomOfList);
        this.forwardTail.expandTo(com.roost.STARTING_SIZE);
        return this.lastForwardStep = com.roost.STARTING_SIZE;
      };

      MessagePaneController.prototype.addMessagesToTopOfList = function(msgs, isDone) {
        var message, messages, _i, _j, _len, _len1, _ref, _ref1, _ref2, _results;
        this.model.set({
          isTopDone: isDone,
          topLoading: false
        });
        messages = this.model.get('messages');
        for (_i = 0, _len = msgs.length; _i < _len; _i++) {
          message = msgs[_i];
          this._processMesssage(message);
        }
        if (!this.model.get('loaded')) {
          this.model.set('loaded', true);
          messages.reset(msgs);
          this.lastForwardStep = 0;
          if (msgs.length === 0) {
            this.model.set('isBottomDone', true);
            if ((_ref = this.forwardTail) != null) {
              _ref.close();
            }
            this.forwardTail = this.messageModel.newTail(null, this.model.get('filters'), this.addMessagesToBottomOfList);
          } else {
            if ((_ref1 = this.forwardTail) != null) {
              _ref1.close();
            }
            this.forwardTail = this.messageModel.newTail(msgs[msgs.length - 1].id, this.model.get('filters'), this.addMessagesToBottomOfList);
          }
          this.lastForwardStep += 1;
          return this.forwardTail.expandTo(this.lastForwardStep);
        } else {
          if (messages.length >= com.roost.CACHE_SIZE) {
            this._clearBottomOfCache(msgs.length);
          }
          _ref2 = msgs.slice(0).reverse();
          _results = [];
          for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
            message = _ref2[_j];
            _results.push(messages.add(message, {
              at: 0
            }));
          }
          return _results;
        }
      };

      MessagePaneController.prototype.addMessagesToBottomOfList = function(msgs, isDone) {
        var live, message, messages, _i, _j, _len, _len1, _ref, _results;
        if (this.model.get('isBottomDone') && isDone) {
          this.lastForwardStep += 1;
          this.forwardTail.expandTo(this.lastForwardStep);
          live = true;
        }
        this.model.set({
          isBottomDone: isDone,
          bottomLoading: false
        });
        messages = this.model.get('messages');
        for (_i = 0, _len = msgs.length; _i < _len; _i++) {
          message = msgs[_i];
          this._processMesssage(message);
        }
        if (messages.length >= com.roost.CACHE_SIZE) {
          if (live) {
            return;
          } else {
            this._clearTopOfCache(msgs.length);
          }
        }
        if (!this.model.get('loaded')) {
          this.model.set('loaded', true);
          messages.reset([]);
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
        var i, messages, oldMsg, _i, _ref, _ref1;
        messages = this.model.get('messages');
        for (i = _i = 0, _ref = length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          oldMsg = messages.shift();
          oldMsg.off();
        }
        if ((_ref1 = this.reverseTail) != null) {
          _ref1.close();
        }
        this.reverseTail = this.messageModel.newReverseTail(messages.at(0).id, this.model.get('filters'), this.addMessagesToTopOfList);
        this.model.set('isTopDone', false);
        return this.lastReverseStep = 0;
      };

      MessagePaneController.prototype._clearBottomOfCache = function(length) {
        var i, messages, oldMsg, _i, _ref, _ref1;
        messages = this.model.get('messages');
        for (i = _i = 0, _ref = length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
          oldMsg = messages.pop();
          oldMsg.off();
        }
        if ((_ref1 = this.forwardTail) != null) {
          _ref1.close();
        }
        this.forwardTail = this.messageModel.newTail(messages.at(messages.length - 1).id, this.model.get('filters'), this.addMessagesToBottomOfList);
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
