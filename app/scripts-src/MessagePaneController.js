(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    return com.roost.MessagePaneController = (function() {
      function MessagePaneController(options) {
        this.onFilterChange = __bind(this.onFilterChange, this);
        this.onNewMessages = __bind(this.onNewMessages, this);
        this.onScrollDown = __bind(this.onScrollDown, this);
        this.onScrollUp = __bind(this.onScrollUp, this);
        this.onPositionJump = __bind(this.onPositionJump, this);
        this.fetchFromBottom = __bind(this.fetchFromBottom, this);
        $.extend(this, Backbone.Events);
        this.model = options.model;
      }

      MessagePaneController.prototype.fetchFromBottom = function() {};

      MessagePaneController.prototype.onPositionJump = function() {};

      MessagePaneController.prototype.onScrollUp = function() {};

      MessagePaneController.prototype.onScrollDown = function() {};

      MessagePaneController.prototype.onNewMessages = function() {};

      MessagePaneController.prototype.onFilterChange = function() {};

      return MessagePaneController;

    })();
  })();

}).call(this);
