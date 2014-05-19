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
        composeFields: {
          klass: ''
          instance: ''
          recipient: ''
          content: ''
        }

        selected: false

        isTopDone: false
        isBottomDone: true

        loaded: false
      }

      attrs.messages.model = com.roost.MessageModel

      return attrs