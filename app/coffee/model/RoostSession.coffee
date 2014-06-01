do ->

  # TODO: it's unclear if the functionality of adding or removing panes should exist here,
  # or if other views should be able to add/remove pains and this session just listens.
  # The main point is that something has to exist to both bind controllers and clean up
  # stuff when panes get deleted.

  class com.roost.RoostSession
    constructor: ->
      # User info
      @userInfo = new Backbone.Model
        username: null
        realm: null

      # User's subscriptions
      @subscriptions = new Backbone.Collection()
      @subscriptions.model = com.roost.SubscriptionModel
      @subscriptions.comparator = ((a) => return baseString(a.get('class')))

      # Collection of Message List Models
      @messageLists = new Backbone.Collection()

      # Map of message controllers
      @messageControllers = {}

      # Map of compose controllers
      @composeControllers = {}

      # Singleton services we need to hold on to
      # Currently uses old Roost objects
      @localStorage = new LocalStorageWrapper()
      @storageManager = new StorageManager(@localStorage)
      @ticketManager = new TicketManager(CONFIG.webathena, @storageManager)
      @api = new API(CONFIG.server, CONFIG.serverPrincipal, @storageManager, @ticketManager)

      # UI settings - defaults are PC mode.
      @settingsModel = new Backbone.Model
        showNavbar: true
        showSubs: false
        limitReached: false

      # I really don't know if this is where the hotkeys go.
      # Most of the hotkeys hang out in the MessagePane view.
      Mousetrap.bind('alt+n', (=> @addPane {}))
      Mousetrap.bind('alt+p', (=> @addPane 
        filters:
          class_key_base: 'message'
          is_personal: true
        )
      )

    addPane: (options) =>
      # Add a pane to our list if we have the multi-pane setting enabled,
      # or if we don't have any panes at all.
      # Add a new model
      paneModel = new com.roost.MessagePaneModel(options)

      # Add a new controller and fetch data
      paneController = new com.roost.MessagePaneController
        model: paneModel
        api: @api
      paneController.fetchFromPosition()

      # Add compose controller for sending messages
      composeController = new com.roost.ComposeController
        model: paneModel
        api: @api

      # Save references to the controllers and model
      @messageLists.push paneModel
      @messageControllers[paneModel.cid] = paneController
      @composeControllers[paneModel.cid] = composeController

      if @messageLists.length >= com.roost.PANE_LIMIT
        @settingsModel.set('limitReached', true)

    removePane: (cid) =>
      # Stop the controllers from listening to the model
      @messageControllers[cid].stopListening()
      @composeControllers[cid].stopListening()

      # Remove references to the model and the controller
      @messageLists.remove(cid)
      delete @messageControllers[cid]
      delete @composeControllers[cid]

      @settingsModel.set('limitReached', false)

    removeAllPanes: =>
      cids = []
      for model in @messageLists.models
        cids.push(model.cid)

      for cid in cids
        @removePane(cid)