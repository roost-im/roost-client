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

      @listenTo @paneModel, 'change:showCompose change:composeFields', @render
      @listenTo @paneModel, 'change:sending', @_updateButton

    render: =>
      @$el.empty()
      template = com.roost.templates['ComposeBar']
      @$el.append template(@paneModel.attributes)

      @$('.class-input').focus()

    _showCompose: =>
      @paneModel.set('showCompose', true)

    _hideCompose: =>
      @paneModel.set
        showCompose: false
        composeFields:
          class: ''
          instance: ''
          recipient: ''
          content: ''

    _jumpToBottom: =>
      @paneModel.set('loaded', false)
      @paneModel.trigger 'toBottom'

    _sendMessage: =>
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