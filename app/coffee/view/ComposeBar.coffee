do ->
  class com.roost.ComposeBar extends Backbone.View
    className: 'compose-bar'

    events:
      'click .compose': '_showCompose'
      'click .close': '_hideCompose'
      'click .to-bottom': '_jumpToBottom'
      'click .send': '_sendMessage'

      'keydown input': '_handleInputsKey'
      'keydown textarea': '_handleInputsKey'

    initialize: (options) =>
      @paneModel = options.paneModel

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
      @$el.append template(_.defaults({composeFields: composeFields}, @paneModel.attributes))

      # Set full opacity class if this pane is selected
      if @paneModel.get('selected')
        @$el.addClass('selected')
      else
        @$el.removeClass('selected')

      # Bring focus to class box OR message box in case stuff filled already
      if composeFields.class != ''
        # Hack to get the cursor to the end of the input
        oldVal = @$('.content-input').val()
        @$('.content-input').focus().val("").val(oldVal)
      else
        @$('.class-input').focus()

    _showCompose: =>
      # Update model (triggers rerender)
      @paneModel.set('showCompose', true)

    _hideCompose: =>
      # Update model and clear fields (triggers rerender)
      @paneModel.set
        showCompose: false
        composeFields: {}

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

      if filters.class_key?
        filteredFields.class = filters.class_key
        if filters.instance_key?
          filteredFields.instance = filters.instance_key

      return filteredFields

    _sendMessage: =>
      # If we aren't already sending, set the fields and fire the event
      # The ComposeController associated with this model will hadnle the rest
      if not @paneModel.get('sending')
        @paneModel.set('composeFields',
          class: @$('.class-input').val()
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

    _handleInputsKey: (evt) =>
      # Handle escape key (should work in ANY input box)
      if evt.keyCode == 27
        @_hideCompose()
