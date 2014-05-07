do ->
  class com.roost.MessageView extends Backbone.View
    className: 'message-view'

    initialize: (options) =>
      @message = options.message
      @paneModel = options.paneModel

    render: =>
      @$el.empty()
      template = com.roost.templates['MessageView']
      @$el.append template(@message.attributes)
      @$el.attr('id', @message.cid + '')