do ->
  class com.roost.MessagePaneModel extends Backbone.Model
    defaults: =>
      attrs = {
        filters: {}
        position: null
        lastPositions: []
        messages: new Backbone.Collection()

        showFilters: false
        showCompose: false

        selected: false

        isTopDone: false
        isBottomDone: true
      }

      attrs.messages.model = com.roost.MessageModel

      return attrs