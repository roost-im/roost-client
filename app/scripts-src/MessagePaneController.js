(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    com.roost.STARTING_SIZE = 40;
    com.roost.EXPANSION_SIZE = 10;
    return com.roost.MessagePaneController = (function() {
      function MessagePaneController(options) {
        this.addMessageToStartOfModel = __bind(this.addMessageToStartOfModel, this);
        this.addMessagesToEndOfModel = __bind(this.addMessagesToEndOfModel, this);
        this.onFilterChange = __bind(this.onFilterChange, this);
        this.onNewMessages = __bind(this.onNewMessages, this);
        this.onScrollDown = __bind(this.onScrollDown, this);
        this.onScrollUp = __bind(this.onScrollUp, this);
        this.onPositionJump = __bind(this.onPositionJump, this);
        this.fetchFromBottom = __bind(this.fetchFromBottom, this);
        $.extend(this, Backbone.Events);
        this.model = options.model;
        this.api = options.api;
        this.messageModel = new MessageModel(this.api);
        this.listenTo(this.model, 'scrollUp', this.onScrollUp);
      }

      MessagePaneController.prototype.fetchFromBottom = function() {
        this.reverseTail = this.messageModel.newReverseTail(null, this.model.get('filters'), this.addMessagesToEndOfModel);
        return this.reverseTail.expandTo(com.roost.STARTING_SIZE);
      };

      MessagePaneController.prototype.onPositionJump = function() {};

      MessagePaneController.prototype.onScrollUp = function() {
        var newSize;
        newSize = this.model.get('messages').models.length + com.roost.EXPANSION_SIZE;
        return this.reverseTail.expandTo(newSize);
      };

      MessagePaneController.prototype.onScrollDown = function() {};

      MessagePaneController.prototype.onNewMessages = function() {};

      MessagePaneController.prototype.onFilterChange = function() {};

      MessagePaneController.prototype.addMessagesToEndOfModel = function(msgs, isDone) {
        var message, messages, _i, _len, _ref, _results;
        this.model.set('isDone', isDone);
        messages = this.model.get('messages');
        if (messages.models.length === 0) {
          return messages.reset(msgs);
        } else {
          _ref = msgs.slice(0).reverse();
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            message = _ref[_i];
            _results.push(messages.add(message, {
              at: 0
            }));
          }
          return _results;
        }
      };

      MessagePaneController.prototype.addMessageToStartOfModel = function(msgs, isDone) {};

      return MessagePaneController;

    })();
  })();

}).call(this);
