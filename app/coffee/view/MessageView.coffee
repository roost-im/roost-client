do ->
  TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a'
  QUOTE_LINE_PREFIX = '> '

  class com.roost.MessageView extends Backbone.View
    className: 'message-view'

    events:
      'click .reply': '_openReplyBox'
      'click .pm': '_openMessageBox'
      'click .quote': '_openQuoteBox'

      'click .msg-class': '_filterClass'
      'click .msg-instance': '_filterInstance'

    initialize: (options) =>
      # TODO: find a better way to spawn new panes other than through the session
      @message = options.message
      @paneModel = options.paneModel
      @session = options.session

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

      @$el.addClass(@message.get('id'))

      @updatePosition()
      @updateTime()
      @updateColors()

    updatePosition: =>
      if @paneModel.get('position') == @message.get('id')
        @$el.addClass('positioned')

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

    _filterClass: (evt) =>
      options = 
        filters: 
          class_key: @message.get('class')
        position: @message.get('id')
        posScroll: @$el.offset().top

      if evt.shiftKey
        @session.addPane options
      else
        @paneModel.set options

    _filterInstance: (evt) =>
      options = 
        filters: 
          class_key: @message.get('class')
          instance_key: @message.get('instance')
        position: @message.get('id')
        posScroll: @$el.offset().top

      if evt.shiftKey
        @session.addPane options
      else
        @paneModel.set options
