do ->
  class com.roost.MessagePaneController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @model = options.model

      # Create the MessageTail objects via a MessageModel object

      # Listen to events on the model

    fetchFromBottom: =>
      # Fetches the first set of data from the bottom of the list
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