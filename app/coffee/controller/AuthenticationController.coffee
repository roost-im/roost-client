do ->
  # TODO: implement with some more robust knowledge of what tickets are
  class com.roost.AuthenticationController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @session = options.session
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
          realm: ticket.client.realm
      else
        @ticketManager.refreshTickets({interactive: true}, {}, @handleAuth)

    removeAuthentication: =>
      @ticketManager.expireTickets()

      # Reset user info
      @userInfo.set
          username: null
          realm: null

      #TODO: clear messageLists in session

    handleAuth: (sessions) =>
      # Updates user info model
      # Ticket management controlled in the aptly named ticketManager
      ticket = sessions.server

      # Set the user info
      @userInfo.set
        username: ticket.client.principalName.nameString[0]
        realm: ticket.client.realm

      @session.addPane {}, null