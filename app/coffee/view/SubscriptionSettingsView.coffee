do ->
  class com.roost.SubscriptionSettingsView extends Backbone.View
    className : 'subscription-settings'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .class-td"]  = '_addClassPane'
      eventsHash["#{com.roost.CLICK_EVENT} .subscribe"] = '_addSubscription'
      eventsHash["#{com.roost.CLICK_EVENT} .close-td"]  = '_removeSubscription'
      eventsHash['keyup .subs-input']                   = '_handleSubsInputKey'
      return eventsHash

    initialize: (options) =>
      @subscriptions = options.subscriptions
      @userSettings  = options.userSettings
      @uiState       = options.uiState
      @session       = options.session

      @listenTo @subscriptions, 'add reset sort', @render
      @listenTo @subscriptions, 'remove', @_removeSubscriptionRow

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['SubscriptionSettingsView']({subscriptions: @subscriptions})

    _handleSubsInputKey: (evt) =>
      # Enter and escape key handling in the input boxes
      if evt.keyCode == 13
        @_addSubscription()
      else if evt.keyCode == 27
        @uiState.set 'showSettings', false

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

    _removeSubscriptionRow: (sub) =>
      for row in @$('.subs-table tr')
        if $(row).data().cid == sub.cid
          $(row).remove()