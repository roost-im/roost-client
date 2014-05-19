(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    return com.roost.RoostSession = (function() {
      function RoostSession() {
        this.removePane = __bind(this.removePane, this);
        this.addPane = __bind(this.addPane, this);
        this.userInfo = new Backbone.Model({
          username: null,
          realm: null
        });
        this.messageLists = new Backbone.Collection();
        this.messageControllers = {};
        this.localStorage = new LocalStorageWrapper();
        this.storageManager = new StorageManager(this.localStorage);
        this.ticketManager = new TicketManager(CONFIG.webathena, this.storageManager);
        this.api = new API(CONFIG.server, CONFIG.serverPrincipal, this.storageManager, this.ticketManager);
      }

      RoostSession.prototype.addPane = function(filters, position) {
        var paneController, paneModel;
        paneModel = new com.roost.MessagePaneModel({
          filters: filters,
          position: position
        });
        paneController = new com.roost.MessagePaneController({
          model: paneModel,
          api: this.api
        });
        paneController.fetchFromBottom();
        this.messageLists.push(paneModel);
        return this.messageControllers[paneModel.cid] = paneController;
      };

      RoostSession.prototype.removePane = function(cid) {
        this.messageControllers[cid].stopListening();
        this.messageLists.remove(cid);
        return delete this.messageControllers[cid];
      };

      return RoostSession;

    })();
  })();

}).call(this);
