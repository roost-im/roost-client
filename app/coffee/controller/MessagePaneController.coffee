do ->
  com.roost.STARTING_SIZE = 40
  com.roost.EXPANSION_SIZE = 10
  com.roost.CACHE_SIZE = 200

  # Uhhhhh fuck
  class com.roost.MessagePaneController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @model = options.model
      @api = options.api

      @messageModel = new MessageModel(@api)

      # Listen to events on the model
      @listenTo @model, 'scrollUp', @onScrollUp
      @listenTo @model, 'scrollDown', @onScrollDown

      @lastReverseStep = 0
      @lastForwardStep = 0

    fetchFromBottom: =>
      # Fetches the first set of data from the bottom of the list
      @reverseTail = @messageModel.newReverseTail(null, @model.get('filters'), @addMessagesToTopOfList)
      @reverseTail.expandTo(com.roost.STARTING_SIZE)
      @lastReverseStep = com.roost.STARTING_SIZE

    onPositionJump: =>
      # Handles fetching a new set of data on a position jump
      return

    onScrollUp: =>
      # Handles building the reverse tail upward
      @lastReverseStep += com.roost.EXPANSION_SIZE
      @reverseTail.expandTo(@lastReverseStep)

    onScrollDown: =>
      @lastForwardStep += com.roost.EXPANSION_SIZE
      @forwardTail.expandTo(@lastForwardStep)

    onFilterChange: =>
      # Handles updating the list when the filters have changed
      return

    addMessagesToTopOfList: (msgs, isDone) =>
      @model.set 'isTopDone', isDone
      messages = @model.get 'messages'

      # If this is our first time populating the list, reset
      # Also create the forward tail.
      if messages.models.length == 0
        messages.reset msgs
        @forwardTail = @messageModel.newTailInclusive(msgs[msgs.length - 1].id, @model.get('filters'), @addMessagesToBottomOfList)
      else
        if messages.length >= com.roost.CACHE_SIZE
          @clearBottomOfCache(msgs.length)
        for message in msgs.slice(0).reverse()
          messages.add message, {at: 0}

    addMessagesToBottomOfList: (msgs, isDone) =>
      @model.set 'isBottomDone', isDone
      messages = @model.get 'messages'

      if messages.length >= com.roost.CACHE_SIZE
        @clearTopOfCache(msgs.length)
      for message in msgs.slice(0)
        messages.add message, {at: messages.length}

    clearTopOfCache: (length) =>
      messages = @model.get 'messages'
      for i in [0..length-1]
        messages.shift()
      @reverseTail = @messageModel.newReverseTail(messages.at(0).id, @model.get('filters'), @addMessagesToTopOfList)
      @model.set 'isTopDone', false
      @lastReverseStep = 0

    clearBottomOfCache: (length) =>
      messages = @model.get 'messages'
      for i in [0..length-1]
        messages.pop()
      @forwardTail = @messageModel.newTailInclusive(messages.at(messages.length - 1).id, @model.get('filters'), @addMessagesToBottomOfList)
      @model.set 'isBottomDone', false
      @lastForwardStep = 0