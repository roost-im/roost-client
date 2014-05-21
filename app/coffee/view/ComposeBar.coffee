do ->
  class com.roost.ComposeBar extends Backbone.View
    className: 'compose-bar'

    events:
      'click .compose': '_showCompose'
      'click .close': '_hideCompose'
      'click .to-bottom': '_jumpToBottom'
      'click .send': '_sendMessage'

    initialize: (options) =>
      @paneModel = options.paneModel

      # Re-render, either to show the composer, update fields, or both
      @listenTo @paneModel, 'change:showCompose change:composeFields', @render

      # Disable the send button while a message is sending to prevent spamming
      @listenTo @paneModel, 'change:sending', @_updateButton

    render: =>
      @$el.empty()
      template = com.roost.templates['ComposeBar']
      @$el.append template(@paneModel.attributes)

      # TODO: focus properly depending on what fields are filled in
      # Bring focus to first input box
      @$('.class-input').focus()

    _showCompose: =>
      # Update model (triggers rerender)
      @paneModel.set('showCompose', true)

    _hideCompose: =>
      # Update model and clear fields (triggers rerender)
      @paneModel.set
        showCompose: false
        composeFields:
          class: ''
          instance: ''
          recipient: ''
          content: ''

    _jumpToBottom: =>
      # Treat as a complete reset
      @paneModel.set('loaded', false)
      @paneModel.trigger 'toBottom'

    _sendMessage: =>
      # If we aren't already sending, set the fields and fire the event
      # The ComposeController associated with this model will hadnle the rest
      if not @paneModel.get('sending')
        @paneModel.set('composeFields',
          class: @$('.class-input').val()
          instance: @$('.instance-input').val()
          recipient: @$('.recipient-input').val()
          content: @$('.content-input').val()
        )
        @paneModel.set('sending', true)
        @paneModel.trigger 'sendMessage'

    _updateButton: =>
      if @paneModel.get('sending')
        @$('.send').addClass('disabled').text('Sending...')
      else
        @$('.send').removeClass('disabled').text('Send')