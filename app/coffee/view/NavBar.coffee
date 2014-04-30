do ->
  class com.roost.NavBar extends Backbone.View
    className: 'navbar'

    events:
      'click .login': 'handleLogin'
      'click .logout': 'handleLogout'

    initialize: (options) =>
      @session = options.session
      @userInfo = @session.userInfo

      @listenTo @userInfo, 'change', @render

    render: =>
      @$el.empty()
      template = com.roost.templates['NavBar']

      if @userInfo.get('username')?
        gravatar = getGravatarFromName @userInfo.get('username'), @userInfo.get('realm'), 100
      @$el.append template(_.defaults({loggedIn: @userInfo.get('username')?, gravatar: gravatar}, @userInfo.attributes))

    handleLogin: =>
      @userInfo.trigger 'login'

    handleLogout: =>
      @userInfo.trigger 'logout'