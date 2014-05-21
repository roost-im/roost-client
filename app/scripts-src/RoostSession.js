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
        this.composeControllers = {};
        this.localStorage = new LocalStorageWrapper();
        this.storageManager = new StorageManager(this.localStorage);
        this.ticketManager = new TicketManager(CONFIG.webathena, this.storageManager);
        this.api = new API(CONFIG.server, CONFIG.serverPrincipal, this.storageManager, this.ticketManager);
        Mousetrap.bind('shift+n', ((function(_this) {
          return function() {
            return _this.addPane({}, null);
          };
        })(this)));
      }

      RoostSession.prototype.addPane = function(filters, position) {
        var composeController, paneController, paneModel;
        paneModel = new com.roost.MessagePaneModel({
          filters: filters,
          position: position
        });
        paneController = new com.roost.MessagePaneController({
          model: paneModel,
          api: this.api
        });
        paneController.fetchFromBottom();
        composeController = new com.roost.ComposeController({
          model: paneModel,
          api: this.api
        });
        this.messageLists.push(paneModel);
        this.messageControllers[paneModel.cid] = paneController;
        return this.composeControllers[paneModel.cid] = composeController;
      };

      RoostSession.prototype.removePane = function(cid) {
        this.messageControllers[cid].stopListening();
        this.composeControllers[cid].stopListening();
        this.messageLists.remove(cid);
        delete this.messageControllers[cid];
        return delete this.composeControllers[cid];
      };

      return RoostSession;

    })();
  })();

}).call(this);
