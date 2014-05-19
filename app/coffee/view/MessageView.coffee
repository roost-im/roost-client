do ->
  TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a'

  class com.roost.MessageView extends Backbone.View
    className: 'message-view'

    initialize: (options) =>
      @message = options.message
      @paneModel = options.paneModel

    render: =>
      @$el.empty()
      template = com.roost.templates['MessageView']
      @$el.append template(_.defaults({}, @message.attributes, {absoluteTime: @message.get('time').format(TIME_FORMAT)}))
      @updateTime()

    updateTime: =>
      @$('.time.from-now').text(@message.get('time').fromNow())

    remove: =>
      @undelegateEvents()
      @stopListening()
      @$el.removeData().unbind()
      super

      delete @$el
      delete @el