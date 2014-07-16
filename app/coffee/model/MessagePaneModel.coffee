do ->
  # The MessagePaneView does several things (such as re-scrolling) that should
  # only be done once even when multiple messages are added at a time. This
  # class supports a batchAdd event that triggers at most once per invocation of
  # .add().
  class com.roost.MessageCollection extends Backbone.Collection
    add: (models, options) ->
      super(models, options)
      if models.length == 0 or options.silent then return
      modelArray = if Array.isArray(models) then models else [models]
      prepared = (@_prepareModel(model, options) for model in modelArray)
      @trigger('batchAdd', prepared, options)

  class com.roost.MessagePaneModel extends Backbone.Model
    defaults: =>
      attrs = {
        # TODO: make this less jank
        position: null
        posScroll: 0

        messages: new com.roost.MessageCollection()

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
