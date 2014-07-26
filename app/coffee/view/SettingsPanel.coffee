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
      eventsHash['keyup #new-zsig'] = '_handleZsigInputKey'
      eventsHash['keyup .subs-input'] = '_handleSubsInputKey'
      return eventsHash

    initialize: (options) =>
      @subscriptions = options.subscriptions
      @uiState = options.uiState
      @session = options.session
      @userState = @session.api.userInfo()

      @listenTo @subscriptions, 'add remove reset sort', @render

    render: =>
      @userState.ready().then(=>
        @$el.empty()
        template = com.roost.templates['SettingsPanel']
        @$el.append(template(
          subscriptions: @subscriptions, zsigs: @_getZsigs())))

    show: =>
      @render()
      vex.dialog.alert(message: @$el)

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

    _handleSubsInputKey: (evt) =>
      # Enter and escape key handling in the input boxes
      if evt.keyCode == 13
        @_addSubscription()
      else if evt.keyCode == 27
        @uiState.set 'showSubs', false

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
