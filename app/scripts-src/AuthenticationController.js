(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    return com.roost.AuthenticationController = (function() {
      function AuthenticationController(options) {
        this.handleAuth = __bind(this.handleAuth, this);
        this.removeAuthentication = __bind(this.removeAuthentication, this);
        this.requestAuth = __bind(this.requestAuth, this);
        this.doAuthentication = __bind(this.doAuthentication, this);
        this.isAuthenticated = __bind(this.isAuthenticated, this);
        $.extend(this, Backbone.Events);
        this.session = options.session;
        this.userInfo = options.userInfo;
        this.ticketManager = options.ticketManager;
        this.listenTo(this.userInfo, 'login', this.requestAuth);
        this.listenTo(this.userInfo, 'logout', this.removeAuthentication);
        this.doAuthentication();
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
            realm: ticket.client.realm
          });
        }
      };

      AuthenticationController.prototype.requestAuth = function() {
        return this.ticketManager.refreshTickets({
          interactive: true
        }, {}, this.handleAuth);
      };

      AuthenticationController.prototype.removeAuthentication = function() {
        this.ticketManager.expireTickets();
        this.userInfo.set({
          username: null,
          realm: null
        });
        return this.session.removeAllPanes();
      };

      AuthenticationController.prototype.handleAuth = function(sessions) {
        var ticket;
        ticket = sessions.server;
        this.userInfo.set({
          username: ticket.client.principalName.nameString[0],
          realm: ticket.client.realm
        });
        return this.session.addPane({});
      };

      return AuthenticationController;

    })();
  })();

}).call(this);
