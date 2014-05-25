do ->
  TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a'
  QUOTE_LINE_PREFIX = '> '

  class com.roost.MessageView extends Backbone.View
    className: 'message-view'

    events:
      'click .reply': 'openReplyBox'
      'click .pm': 'openMessageBox'
      'click .quote': 'openQuoteBox'

      'click .msg-class': '_filterClass'
      'click .msg-instance': '_filterInstance'

    initialize: (options) =>
      # TODO: find a better way to spawn new panes other than through the session
      @message = options.message
      @paneModel = options.paneModel
      @session = options.session

      # One might think of listening to @message for some events, or even
      # @paneModel for events, but that's a bad idea in general. These views
      # get created and disposed of quickly, so there's a high chance of errors
      # if listeners are firing in here. Even with proper cleanup, it gets bad.
      # Therefore, all listening to stuff is delegated to the parent view.

    render: =>
      @$el.empty()
      template = com.roost.templates['MessageView']

      # Get the gravatar for the user
      name = shortZuser(@message.get('sender'))
      realm = zuserRealm(@message.get('sender'))
      gravatar = getGravatarFromName(name, realm, 40)

      # TODO: move some of this to handlebars helpers
      @$el.append template(_.defaults({}, @message.attributes, 
          absoluteTime: @message.get('time').format(TIME_FORMAT)
          shortSender: name
          gravatar: gravatar
        )
      )

      # Various updates to make sure the view is decorated properly.
      # Done separate from handlebars since these things have a habit of changing.
      @updatePosition()
      @updateTime()
      @updateColors()

    updatePosition: =>
      if @paneModel.get('position') == @message.get('id')
        @$el.addClass('positioned')
      else
        @$el.removeClass('positioned')

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

    openReplyBox: =>
      # Fill in proper fields and open the compose box
      @paneModel.set
        composeFields:
          class: @message.get('class')
          instance: @message.get('instance')
          recipient: ''
          content: ''
        showCompose: true

    openMessageBox: =>
      # Fill in proper fields and open the compose box
      # TODO: should this be a shortZuser or something else?
      @paneModel.set
        composeFields:
          class: 'message'
          instance: 'personal'
          recipient: shortZuser(@message.get('sender'))
          content: ''
        showCompose: true

    openQuoteBox: =>
      # Build the quoted message string using the prefix defined above
      quoted = QUOTE_LINE_PREFIX + @message.get('message').replace(/\n/g, "\n#{QUOTE_LINE_PREFIX}") + '\n\n'

      # Set the fields for the composer open it
      @paneModel.set
        composeFields:
          class: @message.get('class')
          instance: @message.get('instance')
          recipient: ''
          content: quoted
        showCompose: true

    _applyFilter: (evt, withInstance) =>
      # Set the proper position and get the filter
      options = 
        filters: 
          class_key: @message.get('class')
        position: @message.get('id')
        posScroll: @$el.offset().top

      if withInstance
        options.filters.instance_key = @message.get('instance')

      # If holding alt, create a new pane and kill the event.
      # We don't want the event bubbling up to selecting this pane.
      if evt.altKey
        @session.addPane options
        evt.preventDefault()
        evt.stopPropagation()
      else
        @paneModel.set options

    _filterClass: (evt) =>
      @_applyFilter(evt, false)

    _filterInstance: (evt) =>
      @_applyFilter(evt, true)
