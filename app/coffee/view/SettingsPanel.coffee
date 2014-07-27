do ->
  class com.roost.SettingsPanel extends Backbone.View
    className: 'settings-panel'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .settings-tab"]   = '_changeTab'
      eventsHash["#{com.roost.CLICK_EVENT} .settings-close"] = '_hide'
      return eventsHash

    initialize: (options) =>
      @subscriptions     = options.subscriptions
      @userSettingsModel = options.userSettingsModel
      @uiState           = options.uiState
      @session           = options.session

      @views = 
        general : new com.roost.GeneralSettingsView
          model : @userSettingsModel
        subscriptions : new com.roost.SubscriptionSettingsView
          subscriptions : @subscriptions
          userSettings  : @userSettingsModel
          uiState       : @uiState
          session       : @session
        zsigs : new com.roost.ZSigSettingsView
          model   : @userSettingsModel
          uiState : @uiState
        hotkeys : new com.roost.HotkeySettingsView
          model : @userSettingsModel
        help : new com.roost.HelpView()

      @listenTo @uiState, 'change:showSettings', @_toggleVisibility
      @listenTo @uiState, 'change:settingsTab', @_setTab
      @listenTo @userSettingsModel, 'firstRun', @_firstRun

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['SettingsPanel']()

      for content in @$('.settings-content')
        key = $(content).data().content
        @views[key].render()
        $(content).append @views[key].$el

      if not @uiState.get('showSettings')
        @$el.addClass('hidden')
      else
        @$el.removeClass('hidden')

      @_setTab()

    _toggleVisibility: =>
      if @uiState.get('showSettings') then @_show() else @_hide()

    _show: =>
      @$el.removeClass('hidden')

    _hide: =>
      @uiState.set('showSettings', false)
      @$el.addClass('hidden')

    _changeTab: (evt) =>
      @uiState.set 'settingsTab', $(evt.target).data().content

    _setTab: =>
      @$('.settings-tab').removeClass('selected')
      @$('.settings-content').removeClass('selected')
      for tab in @$('.settings-tab')
        if $(tab).data().content == @uiState.get('settingsTab')
          $(tab).addClass('selected')

      for content in @$('.settings-content')
        if $(content).data().content == @uiState.get('settingsTab')
          $(content).addClass('selected')

    _firstRun: =>
      @uiState.set
        showSettings : true
        settingsTab  : 'help'
      @userSettingsModel.set('hasSeenRoost', true)
