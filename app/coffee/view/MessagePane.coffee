do ->
  class com.roost.MessagePane extends Backbone.View
    className: 'message-pane'

    initialize: (options) =>
      @session = options.session
      @messageLists = options.messageLists
      @childViews = []

      @listenTo @messageLists, 'add', @_addPaneView
      @listenTo @messageLists, 'remove', @_removePaneView

    render: =>
      @$el.empty()

      for paneModel in @messageLists.models
        @_addPaneView(paneModel)
      
    _addPaneView: (paneModel) =>
      @$('.no-panes').remove()

      paneView = new com.roost.MessagePaneView
        session: @session
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

    _removePaneView: (model) =>
      for view in @childViews
        if view.model.cid == model.cid
          toDelete = view

      toDelete.remove()
      @childViews = _.reject(@childViews, ((view) => view.cid == toDelete.cid))

      model.off()

      @_recalculateWidth()

      if @messageLists.length == 0
        @$el.append($('<div class="no-panes">').text('Click "New Pane" above to start browsing your messages.'))

    _recalculateWidth: =>
      width = Math.floor(100/@childViews.length)
      index = 0
      for view in @childViews
        view.recalculateWidth index, width
        index += 1