do ->
  class com.roost.ComposeBar extends Backbone.View
    className: 'compose-bar'

    events:
      'click .compose': '_showCompose'
      'click .close': '_hideCompose'
      'click .to-bottom': '_jumpToBottom'

    initialize: (options) =>
      @paneModel = options.paneModel

      @listenTo @paneModel, 'change:showCompose change:composeFields', @render

    render: =>
      @$el.empty()
      template = com.roost.templates['ComposeBar']
      @$el.append template(@paneModel.attributes)

    _showCompose: =>
      @paneModel.set('showCompose', true)

    _hideCompose: =>
      @paneModel.set('showCompose', false)

    _jumpToBottom: =>
      @paneModel.set('loaded', false)
      @paneModel.trigger 'toBottom'