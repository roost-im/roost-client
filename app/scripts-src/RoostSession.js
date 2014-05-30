(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  (function() {
    return com.roost.RoostSession = (function() {
      function RoostSession() {
        this.removeAllPanes = __bind(this.removeAllPanes, this);
        this.removePane = __bind(this.removePane, this);
        this.addPane = __bind(this.addPane, this);
        this.userInfo = new Backbone.Model({
          username: null,
          realm: null
        });
        this.subscriptions = new Backbone.Collection();
        this.subscriptions.model = com.roost.SubscriptionModel;
        this.subscriptions.comparator = ((function(_this) {
          return function(a) {
            return baseString(a.get('class'));
          };
        })(this));
        this.messageLists = new Backbone.Collection();
        this.messageControllers = {};
        this.composeControllers = {};
        this.localStorage = new LocalStorageWrapper();
        this.storageManager = new StorageManager(this.localStorage);
        this.ticketManager = new TicketManager(CONFIG.webathena, this.storageManager);
        this.api = new API(CONFIG.server, CONFIG.serverPrincipal, this.storageManager, this.ticketManager);
        this.settingsModel = new Backbone.Model({
          keyboard: true,
          panes: true,
          showNavbar: true,
          showSubs: false,
          onMobile: true
        });
        Mousetrap.bind('alt+n', ((function(_this) {
          return function() {
            return _this.addPane({});
          };
        })(this)));
        Mousetrap.bind('alt+p', ((function(_this) {
          return function() {
            return _this.addPane({
              filters: {
                class_key: 'message',
                is_personal: true
              }
            });
          };
        })(this)));
      }

      RoostSession.prototype.addPane = function(options) {
        var composeController, paneController, paneModel;
        if (this.settingsModel.get('panes') || this.messageLists.length === 0) {
          paneModel = new com.roost.MessagePaneModel(options);
          paneController = new com.roost.MessagePaneController({
            model: paneModel,
            api: this.api
          });
          paneController.fetchFromPosition();
          composeController = new com.roost.ComposeController({
            model: paneModel,
            api: this.api
          });
          this.messageLists.push(paneModel);
          this.messageControllers[paneModel.cid] = paneController;
          return this.composeControllers[paneModel.cid] = composeController;
        } else {
          return this.messageLists.at(0).set(options);
        }
      };

      RoostSession.prototype.removePane = function(cid) {
        this.messageControllers[cid].stopListening();
        this.composeControllers[cid].stopListening();
        this.messageLists.remove(cid);
        delete this.messageControllers[cid];
        return delete this.composeControllers[cid];
      };

      RoostSession.prototype.removeAllPanes = function() {
        var cid, cids, model, _i, _j, _len, _len1, _ref, _results;
        cids = [];
        _ref = this.messageLists.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          model = _ref[_i];
          cids.push(model.cid);
        }
        _results = [];
        for (_j = 0, _len1 = cids.length; _j < _len1; _j++) {
          cid = cids[_j];
          _results.push(this.removePane(cid));
        }
        return _results;
      };

      return RoostSession;

    })();
  })();

}).call(this);
