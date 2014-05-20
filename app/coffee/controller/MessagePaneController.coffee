do ->

  # Arbitrarily chosen. Modify if interested in performance issues.
  # Cache -> Backbone Collection in Pane Model
  com.roost.STARTING_SIZE = 40
  com.roost.EXPANSION_SIZE = 10
  com.roost.CACHE_SIZE = 200

  class com.roost.MessagePaneController
    constructor: (options) ->
      $.extend @, Backbone.Events

      # Message pane model
      @model = options.model

      # API singleton from the session
      @api = options.api

      # Poorly named "MessageModel", made to create MessageTails
      @messageModel = new MessageModel(@api)

      # Listen to events on the model
      @listenTo @model, 'scrollUp', @onScrollUp
      @listenTo @model, 'scrollDown', @onScrollDown
      @listenTo @model, 'toBottom', @fetchFromBottom

      # Keep track of how far we've moved the tails up/down
      @lastReverseStep = 0
      @lastForwardStep = 0

    fetchFromBottom: =>
      # Fetches the first set of data from the bottom of the list
      # Reverse tail with null start will give messages from the bottom up
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
      # Handles building the forward tail downward
      @lastForwardStep += com.roost.EXPANSION_SIZE
      @forwardTail.expandTo(@lastForwardStep)

    onFilterChange: =>
      # Handles updating the list when the filters have changed
      return

    addMessagesToTopOfList: (msgs, isDone) =>
      @model.set 'isTopDone', isDone
      messages = @model.get 'messages'

      # Let's make our times more friendly
      for message in msgs
        message.time = moment(message.time)

      # If this is our first time populating the list, reset
      # Also create the forward tail.
      if not @model.get('loaded')
        @model.set('loaded', true)
        messages.reset msgs

        # Forward tail to get messages going downward (more recent).
        # Must be created after reset because starting ID is the latest message.
        if msgs.length == 0
          # Special case for handling when there are no messages to show
          @model.set 'isBottomDone', true
          @forwardTail = @messageModel.newTailInclusive(null, @model.get('filters'), @addMessagesToBottomOfList)
        else
          @forwardTail = @messageModel.newTailInclusive(msgs[msgs.length - 1].id, @model.get('filters'), @addMessagesToBottomOfList)

        # FIXME: for some reason, live messages only work if this is triggered once.
        @onScrollDown()
      else
        # If we are at our cache size, reduce the size of our cache
        # by as many messages as we just received.
        if messages.length >= com.roost.CACHE_SIZE
          @clearBottomOfCache(msgs.length)

        # Add all the messages in (reversed because reverse tail)
        # Messages are added to the START of our list
        for message in msgs.slice(0).reverse()
          messages.add message, {at: 0}

    addMessagesToBottomOfList: (msgs, isDone) =>
      @model.set 'isBottomDone', isDone
      messages = @model.get 'messages'

      # Let's make our times more friendly
      for message in msgs
        message.time = moment(message.time)
        message.message = message.message.trim()

      # If we are at our cache size, reduce the size of our cache
      # by as many messages as we just received.
      if messages.length >= com.roost.CACHE_SIZE
        @clearTopOfCache(msgs.length)

      # Add all the messages in correct order to the END of our list
      for message in msgs.slice(0)
        messages.add message, {at: messages.length}

    clearTopOfCache: (length) =>
      messages = @model.get 'messages'
      for i in [0..length-1]
        messages.shift()

      # Bump down our upward tail to the new starting point and reset upward state
      @reverseTail = @messageModel.newReverseTail(messages.at(0).id, @model.get('filters'), @addMessagesToTopOfList)
      @model.set 'isTopDone', false
      @lastReverseStep = 0

    clearBottomOfCache: (length) =>
      messages = @model.get 'messages'
      for i in [0..length-1]
        messages.pop()

      # Bump up our downward tail to the latest message and reset downward state
      @forwardTail = @messageModel.newTailInclusive(messages.at(messages.length - 1).id, @model.get('filters'), @addMessagesToBottomOfList)
      @model.set 'isBottomDone', false
      @lastForwardStep = 0