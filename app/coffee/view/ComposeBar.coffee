do ->
  class com.roost.ComposeBar extends Backbone.View
    className: 'compose-bar'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .compose"] = '_showCompose'
      eventsHash["#{com.roost.CLICK_EVENT} .close"] = '_hideCompose'
      eventsHash["#{com.roost.CLICK_EVENT} .to-bottom"] = '_jumpToBottom'
      eventsHash["#{com.roost.CLICK_EVENT} .send"] = '_sendMessage'
      eventsHash['keydown input'] = '_handleInputsKey'
      eventsHash['keydown textarea'] = '_handleInputsKey'
      eventsHash['blur .class-input'] = '_checkSubs'
      return eventsHash

    initialize: (options) =>
      @paneModel = options.paneModel
      @settings = options.settings
      @session = options.session

      # Re-render, either to show the composer, update fields, or update that this pane
      # is selected.
      @listenTo @paneModel, 'change:showCompose change:composeFields change:selected change:filters', @render

      # Disable the send button while a message is sending to prevent spamming
      @listenTo @paneModel, 'change:sending', @_updateButton

    render: =>
      @$el.empty()

      defaultFields = @_getDefaultFields()
      composeFields = _.defaults({}, @paneModel.get('composeFields'), defaultFields)

      template = com.roost.templates['ComposeBar']
      @$el.append template(_.defaults({composeFields: composeFields, onMobile: com.roost.ON_MOBILE}, @paneModel.attributes))

      # Set full opacity class if this pane is selected
      if @paneModel.get('selected')
        @$el.addClass('selected')
      else
        @$el.removeClass('selected')

      # Autocomplete currently only works for browser - mobile click event issues
      if not com.roost.ON_MOBILE
        @$('.class-input').typeahead({
          hint: true,
          highlight: true,
          minLength: 1
        },
        {
          name: 'subs'
          displayKey: 'value'
          source: substringMatcher(@session.subscriptions.pluck('class'))
        })
        @$('.class-input').typeahead('val', composeFields.class)

      @_focusProperInitialField(composeFields)

    _focusProperInitialField: (composeFields) =>
      if composeFields.class != '' and composeFields.instance != '' and composeFields.recipient != ''
        # Hack to get the cursor to the end of the input
        oldVal = @$('.content-input').val()
        @$('.content-input').focus().val("").val(oldVal)
      # If it's a personal message filter but NO RECIPIENT yet, focus recipient
      else if @paneModel.get('filters').is_personal and composeFields.recipient == ''
        @$('.recipient-input').focus()
      # If we have a class and an instance, focus on the content at the end
      else if composeFields.class != '' and composeFields.instance != ''
        # Hack to get the cursor to the end of the input
        oldVal = @$('.content-input').val()
        @$('.content-input').focus().val("").val(oldVal)
      # ...if we have a class and no instance, focus on the instance
      else if composeFields.class != '' and composeFields.instance == ''
        @$('.instance-input').focus()
      # Finally, if we have nothing, just focus the class input
      else
        @$('.class-input').focus()

    _showCompose: =>
      # Update model (triggers rerender)
      @paneModel.set('showCompose', true)

      if com.roost.ON_MOBILE
        @settings.set('showNavbar', false)

    _hideCompose: =>
      # Update model and clear fields (triggers rerender)
      @paneModel.set
        showCompose: false
        composeFields: {}

      # In case we hid it last time for mobile
      @settings.set('showNavbar', true)

    _jumpToBottom: =>
      # Treat as a complete reset, clearing position and reloading
      @paneModel.set
        position: null
      @paneModel.trigger 'reload'

    _getDefaultFields: =>
      filteredFields = 
        class: ''
        instance: ''
        recipient: ''
        content: ''
      filters = @paneModel.get('filters')

      if filters.is_personal
        filteredFields.class = 'message'
        filteredFields.instance = 'personal'
      else if filters.class_key_base
        filteredFields.class = filters.class_key_base
        if filters.instance_key_base?
          filteredFields.instance = filters.instance_key_base

      return filteredFields

    _sendMessage: =>
      # If we aren't already sending, set the fields and fire the event
      # The ComposeController associated with this model will hadnle the rest
      if not @paneModel.get('sending')
        @paneModel.set('composeFields',
          class: @$('.class-input:not(.tt-hint)').val()
          instance: @$('.instance-input').val()
          recipient: @$('.recipient-input').val()
          content: wrapText(@$('.content-input').val())
        )
        @paneModel.set('sending', true)
        @paneModel.trigger 'sendMessage'

    _updateButton: =>
      # Disable send button if we are sending
      if @paneModel.get('sending')
        @$('.send').addClass('disabled').text('Sending...')
      else
        @$('.send').removeClass('disabled').text('Send')
        @_hideCompose()

    _handleInputsKey: (evt) =>
      # Handle escape key (should work in ANY input box)
      if evt.keyCode == 27
        @_hideCompose()

    _checkSubs: =>
      if not _.contains(@session.subscriptions.pluck('classKey'), @$('.class-input:not(.tt-hint)').val().toLowerCase())
        @$('.error').show()
      else
        @$('.error').hide()
