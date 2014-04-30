do ->
  STARTING_SIZE = 50

  class com.roost.MessagePaneController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @model = options.model
      @api = options.api

      @messageModel = new MessageModel(@api)
      # Listen to events on the model

    fetchFromBottom: =>
      # Fetches the first set of data from the bottom of the list
      @reverseTail = @messageModel.newReverseTail(null, @model.get('filters'), @addMessagesToEndOfModel)
      @reverseTail.expandTo(STARTING_SIZE)
      return

    onPositionJump: =>
      # Handles fetching a new set of data on a position jump
      return

    onScrollUp: =>
      # Handles building the reverse tail upward
      return

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
      messages.reset msgs

    addMessageToStartOfModel: (msgs, isDone) =>
      return