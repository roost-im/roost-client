(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    return com.roost.AuthenticationController = (function() {
      function AuthenticationController(options) {
        this.handleAuth = __bind(this.handleAuth, this);
        this.removeAuthentication = __bind(this.removeAuthentication, this);
        this.doAuthentication = __bind(this.doAuthentication, this);
        this.isAuthenticated = __bind(this.isAuthenticated, this);
        $.extend(this, Backbone.Events);
        this.userInfo = options.userInfo;
        this.ticketManager = options.ticketManager;
        this.listenTo(this.userInfo, 'login', this.doAuthentication);
        this.listenTo(this.userInfo, 'logout', this.removeAuthentication);
      }

      AuthenticationController.prototype.isAuthenticated = function() {
        return this.ticketManager.getCachedTicket("zephyr") != null;
      };

      AuthenticationController.prototype.doAuthentication = function() {
        var ticket;
        if (this.isAuthenticated()) {
          ticket = this.ticketManager.getCachedTicket("server");
          return this.userInfo.set({
            username: ticket.client.principalName.nameString[0],
            realm: ticket.client.principalName.realm
          });
        } else {
          return this.ticketManager.refreshTickets({
            interactive: true
          }, {}, this.handleAuth);
        }
      };

      AuthenticationController.prototype.removeAuthentication = function() {
        this.ticketManager.expireTickets();
        return this.userInfo.set({
          username: null,
          realm: null
        });
      };

      AuthenticationController.prototype.handleAuth = function(sessions) {
        var ticket;
        ticket = sessions.server;
        return this.userInfo.set({
          username: ticket.client.principalName.nameString[0],
          realm: ticket.client.principalName.realm
        });
      };

      return AuthenticationController;

    })();
  })();

}).call(this);
