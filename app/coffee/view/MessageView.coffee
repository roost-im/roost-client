do ->
  TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a'
  QUOTE_LINE_PREFIX = '> '

  class com.roost.MessageView extends Backbone.View
    className: 'message-view'

    events:
      'click .reply': '_openReplyBox'
      'click .pm': '_openMessageBox'
      'click .quote': '_openQuoteBox'

    initialize: (options) =>
      @message = options.message
      @paneModel = options.paneModel

    render: =>
      @$el.empty()
      template = com.roost.templates['MessageView']

      name = shortZuser(@message.get('sender'))
      realm = zuserRealm(@message.get('sender'))

      gravatar = getGravatarFromName(name, realm, 40)

      @$el.append template(_.defaults({}, @message.attributes, 
          absoluteTime: @message.get('time').format(TIME_FORMAT)
          shortSender: name
          gravatar: gravatar
        )
      )
      @updateTime()
      @updateColors()

    updateTime: =>
      @$('.time.from-now').text(@message.get('time').fromNow())

    updateColors: =>
      string = @message.get('class')
      color = shadeColor(stringToColor(string), 0.5)
      lighterColor = shadeColor(color, 0.4)

      @$('.header').css
        background: lighterColor

      @$('.msg-class').css
        background: color

      @$('.divider').css("border-left", "5px solid #{color}")

    remove: =>
      @undelegateEvents()
      @stopListening()
      @$el.removeData().unbind()
      super

      delete @$el
      delete @el

    _openReplyBox: =>
      @paneModel.set
        composeFields:
          class: @message.get('class')
          instance: @message.get('instance')
          recipient: ''
          content: ''
        showCompose: true

    _openMessageBox: =>
      @paneModel.set
        composeFields:
          class: 'message'
          instance: 'personal'
          recipient: shortZuser(@message.get('sender'))
          content: ''
        showCompose: true

    _openQuoteBox: =>
      quoted = QUOTE_LINE_PREFIX + @message.get('message').replace(/\n/g, "\n#{QUOTE_LINE_PREFIX}")
      @paneModel.set
        composeFields:
          class: @message.get('class')
          instance: @message.get('instance')
          recipient: ''
          content: quoted
        showCompose: true