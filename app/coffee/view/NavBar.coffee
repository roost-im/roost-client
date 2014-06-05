do ->
  class com.roost.NavBar extends Backbone.View
    className: 'navbar'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .logout"] = '_handleLogout'
      eventsHash["#{com.roost.CLICK_EVENT} .add-pane"] = '_addPane'
      eventsHash["#{com.roost.CLICK_EVENT} .personal-message"] = '_addPersonalMessagePane'
      eventsHash["#{com.roost.CLICK_EVENT} .user-info"] = '_toggleSubs'
      eventsHash["#{com.roost.CLICK_EVENT} .help"] = '_openHelp'
      return eventsHash

    initialize: (options) =>
      @session = options.session
      @userInfo = @session.userInfo
      @uiState = @session.uiStateModel

      # Re-render on login/logout or uiState changes.
      @listenTo @userInfo, 'change', @render
      @listenTo @uiState, 'change:showNavbar change:limitReached', @render

    render: =>
      @$el.empty()
      template = com.roost.templates['NavBar']

      if not @uiState.get('showNavbar')
        @$el.addClass('hidden')
      else
        @$el.removeClass('hidden')

      @$el.append template(_.defaults(@uiState.attributes, @userInfo.attributes))

    _handleLogout: =>
      # Trigger the model, AuthenticationController will handle it
      @userInfo.trigger 'logout'

    _addPane: =>
      if !@uiState.get('limitReached')
        @session.addPane {}

    _addPersonalMessagePane: =>
      # Create a new pane with personal message filtering
      if !@uiState.get('limitReached')
        @session.addPane
          filters:
            is_personal: true

    _toggleSubs: =>
      # Flip on/off showing subscriptions
      @uiState.set 'showSubs', !@uiState.get('showSubs')

    # Help logic is duplicated between here and the MessagePane...
    _openHelp: =>
      if $('.modal-overlay').length == 0
        $('body').append com.roost.templates['HotkeyHelp']({})
        $('.close-help').click(@_hideHelp)

    _hideHelp: =>
      $('.modal-overlay').remove()
      $('.modal').remove()
