do ->
  class com.roost.MessagePaneView extends Backbone.View
    className: 'message-pane-view'

    initialize: (options) =>
      @model = options.model

      @childViews = []

      @listenTo @model.get('messages'), 'reset', @render

    render: =>
      for view in @childViews
        view.remove()
      @$el.empty()
      for message in @model.get('messages').models
        view = new com.roost.MessageView
          message: message
          paneModel: @model
        view.render()
        @$el.append(view.$el)

        @childViews.push(view)