do ->
  class com.roost.NavBar extends Backbone.View
    className: 'navbar'

    events:
      'click .btn-login': 'handleLogin'

    initialize: (options) =>
      @userInfo = options.userInfo

      @listenTo @userInfo, 'change', @render

    render: =>
      console.log @userInfo.attributes
      @$el.empty()
      template = com.roost.templates['NavBar']
      @$el.append template(_.defaults({loggedIn: @userInfo.get('username')?}, @userInfo.attributes))