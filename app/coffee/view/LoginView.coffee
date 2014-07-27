do ->
  class com.roost.LoginView extends Backbone.View
    className: 'login-view'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .login"] = '_handleLogin'
      eventsHash["#{com.roost.CLICK_EVENT} .logout"] = '_handleLogout'
      return eventsHash

    initialize: (options) =>
      @userInfoModel = options.userInfoModel
      @listenTo @userInfoModel, 'change', @render

    render: =>
      @$el.empty()
      if @userInfoModel.get('username')?
        @$el.hide()
      else
        @$el.show()
        template = com.roost.templates['LoginView']
        @$el.append template({})

    _handleLogin: =>
      # Trigger the model, AuthenticationController will handle it
      @userInfoModel.trigger 'login'

    _handleLogout: =>
      # Trigger the model, AuthenticationController will handle it
      @userInfoModel.trigger 'logout'