do ->
  class com.roost.RoostSession
    constructor: ->
      # User info
      @userInfo = new Backbone.Model()

      # Collection of Message List Models
      @messageLists = new Backbone.Collection()

      # Singleton services we need to hold on to
      @localStorage = new LocalStorageWrapper()
      @storageManager = new StorageManager(@localStorage)
      @ticketManager = new TicketManager(CONFIG.webathena, @storageManager)
      @api = new API(CONFIG.server, CONFIG.serverPrincipal, @storageManager, @ticketManager)

      com.roost.ticketManager = @ticketManager

    addPane: (filters, position) =>
      # Add a new model
      paneModel = new com.roost.MessagePaneModel
        filters: filters
        position: position

      # Add a new controller and fetch data
      paneController = new com.roost.MessagePaneController
        model: paneModel
      paneController.fetchFromBottom()

      @messageLists.push paneModel

    isAuthenticated: =>
      return @ticketManager.getCachedTicket("zephyr")?

    doAuthentication: =>
      @ticketManager.refreshTickets({interactive: true}, {}, @handleAuth)

    handleAuth: (sessions) =>
      console.log(sessions)