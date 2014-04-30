do ->
  class com.roost.RoostSession
    constructor: ->
      # User info
      @userInfo = new Backbone.Model
        username: null
        realm: null

      # Collection of Message List Models
      @messageLists = new Backbone.Collection()

      # Singleton services we need to hold on to
      # Currently uses old Roost objects
      @localStorage = new LocalStorageWrapper()
      @storageManager = new StorageManager(@localStorage)
      @ticketManager = new TicketManager(CONFIG.webathena, @storageManager)
      @api = new API(CONFIG.server, CONFIG.serverPrincipal, @storageManager, @ticketManager)

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

      @messageLists.push paneModel