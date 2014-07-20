do ->
  # childViews goes from top to bottom
  # DOM goes from top to bottom

  RUNWAY = 1000

  com.roost.STARK_LIMIT = moment.duration(3, 'h')

  class com.roost.MessagePaneView extends Backbone.View
    className: 'message-pane-view'

    initialize: (options) =>
      # Pane model
      @model = options.model

      # Roost session
      @session = options.session

      # Keep track of all subviews we make to avoid memory leaks
      @childViews = []

      # We know that resets and adds are messages that need to be rendered
      # Cache cleanups on non-rendered stuff can be ignored
      # Thus, no handling of the 'remove' event
      @listenTo @model.get('messages'), 'reset', @render
      @listenTo @model.get('messages'), 'batchAdd', @_addMessages

      @listenTo @model, 'change:topLoading change:topDone change:loaded', (=> @_updateNotify('top'))
      @listenTo @model, 'change:bottomLoading, change:bottomDone change:loaded', (=> @_updateNotify('bottom'))
      @listenTo @model, 'change:loaded', @_toggleLoaded

      @listenTo @model, 'change:showCompose change:showFilters', @_setPersist

      # Redraw if our selected position changes
      @listenTo @model, 'change:position', @_updatePosition

      # Throttled scroll handle to avoid firing every event
      # Improves framerate drastically
      @throttled = _.throttle(@_scrollHandle, 50)

      # Do this at the pane level instead of message level since otherwise you're
      # spawning/deleting a ton of intervals with each scroll.
      @interval = setInterval(@_updateMessageTimes, 30000)

      # Starting index and width of view (as %)
      @index = 0
      @width = 100

    render: =>
      # Clear out old views
      for view in @childViews
        view.remove()

      # Empty everything just to be sure
      @$el.empty()
      @childViews = []

      @$inner = $('<div class="message-pane-view-inner">').appendTo(@$el)
      @$inner.scroll(@throttled)

      # Add MessageView for each message in the list
      for message in @model.get('messages').models
        view = new com.roost.MessageView
          message: message
          paneModel: @model
          session: @session
        view.render()
        @$inner.append(view.$el)
        @childViews.push(view)

      @$inner.prepend('<div class="notify top">')
      @$inner.append('<div class="notify bottom">')
      @$inner.append('<div class="filler-view">')

      # If we didn't get any messages this time around, then show something informative
      if @model.get('messages').length == 0
        if @model.get('loaded')
          $noMessages = $('<div class="no-messages">').text('No messages')
          @$inner.prepend($noMessages)
        else
          $loading = $('<div class="loading">')
          $loading.append('<i class="fa fa-circle-o-notch fa-spin"></i>')
          @$inner.prepend($loading)
      # Otherwise, get our scroll position right
      else
        if @model.get('position')?
          $positionMessage = @$('.positioned')
          @$inner.scrollTop(@$inner.scrollTop() +
            ($positionMessage.offset().top - @model.get('posScroll')))
        else
          @$inner.scrollTop(@$inner[0].scrollHeight)

      # Mark off which subsection of the cache we are currently showing
      @currentTop = 0
      @currentBottom = @model.get('messages').length + 2

      # Create the message composing view
      @composeView = new com.roost.ComposeBar
        paneModel: @model
        uiState: @session.uiStateModel
        session: @session
      @composeView.render()
      @$el.append @composeView.$el

      # Create the filter view
      @filterView = new com.roost.FilterBar
        paneModel: @model
        session: @session
      @filterView.render()
      @$el.append @filterView.$el

      @_updateNotify('bottom')
      @_updateNotify('top')

    remove: =>
      # Clear out compose and filter
      @composeView.remove()
      @filterView.remove()

      # Stop updating times
      clearInterval(@interval)

      # Remove all the messages
      for view in @childViews
        view.remove()

      # Clean ourselves up
      @undelegateEvents()
      @stopListening()
      @$el.removeData().unbind()
      super
      delete @$el
      delete @el

    moveSelectedMessage: (diff) =>
      # If we already have a message selected, check if it's visible.
      # If it isn't, this chunk fails and we select the highest or lowest
      # visible message.
      if @model.get('position')?
        selectedIndex = @_getSelectedViewIndex()
        selectedView = @childViews[selectedIndex]

        # The selected view may have moved off screen by now and not be
        # in the childViews array any more
        if selectedView?
          $view = selectedView.$el
          bottomPoint = $view.offset().top + $view.height()
          topPoint = $view.offset().top - 80  # correct for top bars

          # Check if either the top or bottom point of the view are within the pane
          if (topPoint < @$inner.height() and topPoint > 0) or (bottomPoint > 0 and bottomPoint < @$inner.height())
            newIndex = Math.min(Math.max(selectedIndex + diff, 0), @childViews.length-1)  # clamp the index
            newSelectedView = @childViews[newIndex]
            @model.set('position', newSelectedView.message.get('id'))
            @_setScrollForSelectedMessage(newSelectedView)
            return

      # Going up, so start from the bottom
      if diff < 0
        for i in [@childViews.length - 1..0]
          selectedView = @childViews[i]
          $view = selectedView.$el
          bottomPoint = $view.offset().top + $view.height()
          if bottomPoint < @$inner.height()
            @model.set 'position', selectedView.message.get('id')
            break
      # Otherwise, going down, so start from the top
      else
        for i in [0..@childViews.length - 1]
          selectedView = @childViews[i]
          $view = selectedView.$el
          topPoint = $view.offset().top - 80  # correct for top bars
          if topPoint > 0
            @model.set 'position', selectedView.message.get('id')
            break

      @_setScrollForSelectedMessage(selectedView)

    _setScrollForSelectedMessage: (selectedView) =>
      # Shift the scrolling such that the selected message is always
      # in view and completely readable.
      $view = selectedView.$el
      bottomPoint = $view.offset().top + $view.height()
      topPoint = $view.offset().top - 80  # correct for top

      if topPoint < 0
        scrollDiff = 70 - topPoint
      else if bottomPoint > @$inner.height()
        scrollDiff = (@$inner.height() - 70) - bottomPoint
      else
        return

      @$inner.scrollTop(@$inner.scrollTop() - scrollDiff)

    selectedMessageReply: =>
      view = @childViews[@_getSelectedViewIndex()]
      view?.openReplyBox()

    selectedMessageQuote: =>
      view = @childViews[@_getSelectedViewIndex()]
      view?.openQuoteBox()

    selectedMessagePM: =>
      view = @childViews[@_getSelectedViewIndex()]
      view?.openMessageBox()

    selectedMessageFilter: (withInstance) =>
      view = @childViews[@_getSelectedViewIndex()]
      view?.filter(withInstance)

    _getSelectedViewIndex: =>
      if @model.get('position')?
        for i in [0..@childViews.length - 1]
          view = @childViews[i]
          if view.message.get('id') == @model.get('position')
            return i

      return -1

    _updatePosition: =>
      # Delegate this down to the view level
      for view in @childViews
        view.updatePosition()

      # Check and make sure we get more messages available
      @_scrollHandle()

    _updateMessageTimes: =>
      for view in @childViews
        view.updateTime()

    _scrollHandle: (evt) =>
      messages = @model.get('messages').models

      # Instead of dealing with race conditions regarding filter changes while someone keeps
      # scrolling, block off further scrolling from happening while loading a new message set.
      # Similarly, don't allow scrolling when there aren't any messages. It looks ugly.
      if messages.length == 0 or !@model.get('loaded')
        evt?.preventDefault()
        evt?.stopPropagation()
        return

      # Get the relevant points for scroll checking
      bottomView = @childViews[@childViews.length - 1]
      bottomPoint = bottomView.$el.offset().top + bottomView.$el.height()
      topPoint = @childViews[0].$el.offset().top

      # Check if we need more messages above
      if topPoint * -1 < RUNWAY
        # Check if we have any more messages in our cache
        if @currentTop > 0
          limit = Math.max(@currentTop - com.roost.EXPANSION_SIZE, 0)
          newMessages = messages.slice(limit, @currentTop).reverse()
          @_saveScrollHeight()
          for message in newMessages
            @_prependMessage(message)
          @_restoreScrollHeight()

          # Need the if statement because [1..0] is [1, 0].
          if newMessages.length
            for message in [1..newMessages.length]
              @_removeBottomMessage()

        # Trigger the scrollup if we're at the top, the top isn't done, and we aren't currently
        # loading more messages at the top.
        else if @currentTop <= 0 and !@model.get('topDone') and !@model.get('topLoading')
          @model.trigger 'scrollUp'
      
      # Check if we need more messages below
      if bottomPoint < RUNWAY
        # Check if we have any more messages in our cache
        if @currentBottom < messages.length
          limit = Math.min(@currentBottom + com.roost.EXPANSION_SIZE, messages.length)
          newMessages = messages.slice(@currentBottom, limit)
          for message in newMessages
            @_appendMessage(message)

          @_saveScrollHeight()
          # Need the if statement because [1..0] is [1, 0].
          if newMessages.length
            for message in [1..newMessages.length]
              @_removeTopMessage()
          @_restoreScrollHeight()
        # Trigger the scrolldown if we're at the bottom, the bottom isn't done, and we
        # aren't currently loading more messages at the bottom.
        else if @currentBottom >= messages.length and !@model.get('bottomDone') and !@model.get('bottomLoading')
          @model.trigger 'scrollDown'

    _addMessages: (messages, options) =>
      # Since we're adding messages, let's get rid of these.
      @$('.no-messages').remove()
      @$('.loading').remove()

      # Check prepend vs append. Prepend is if we're adding to the start *and*
      # there were already messages (i.e., the user didn't just go to the
      # start.)
      if options.at == 0 && @model.get('messages').length != messages.length
        # The messages are oldest-first, so we reverse them so they're prepended
        # in the right order.
        messages.reverse()
        @_saveScrollHeight()
        for message in messages
          @_prependMessage(message)
        @_restoreScrollHeight()

        # Start clearing stuff out if we're past our proper size
        while @childViews.length > com.roost.STARTING_SIZE
          @_removeBottomMessage()
      else
        for message in messages
          # Awkward way of avoiding adding live messages when we are not at
          # the actual bottom.
          if @currentBottom >= @model.get('messages').length - messages.length
            @_appendMessage(message)

        @_saveScrollHeight()
        for message in messages
          # Start clearing stuff out if we're past our proper size
          if @childViews.length > com.roost.STARTING_SIZE
            @_removeTopMessage()
        @_restoreScrollHeight()

    _appendMessage: (message) =>
      if @childViews[@childViews.length - 1]?
        @_checkStark(@childViews[@childViews.length - 1].message, message)

      # Add the next message before the filler view
      view = new com.roost.MessageView
        message: message
        paneModel: @model
        session: @session
      view.render()
      @$('.notify.bottom').before(view.$el)

      # Store the view for update/cleanup later
      @childViews.push(view)

      # Bump the current bottom point in the cache
      @currentBottom = Math.min(@currentBottom + 1, @model.get('messages').length)

    _prependMessage: (message) =>
      # Save off old scroll height
      if @childViews[0]?
        @_checkStark(message, @childViews[0].message)

      # Add new view to the top
      view = new com.roost.MessageView
        message: message
        paneModel: @model
        session: @session
      view.render()
      @$('.notify.top').after(view.$el)

      # Store the view for update/cleanup later
      @childViews.unshift(view)

      # Update the current top point in the cache
      @currentTop = Math.max(@currentTop - 1, 0)

    _removeTopMessage: =>
      # Remove the view
      view = @childViews.shift()
      view.remove()

      # Move current top point for cache
      @currentTop = @currentBottom - @childViews.length

    _removeBottomMessage: =>
      view = @childViews.pop()
      view.remove()
      @currentBottom = @currentTop + @childViews.length

    _saveScrollHeight: =>
      @cachedHeight = @$inner[0].scrollHeight

    _restoreScrollHeight: =>
      newHeight = @$inner[0].scrollHeight
      change = @cachedHeight - newHeight
      @$inner.scrollTop(@$inner.scrollTop() - change)

    _updateNotify: (which) =>
      $notify = @$(".notify.#{which}")
      $notify.empty()

      # If we're loaded and not done yet, just make this always say loading.
      if @model.get('loaded') and not @model.get("#{which}Done")
        $notify.text('Loading...')

    _setPersist: =>
      # Don't let this pane fade completely if compose or fitlers are open
      if @model.get('showCompose') or @model.get('showFilters')
        @$inner.addClass('persist')
      else
        @$inner.removeClass('persist')

    _toggleLoaded: =>
      if !@model.get('loaded')
        @$inner.addClass('not-loaded')
      else
        @$inner.removeClass('not-loaded')

    _checkStark: (olderMessage, newerMessage) =>
      difference = newerMessage.get('time').valueOf() - olderMessage.get('time').valueOf()
      if difference > com.roost.STARK_LIMIT.valueOf()
        newerMessage.set('stark', moment.duration(difference))
