do ->
  TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a'
  QUOTE_LINE_PREFIX = '> '

  class com.roost.MessageView extends Backbone.View
    className: 'message-view'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .reply"] = 'openReplyBox'
      eventsHash["#{com.roost.CLICK_EVENT} .pm"] = 'openMessageBox'
      eventsHash["#{com.roost.CLICK_EVENT} .quote"] = 'openQuoteBox'
      eventsHash["#{com.roost.CLICK_EVENT} .msg-class"] = '_filterClass'
      eventsHash["#{com.roost.CLICK_EVENT} .msg-instance"] = '_filterInstance'
      eventsHash["#{com.roost.CLICK_EVENT} .chat-header"] = '_filterConversation'
      return eventsHash

    initialize: (options) =>
      @message = options.message
      @paneModel = options.paneModel
      @session = options.session

      # One might think of listening to @message for some events, or even
      # @paneModel for events, but that's a bad idea in general. These views
      # get created and disposed of quickly, so there's a high chance of errors
      # if listeners are firing in here. Even with proper cleanup, it gets bad.
      # Therefore, all listening to stuff is delegated to the parent view, which
      # then calls into this view to do updates and such.

    render: =>
      @$el.empty()
      template = com.roost.templates['MessageView']

      # Get the gravatar for the user
      name = shortZuser(@message.get('sender'))
      realm = zuserRealm(@message.get('sender'))
      gravatar = getGravatarFromName(name, realm, 80)

      # Check if the user sent it
      isSentByUser = @message.get('sender') == @session.userInfo.get('username') + '@' + @session.userInfo.get('realm')
      isSentByUser = @message.get('isOutgoing') or isSentByUser

      # Some people have signatures like ") (foo" which assumes the zsig is
      # surrounded in parentheses.
      signature = @message.get('signature')
      if (/^[^(]*\).*\([^)]*$/.test(signature))
        signature = "(" + signature + ")"

      # Check if this is a personal message, and if so, save the convo partner
      if @message.get('isPersonal')
        convoPartner = shortZuser(@message.get('conversation'))

      # TODO: move some of this to handlebars helpers
      @$el.append template(_.defaults(signature: signature, @message.attributes,
          absoluteTime: @message.get('time').format(TIME_FORMAT)
          shortSender: name
          gravatar: gravatar
          isSentByUser: isSentByUser
          convoPartner: convoPartner
        )
      )

      # TODO: figure out why ztext parsing isn't working
      # Chosen to use linkify library and get links, since at least that should work.
      # Ztext parsing doesn't seem to get that even.
      # @$('.message').empty()
      # ztextToDOM(@message.get('message'), @$('.message')[0])
      @$('.message').linkify()

      # jQuery linkify was supposed to do this but for some reason is failing.
      @$('a').attr
        target: '_blank'
        tabindex: -1

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
      string = @message.get('classKey')
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
      recip = if @message.get('isPersonal') then @message.get('conversation') else '' 

      @paneModel.set
        composeFields:
          class: @message.get('class')
          instance: @message.get('instance')
          recipient: recip
          content: ''
        showCompose: true

      if @session.settingsModel.get('onMobile')
        @session.settingsModel.set('showNavbar', false)

    openMessageBox: =>
      recip = if @message.get('isPersonal') then @message.get('conversation') else @message.get('sender')

      # Fill in proper fields and open the compose box
      @paneModel.set
        composeFields:
          class: 'message'
          instance: 'personal'
          recipient: recip
          content: ''
        showCompose: true

      if @session.settingsModel.get('onMobile')
        @session.settingsModel.set('showNavbar', false)

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

      if @session.settingsModel.get('onMobile')
        @session.settingsModel.set('showNavbar', false)

    _applyFilter: (evt, options) =>
      # If holding alt, create a new pane and kill the event.
      # We don't want the event bubbling up to selecting this pane.
      if evt.altKey
        @session.addPane options
        evt.preventDefault()
        evt.stopPropagation()
      else
        @paneModel.set options

    _filterClass: (evt) =>
      options = 
        filters: 
          class_key_base: @message.get('classKeyBase')
        position: @message.get('id')
        posScroll: @$el.offset().top
      @_applyFilter(evt, options)

    _filterInstance: (evt) =>
      options = 
        filters: 
          class_key_base: @message.get('classKeyBase')
          instance_key_base: @message.get('instanceKeyBase')
        position: @message.get('id')
        posScroll: @$el.offset().top
      @_applyFilter(evt, options)

    _filterConversation: (evt) =>
      # Include class and instance so the filter bar coloring code doesn't
      # get yet another control flow change.
      options = 
        filters:
          class_key_base: @message.get('classKeyBase')
          instance_key_base: @message.get('instanceKeyBase')
          conversation: @message.get('conversation')
        position: @message.get('id')
        posScroll: @$el.offset().top
      @_applyFilter(evt, options)

