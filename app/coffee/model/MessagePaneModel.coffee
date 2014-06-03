do ->
  class com.roost.MessagePaneModel extends Backbone.Model
    defaults: =>
      attrs = {
        # TODO: make this less jank
        position: null
        posScroll: 0

        messages: new Backbone.Collection()

        showFilters: false
        filters: {}

        showCompose: false
        composeFields: {}
        sending: false

        selected: false

        topDone: false
        bottomDone: true

        loaded: false
        topLoading: false
        bottomLoading: false
      }

      attrs.messages.model = com.roost.MessageModel

      return attrs