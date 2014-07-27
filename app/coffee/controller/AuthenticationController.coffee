do ->
  class com.roost.AuthenticationController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @session = options.session
      @userInfoModel = options.userInfoModel
      @ticketManager = options.ticketManager

      @listenTo @userInfoModel, 'login', @requestAuth
      @listenTo @userInfoModel, 'logout', @removeAuthentication

      @doAuthentication()

    isAuthenticated: =>
      return @ticketManager.getCachedTicket("zephyr")?

    doAuthentication: =>
      if @isAuthenticated()
        ticket = @ticketManager.getCachedTicket("server")
        @userInfoModel.set
          username: ticket.client.principalName.nameString[0]
          realm: ticket.client.realm

    requestAuth: =>
      @ticketManager.refreshTickets({interactive: true}, {}, @handleAuth)

    removeAuthentication: =>
      @ticketManager.expireTickets()

      # Reset user info
      @userInfoModel.set
          username: null
          realm: null

      @session.removeAllPanes()

    handleAuth: (sessions) =>
      # Updates user info model
      # Ticket management controlled in the aptly named ticketManager
      ticket = sessions.server

      # Set the user info
      @userInfoModel.set
        username: ticket.client.principalName.nameString[0]
        realm: ticket.client.realm

      @session.loadState()