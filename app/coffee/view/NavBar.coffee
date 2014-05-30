do ->
  class com.roost.NavBar extends Backbone.View
    className: 'navbar'

    events:
      'click .logout': '_handleLogout'
      'click .add-pane': '_addPane'
      'click .personal-message': '_addPersonalMessagePane'
      'click .user-info': '_toggleSubs'

      'click .toggle-panes': '_togglePanes'
      'click .toggle-keyboard': '_toggleKeyboard'

    initialize: (options) =>
      @session = options.session
      @userInfo = @session.userInfo
      @settings = @session.settingsModel

      # Re-render on login/logout or settings changes.
      @listenTo @userInfo, 'change', @render
      @listenTo @settings, 'change:showNavbar', @render

    render: =>
      @$el.empty()
      template = com.roost.templates['NavBar']

      # If we're logged in, get the gravatar URL
      if @userInfo.get('username')?
        gravatar = getGravatarFromName @userInfo.get('username'), @userInfo.get('realm'), 100

      if not @settings.get('showNavbar')
        @$el.addClass('hidden')
      else
        @$el.removeClass('hidden')

      @$el.append template(_.defaults({loggedIn: @userInfo.get('username')?, gravatar: gravatar}, @userInfo.attributes, @settings.attributes))

    _handleLogout: =>
      # Trigger the model, AuthenticationController will handle it
      @userInfo.trigger 'logout'

    _addPane: =>
      @session.addPane {}

    _addPersonalMessagePane: =>
      # Create a new pane with personal message filtering
      @session.addPane 
        filters:
          class_key: 'message'
          is_personal: true

    _togglePanes: =>
      # Flip on/off showing multiple panes
      @settings.set 'panes', !@settings.get('panes')

    _toggleKeyboard: =>
      # Flip on/off using keyboard shortcuts
      @settings.set 'keyboard', !@settings.get('keyboard')

    _toggleSubs: =>
      # Flip on/off showing subscriptions
      @settings.set 'showSubs', !@settings.get('showSubs')
