do ->
  class com.roost.LoginView extends Backbone.View
    className: 'login-view'

    tapClickEvents:
      '.login': '_handleLogin'
      '.logout': '_handleLogout'

    events: ->
      eventsHash = {}
      return eventsHash

    initialize: (options) =>
      @userInfo = options.userInfo
      @listenTo @userInfo, 'change', @render

    render: =>
      super()
      @$el.empty()
      if @userInfo.get('username')?
        @$el.hide()
      else
        @$el.show()
        template = com.roost.templates['LoginView']
        @$el.append template({})

    _handleLogin: =>
      # Trigger the model, AuthenticationController will handle it
      @userInfo.trigger 'login'

    _handleLogout: =>
      # Trigger the model, AuthenticationController will handle it
      @userInfo.trigger 'logout'
