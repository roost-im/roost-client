do ->
  class com.roost.SettingsPanel extends Backbone.View
    className: 'settings-panel'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .subscribe"] = '_addSubscription'
      eventsHash["#{com.roost.CLICK_EVENT} .close-td"] = '_removeSubscription'
      eventsHash["#{com.roost.CLICK_EVENT} .add-zsig"] = '_addZsig'
      eventsHash["#{com.roost.CLICK_EVENT} .remove-zsig"] = '_removeZsig'
      eventsHash["#{com.roost.CLICK_EVENT} .class-td"] = '_addClassPane'
      eventsHash["#{com.roost.CLICK_EVENT} .remove"] = '_hide'
      eventsHash['keyup input'] = '_handleInputKey'
      return eventsHash

    initialize: (options) =>
      @subscriptions = options.subscriptions
      @uiState = options.uiState
      @session = options.session
      @userInfo = @session.api.userInfo()

      @listenTo @subscriptions, 'add remove reset sort', @render
      @listenTo @uiState, 'change:showSubs', @_toggleDisplay
      @listenTo @uiState, 'change:showNavbar', @_hide

    render: =>
      @userInfo.ready().then(=>
        @$el.empty()
        template = com.roost.templates['SettingsPanel']
        @$el.append template(
          subscriptions: @subscriptions, zsigs: @_getZsigs())

        @_toggleDisplay())

    _toggleDisplay: =>
      if @uiState.get('showSubs')
        @$el.addClass('expanded')
        @$('.class-input').focus()
      else
        @$el.removeClass('expanded')
        @$('.class-input').blur()
        @$('.class-input').val('')
        @$('.instance-input').val('*')
        @$('.recipient-input').val('')

    _hide: =>
      @uiState.set('showSubs', false)

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
      @userInfo.set("zsigs", oldZsigs.concat([zsig]))
      @render()

    _removeZsig: (evt) =>
      zsigs = @_getZsigs()
      debugger
      zsigs.splice($(evt.target).data().zsigIndex, 1)
      @userInfo.set("zsigs", zsigs)
      @render()

    _handleInputKey: (evt) =>
      # Enter and escape key handling in the input boxes
      if evt.keyCode == 13
        @_addSubscription()
      else if evt.keyCode == 27
        @uiState.set 'showSubs', false

    _getZsigs: =>
      # Older versions of Roost store the zsig in 'zsig'. Check both.
      zsigs = @userInfo.get('zsigs') ? @userInfo.get('zsig')
      if !zsigs?
        zsigs = ["Sent from roost"]
      if typeof zsigs == "string"
        zsigs = [zsigs]
      # Defensive object copy so that @userInfo.set will always DTRT.
      return _.clone(zsigs)
