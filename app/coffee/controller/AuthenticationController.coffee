do ->
  # TODO: implement with some more robust knowledge of what tickets are
  class com.roost.AuthenticationController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @userInfo = options.userInfo
      @ticketManager = options.ticketManager

      @listenTo @userInfo, 'login', @doAuthentication
      @listenTo @userInfo, 'logout', @removeAuthentication

    isAuthenticated: =>
      return @ticketManager.getCachedTicket("zephyr")?

    doAuthentication: =>
      if @isAuthenticated()
        ticket = @ticketManager.getCachedTicket("server")
        @userInfo.set
          username: ticket.client.principalName.nameString[0]
          realm: ticket.client.principalName.realm
      else
        @ticketManager.refreshTickets({interactive: true}, {}, @handleAuth)

    removeAuthentication: =>
      @ticketManager.expireTickets()
      @userInfo.set
          username: null
          realm: null

    handleAuth: (sessions) =>
      # Updates user info model
      # Ticket management controlled in the aptly named ticketManager
      ticket = sessions.server

      @userInfo.set
        username: ticket.client.principalName.nameString[0]
        realm: ticket.client.principalName.realm