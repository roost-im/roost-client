do ->
  class com.roost.NavBar extends Backbone.View
    className: 'navbar'

    tapClickEvents:
      '.logout': '_handleLogout'
      '.add-pane': '_addPane'
      '.personal-message': '_addPersonalMessagePane'
      '.user-info': '_showSettings'
      '.help': '_showHelp'

    initialize: (options) =>
      @session = options.session
      @userInfoModel = @session.userInfoModel
      @uiState = @session.uiStateModel

      # Re-render on login/logout or uiState changes.
      @listenTo @userInfoModel, 'change', @render
      @listenTo @uiState, 'change:showNavbar change:limitReached', @render

    render: =>
      super()
      @$el.empty()
      template = com.roost.templates['NavBar']

      if not @uiState.get('showNavbar')
        @$el.addClass('hidden')
      else
        @$el.removeClass('hidden')

      @$el.append template(_.defaults({}, @uiState.attributes, @userInfoModel.attributes))

    _handleLogout: =>
      # Trigger the model, AuthenticationController will handle it
      @userInfoModel.trigger 'logout'

    _addPane: =>
      if !@uiState.get('limitReached')
        @session.addPane {}

    _addPersonalMessagePane: =>
      # Create a new pane with personal message filtering
      if !@uiState.get('limitReached')
        @session.addPane
          filters:
            is_personal: true

    # Show the settings modal.
    _showSettings: =>
      @uiState.set
        showSettings : true

    _showHelp: =>
      @uiState.set
        showSettings : true
        settingsTab  : 'help'
