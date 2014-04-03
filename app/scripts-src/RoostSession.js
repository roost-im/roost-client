(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    return com.roost.RoostSession = (function() {
      function RoostSession() {
        this.handleAuth = __bind(this.handleAuth, this);
        this.doAuthentication = __bind(this.doAuthentication, this);
        this.isAuthenticated = __bind(this.isAuthenticated, this);
        this.addPane = __bind(this.addPane, this);
        var ticket;
        this.userInfo = new Backbone.Model({
          username: null,
          realm: null
        });
        this.messageLists = new Backbone.Collection();
        this.localStorage = new LocalStorageWrapper();
        this.storageManager = new StorageManager(this.localStorage);
        this.ticketManager = new TicketManager(CONFIG.webathena, this.storageManager);
        this.api = new API(CONFIG.server, CONFIG.serverPrincipal, this.storageManager, this.ticketManager);
        if (this.isAuthenticated()) {
          ticket = this.ticketManager.getCachedTicket("server");
          this.userInfo.set({
            username: ticket.client.principalName.nameString[0],
            realm: ticket.client.principalName.realm
          });
        }
      }

      RoostSession.prototype.addPane = function(filters, position) {
        var paneController, paneModel;
        paneModel = new com.roost.MessagePaneModel({
          filters: filters,
          position: position
        });
        paneController = new com.roost.MessagePaneController({
          model: paneModel
        });
        paneController.fetchFromBottom();
        return this.messageLists.push(paneModel);
      };

      RoostSession.prototype.isAuthenticated = function() {
        return this.ticketManager.getCachedTicket("zephyr") != null;
      };

      RoostSession.prototype.doAuthentication = function() {
        return this.ticketManager.refreshTickets({
          interactive: true
        }, {}, this.handleAuth);
      };

      RoostSession.prototype.handleAuth = function(sessions) {
        var ticket;
        ticket = sessions.server;
        return this.userInfo.set({
          username: ticket.client.principalName.nameString[0],
          realm: ticket.client.principalName.realm
        });
      };

      return RoostSession;

    })();
  })();

}).call(this);
