do ->
  class com.roost.SettingsPanel extends Backbone.View
    className: 'settings-panel'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .settings-tab"]   = '_changeTab'
      eventsHash["#{com.roost.CLICK_EVENT} .settings-close"] = '_hide'
      eventsHash["#{com.roost.CLICK_EVENT} .add-zsig"]    = '_addZsig'
      eventsHash["#{com.roost.CLICK_EVENT} .remove-zsig"] = '_removeZsig'
      eventsHash['keyup #new-zsig']                       = '_handleZsigInputKey'
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
          session       : @session
        zsigs : new com.roost.ZSigSettingsView
          model : @userSettingsModel
        hotkeys : new com.roost.HotkeySettingsView
          model : @userSettingsModel
        help : new com.roost.HelpView()

      @listenTo @uiState, 'change:showSettings', @_toggleVisibility
      @listenTo @uiState, 'change:settingsTab', @_setTab

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

    _addClassPane: (evt) =>
      classKey = $(evt.target).data().class
      options = 
        filters: 
          class_key_base: baseString(classKey)

      @session.addPane options

    _addSubscription: =>
      opts =
        class: @$('.class-input').val()
        instance: @$('.instance-input').val()
        recipient: @$('.recipient-input').val()

      # Only add the fields we actually have
      sub = {}
      if opts.class != ''
        sub.class = opts.class
      if opts.instance != ''
        sub.instance = opts.instance
      if opts.recipient != ''
        sub.recipient = opts.recipient

      @subscriptions.add sub

    _removeSubscription: (evt) =>
      @subscriptions.remove($(evt.target).data().cid)

    _addZsig: =>
      zsig = @$('#new-zsig').val()
      oldZsigs = @_getZsigs()
      @userState.set("zsigs", oldZsigs.concat([zsig]))
      @render()

    _removeZsig: (evt) =>
      zsigs = @_getZsigs()
      zsigs.splice($(evt.target).data().zsigIndex, 1)
      @userState.set("zsigs", zsigs)
      @render()

    _handleZsigInputKey: (evt) =>
      # Enter and escape key handling in the input boxes
      if evt.keyCode == 13
        @_addZsig()
      else if evt.keyCode == 27
        @uiState.set 'showSubs', false

    _getZsigs: =>
      # Older versions of Roost store the zsig in 'zsig'. Check both.
      zsigs = @userState.get('zsigs') ? @userState.get('zsig')
      if !zsigs?
        zsigs = ["Sent from roost"]
      if typeof zsigs == "string"
        zsigs = [zsigs]
      # Defensive object copy so that @userState.set will always DTRT.
      return _.clone(zsigs)
