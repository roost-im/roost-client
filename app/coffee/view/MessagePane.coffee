do ->
  class com.roost.MessagePane extends Backbone.View
    className: 'message-pane'

    initialize: (options) =>
      @messageLists = options.messageLists
      @childViews = []

      @listenTo @messageLists, 'add', @_addPaneView

    render: =>
      @$el.empty()
      for paneModel in @messageLists.models
        @_addPaneView(paneModel)
      
    _addPaneView: (paneModel) =>
      paneView = new com.roost.MessagePaneView
        model: paneModel
      @childViews.push(paneView)

      paneView.render()
      @$el.append(paneView.$el)
      @_recalculateWidth()

      # Jank. Gotta jump the scrolling after first set of messages are in.
      paneView.$el.scrollTop(paneView.$el[0].scrollHeight)
      @listenTo paneModel, 'messagesSet', (=> 
        paneView.$el.scrollTop(paneView.$el[0].scrollHeight)
      )

    _recalculateWidth: =>
      width = Math.floor(100/@childViews.length)
      index = 0
      for view in @childViews
        view.recalculateWidth index, width
        index += 1