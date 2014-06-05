do ->

  # Arbitrarily chosen. Modify if interested in performance issues.
  # Cache = Backbone Collection in Pane Model
  com.roost.STARTING_SIZE = 40
  com.roost.EXPANSION_SIZE = 10
  com.roost.CACHE_SIZE = 200

  # For each tail, you have:
  #  The actual tail
  #  The step we've moved thus far
  # Whenever a tail gets expanded/closed/recreated, set the step properly.
  # Whenever a tail is recreated, close the previous one.

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
      @listenTo @model, 'scrollUp', @_onScrollUp
      @listenTo @model, 'scrollDown', @_onScrollDown
      @listenTo @model, 'reload change:filters', @fetchFromPosition
      @listenTo @model, 'toTop', @_jumpToTop

      # Keep track of how far we've moved the tails up/down
      # This is kind of awkward but necessary state tracking
      @lastReverseStep = 0
      @lastForwardStep = 0

    fetchFromPosition: =>
      # Fetches the first set of data from our starting point
      # We go upward first then build a bit downward
      # Inefficient, but simplifies things.
      @model.set
        topLoading: true
        loaded: false

      @reverseTail?.close()
      @lastReverseStep = 0

      # Lord have mercy.
      # We make a forward tail briefly to figure out the right position for a reverse tail.
      # This is entirely because there is no reverseTailInclusive and this design builds reverse, then forward
      # in order to reset.
      if @model.get('position') != null
        @tempForwardTail = @messageModel.newTailInclusive(@model.get('position'), @model.get('filters'), @_properStartCb)
        @tempForwardTail.expandTo(2)
      else
        @reverseTail = @messageModel.newReverseTail(@model.get('position'), @model.get('filters'), @addMessagesToTopOfList)
        @reverseTail.expandTo(com.roost.STARTING_SIZE)
        @lastReverseStep = com.roost.STARTING_SIZE

    _properStartCb: (msgs, isDone) =>
      if msgs.length == 1
        start = null
      else
        start = msgs[1].id
      @reverseTail = @messageModel.newReverseTail(start, @model.get('filters'), @addMessagesToTopOfList)
      @reverseTail.expandTo(com.roost.STARTING_SIZE)
      @lastReverseStep = com.roost.STARTING_SIZE

      @tempForwardTail.close()

    _onScrollUp: =>
      # Handles building the reverse tail upward
      @model.set('topLoading', true)
      @lastReverseStep += com.roost.EXPANSION_SIZE
      @reverseTail.expandTo(@lastReverseStep)

    _onScrollDown: =>
      # Handles building the forward tail downward
      @model.set('bottomLoading', true)
      @lastForwardStep += com.roost.EXPANSION_SIZE
      @forwardTail.expandTo(@lastForwardStep)

    _jumpToTop: =>
      # Reset the important bits
      @model.set
        topLoading: false
        loaded: false
        bottomLoading: true
        topDone: true

      # Close the reverse tail
      @reverseTail?.close()
      @lastReverseStep = 0

      # Create a new forward tail. null start for forward is the top.
      @forwardTail?.close()
      @forwardTail = @messageModel.newTail(null, @model.get('filters'), @addMessagesToBottomOfList)
      @forwardTail.expandTo(com.roost.STARTING_SIZE)
      @lastForwardStep = com.roost.STARTING_SIZE

    addMessagesToTopOfList: (msgs, isDone) =>
      @model.set
        topDone: isDone
        topLoading: false
      messages = @model.get 'messages'

      # Let's make our times more friendly
      @_processMesssages(msgs)

      # If this is our first time populating the list, reset
      # Also create the forward tail.
      if not @model.get('loaded')
        @model.set('loaded', true)
        messages.reset msgs

        # Forward tail to get messages going downward (more recent).
        # Must be created after reset because starting ID is the latest message.
        @lastForwardStep = 0
        if msgs.length == 0
          # Special case for handling when there are no messages to show: both top and bottom done
          @model.set 'bottomDone', true
          @forwardTail?.close()
          @forwardTail = @messageModel.newTail(null, @model.get('filters'), @addMessagesToBottomOfList)
        else
          @forwardTail?.close()
          @forwardTail = @messageModel.newTail(msgs[msgs.length - 1].id, @model.get('filters'), @addMessagesToBottomOfList)

        # Trigger this to expand the forward tail downward a little ways, to give some
        # messages on the bottom.
        @lastForwardStep += 10
        @forwardTail.expandTo(@lastForwardStep)
      else
        # If we are at our cache size, reduce the size of our cache
        # by as many messages as we just received.
        if messages.length >= com.roost.CACHE_SIZE
          @_clearBottomOfCache(msgs.length)

        # Add all the messages in (reversed because reverse tail)
        # Messages are added to the START of our list
        for message in msgs.slice(0).reverse()
          messages.add message, {at: 0}

    addMessagesToBottomOfList: (msgs, isDone) =>
      # This means we have a live message
      if @model.get('bottomDone') and isDone
        @lastForwardStep += 1
        @forwardTail.expandTo(@lastForwardStep)
        live = true

      @model.set 
        bottomDone: isDone
        bottomLoading: false
      messages = @model.get 'messages'

      # Let's make our times more friendly
      @_processMesssages(msgs)

      # If we are at our cache size, reduce the size of our cache
      # by as many messages as we just received.
      if messages.length >= com.roost.CACHE_SIZE
        # If this is a live message, we really don't want to add it to our list when the cache
        # is full. This will give us a jump in time in our messages in the cache.
        if live
          return
        else
          @_clearTopOfCache(msgs.length)

      # If we aren't loaded yet, let's clear our messages out.
      # We don't reset with our messages since it will jump the scrolling down.
      # TODO: stop that from happening.
      if not @model.get('loaded')
        @model.set('loaded', true)
        messages.reset []

      # Add all the messages in correct order to the END of our list
      for message in msgs.slice(0)
        messages.add message, {at: messages.length}

    _clearTopOfCache: (length) =>
      # Take a message off the top (beginning of our list)
      messages = @model.get 'messages'
      for i in [0..length-1]
        oldMsg = messages.shift()
        oldMsg.off()

      # Bump down our upward tail to the new starting point and reset upward state
      @reverseTail?.close()
      @reverseTail = @messageModel.newReverseTail(messages.at(0).id, @model.get('filters'), @addMessagesToTopOfList)
      @model.set 'topDone', false
      @lastReverseStep = 0

    _clearBottomOfCache: (length) =>
      # Take a message off the bottom (end of our list)
      messages = @model.get 'messages'
      for i in [0..length-1]
        oldMsg = messages.pop()
        oldMsg.off()

      # Bump up our downward tail to the latest message and reset downward state
      @forwardTail?.close()
      @forwardTail = @messageModel.newTail(messages.at(messages.length - 1).id, @model.get('filters'), @addMessagesToBottomOfList)
      @model.set 'bottomDone', false
      @lastForwardStep = 0

    _processMesssages: (msgs) =>
      # Makes times friendly
      lastMessage = null
      for message in msgs
        message.time = moment(message.time)

        # Get all the starks we can with this batch.
        # Doesn't catch live starks or between batch starks - that's currently
        # tacked onto the MessagePaneView >_>.
        if lastMessage?
          if lastMessage.time.isBefore(message.time)
            difference = message.time.valueOf() - lastMessage.time.valueOf()
            if difference > com.roost.STARK_LIMIT.valueOf()
              message.stark = moment.duration(difference)
          else
            difference = lastMessage.time.valueOf() - message.time.valueOf()
            if difference > com.roost.STARK_LIMIT.valueOf()
              lastMessage.stark = moment.duration(difference)
        lastMessage = message
