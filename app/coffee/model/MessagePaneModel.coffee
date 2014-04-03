do ->
  class com.roost.MessagePaneModel extends Backbone.Model
    defaults: =>
      filters: {}
      position: null
      lastPositions: []
      messages: new Backbone.Collection()

      showFilters: false
      showCompose: false

      selected: false