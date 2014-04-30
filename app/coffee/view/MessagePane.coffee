do ->
  class com.roost.MessagePane extends Backbone.View
    className: 'message-pane'

    initialize: (options) =>
      @messageLists = options.messageLists
      @childViews = []

      @listenTo @messageLists, 'add', @addPaneView

    render: =>
      @$el.empty()
      for paneModel in @messageLists.models
        @addPaneView(paneModel)

    addPaneView: (paneModel) =>
      paneView = new com.roost.MessagePaneView
        model: paneModel
      @childViews.push(paneView)

      paneView.render()
      @$el.append(paneView.$el)