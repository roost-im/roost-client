do ->
  com.roost.STARTING_SIZE = 40
  com.roost.EXPANSION_SIZE = 10

  # Uhhhhh fuck
  class com.roost.MessagePaneController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @model = options.model
      @api = options.api

      @messageModel = new MessageModel(@api)

      # Listen to events on the model
      @listenTo @model, 'scrollUp', @onScrollUp

    fetchFromBottom: =>
      # Fetches the first set of data from the bottom of the list
      @reverseTail = @messageModel.newReverseTail(null, @model.get('filters'), @addMessagesToEndOfModel)
      @reverseTail.expandTo(com.roost.STARTING_SIZE)

    onPositionJump: =>
      # Handles fetching a new set of data on a position jump
      return

    onScrollUp: =>
      # Handles building the reverse tail upward
      newSize = @model.get('messages').models.length + com.roost.EXPANSION_SIZE
      @reverseTail.expandTo(newSize)

    onScrollDown: =>
      # Handles building the tail down
      return

    onNewMessages: =>
      # Handles new messages arriving live
      return

    onFilterChange: =>
      # Handles updating the list when the filters have changed
      return

    addMessagesToEndOfModel: (msgs, isDone) =>
      @model.set 'isDone', isDone
      messages = @model.get 'messages'
      if messages.models.length == 0
        messages.reset msgs
      else
        for message in msgs.slice(0).reverse()
          messages.add message, {at: 0}

    addMessageToStartOfModel: (msgs, isDone) =>
      return