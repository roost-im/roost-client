do ->
  # childViews goes from top to bottom
  # DOM goes from top to bottom
  class com.roost.MessagePaneView extends Backbone.View
    className: 'message-pane-view'

    initialize: (options) =>
      # Pane model
      @model = options.model

      # Keep track of all subviews we make to avoid memory leaks
      @childViews = []

      # We know that resets and adds are messages that need to be rendered
      # Cache cleanups on non-rendered stuff can be ignored
      # Thus, no handling of the 'remove' event
      @listenTo @model.get('messages'), 'reset', @render
      @listenTo @model.get('messages'), 'add', @_addMessages

      # Throttled scroll handle to avoid firing every event
      # Improves framerate drastically
      @throttled = _.throttle(@_scrollHandle, 50)
      @$el.scroll(@throttled)

    render: =>
      # Clear out old views
      for view in @childViews
        # TODO: wrap this inside of a custom View class
        view.undelegateEvents()
        $(view.$el).removeData().unbind()
        view.remove()
        delete view.$el
        delete view.el

      # Empty everything just to be sure
      @$el.empty()

      # Add MessageView for each message in the list
      for message in @model.get('messages').models
        view = new com.roost.MessageView
          message: message
          paneModel: @model
        view.render()
        @$el.append(view.$el)
        @childViews.push(view)

      # Add in the filler view
      @$el.append('<div class="filler-view">')

      # HACK: trigger that the messages are set so parent view moves scroll position.
      # Why does the parent view need to do that?
      @model.trigger('messagesSet')

      # Mark off which subsection of the list we are currently showing
      @currentTop = 0
      @currentBottom = @model.get('messages').length

    _scrollHandle: =>
      messages = @model.get('messages').models

      # Arbitrarily chosen scroll limits, as %age of message content height.
      if @$el.scrollTop() < @$el[0].scrollHeight * 0.15
        # Check if we have any more messages in our cache
        if @currentTop > 0
          limit = Math.max(@currentTop - com.roost.EXPANSION_SIZE, 0)
          for message in messages.slice(limit, @currentTop)
            @_prependMessage(message)
            @_removeBottomMessage()
        else if @currentTop <= 0 and !@model.get('isTopDone')
          @model.trigger 'scrollUp'
        else
          #TODO: show something to say top has been reached
          return
      else if @$el.scrollTop() > @$el[0].scrollHeight * 0.85 - @$('.filler-view').height()
        # Check if we have any more messages in our cache
        if @currentBottom < messages.length
          limit = Math.min(@currentBottom + com.roost.EXPANSION_SIZE, messages.length)
          for message in messages.slice(@currentBottom, limit)
            @_appendMessage(message)
            @_removeTopMessage()
        else if @currentBottom >= messages.length and !@model.get('isBottomDone')
          @model.trigger 'scrollDown'
        else
          #TODO: show something to say latest messages reached
          return

    _addMessages: (message, collection, options) =>
      if options.at == 0
        @_prependMessage(message)
        @_removeBottomMessage()
      else
        @_appendMessage(message)
        @_removeTopMessage()

    _appendMessage: (message) =>
      view = new com.roost.MessageView
        message: message
        paneModel: @model
      view.render()
      @$('.filler-view').before(view.$el)
      @childViews.push(view)

      @currentBottom = Math.min(@currentBottom + 1, @model.get('messages').length)

    _prependMessage: (message) =>
      oldHeight = @$el[0].scrollHeight
      view = new com.roost.MessageView
        message: message
        paneModel: @model
      view.render()
      @$el.prepend(view.$el)
      @childViews.unshift(view)

      @currentTop = Math.max(@currentTop - 1, 0)
      newHeight = @$el[0].scrollHeight
      change = newHeight - oldHeight
      @$el.scrollTop(@$el.scrollTop() + change)

    _removeTopMessage: =>
      # Save off old scroll height
      oldHeight = @$el[0].scrollHeight
      view = @childViews.shift()

      # TODO: wrap this inside of a custom View class
      view.undelegateEvents()
      $(view.$el).removeData().unbind()
      view.remove()
      delete view.$el
      delete view.el

      # HACK: Jump scroll height as much as the change
      # Keeps view in seemingly same location
      @currentTop = @currentBottom - @childViews.length
      newHeight = @$el[0].scrollHeight
      change = oldHeight - newHeight
      @$el.scrollTop(@$el.scrollTop() - change)

    _removeBottomMessage: =>
      view = @childViews.pop()
      
      # TODO: wrap this inside of a custom View class
      view.undelegateEvents()
      $(view.$el).removeData().unbind()
      view.remove()
      delete view.$el
      delete view.el

      @currentBottom = @currentTop + @childViews.length
