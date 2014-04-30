(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    var STARTING_SIZE;
    STARTING_SIZE = 50;
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
      }

      MessagePaneController.prototype.fetchFromBottom = function() {
        this.reverseTail = this.messageModel.newReverseTail(null, this.model.get('filters'), this.addMessagesToEndOfModel);
        this.reverseTail.expandTo(STARTING_SIZE);
      };

      MessagePaneController.prototype.onPositionJump = function() {};

      MessagePaneController.prototype.onScrollUp = function() {};

      MessagePaneController.prototype.onScrollDown = function() {};

      MessagePaneController.prototype.onNewMessages = function() {};

      MessagePaneController.prototype.onFilterChange = function() {};

      MessagePaneController.prototype.addMessagesToEndOfModel = function(msgs, isDone) {
        var messages;
        this.model.set('isDone', isDone);
        messages = this.model.get('messages');
        return messages.reset(msgs);
      };

      MessagePaneController.prototype.addMessageToStartOfModel = function(msgs, isDone) {};

      return MessagePaneController;

    })();
  })();

}).call(this);
