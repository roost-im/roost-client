do ->
  # childViews goes from top to bottom
  # DOM goes from top to bottom
  class com.roost.MessagePaneView extends Backbone.View
    className: 'message-pane-view'

    initialize: (options) =>
      @model = options.model

      @childViews = []

      @listenTo @model.get('messages'), 'reset', @render
      @listenTo @model.get('messages'), 'add', @_addMessages

      @throttled = _.throttle(@_scrollHandle, 50)
      @$el.scroll(@throttled)

    render: =>
      for view in @childViews
        view.remove()
      @$el.empty()
      for message in @model.get('messages').models
        view = new com.roost.MessageView
          message: message
          paneModel: @model
        view.render()
        @$el.append(view.$el)

        @childViews.push(view)

      @$el.append('<div class="filler-view">')
      @model.trigger('messagesSet')

      @currentTop = 0
      @currentBottom = @model.get('messages').length

    _scrollHandle: =>
      console.log @currentTop + ', ' + @currentBottom
      messages = @model.get('messages').models
      if @$el.scrollTop() < @$el[0].scrollHeight * 0.25
        # Check if we have any more messages to spare
        if @currentTop > 0
          limit = Math.max(@currentTop - com.roost.EXPANSION_SIZE, 0)
          for message in messages.slice(limit, @currentTop)
            @_prependMessage(message)
            @_removeBottomMessage()
            @currentBottom -= 1
        else
          @model.trigger 'scrollUp'
      else if @$el.scrollTop() > @$el[0].scrollHeight * 0.75 - @$('.filler-view').height()
        if @currentBottom < messages.length
          limit = Math.min(@currentBottom + com.roost.EXPANSION_SIZE, messages.length)
          for message in messages.slice(@currentBottom, limit)
            @_appendMessage(message)
            @_removeTopMessage()

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
      @currentBottom += 1

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
      oldHeight = @$el[0].scrollHeight
      view = @childViews.shift()
      view.undelegateEvents()
      $(view.$el).removeData().unbind()
      view.remove()
      delete view.$el
      delete view.el

      @currentTop += 1
      newHeight = @$el[0].scrollHeight
      change = oldHeight - newHeight
      @$el.scrollTop(@$el.scrollTop() - change)

    _removeBottomMessage: =>
      view = @childViews.pop()
      view.undelegateEvents()
      $(view.$el).removeData().unbind()
      view.remove()
      delete view.$el
      delete view.el