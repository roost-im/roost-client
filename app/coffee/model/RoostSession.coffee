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

      Mousetrap.bind('shift+n', (=> @addPane {}, null))

    addPane: (filters, position) =>
      # Add a new model
      paneModel = new com.roost.MessagePaneModel
        filters: filters
        position: position

      # Add a new controller and fetch data
      paneController = new com.roost.MessagePaneController
        model: paneModel
        api: @api
      paneController.fetchFromBottom()

      composeController = new com.roost.ComposeController
        model: paneModel
        api: @api

      @messageLists.push paneModel
      @messageControllers[paneModel.cid] = paneController
      @composeControllers[paneModel.cid] = composeController

    removePane: (cid) =>
      @messageControllers[cid].stopListening()
      @composeControllers[cid].stopListening()
      @messageLists.remove(cid)
      delete @messageControllers[cid]
      delete @composeControllers[cid]