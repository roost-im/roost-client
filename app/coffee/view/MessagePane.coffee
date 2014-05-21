do ->
  # TODO: determine this dynamically based on window size and adjust accordingly.
  MAX_PANES_ON_SCREEN = 3

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
      # TODO: this still causes scroll issues, even with caching/restoring on width changes
      @$('.no-panes').remove()

      paneView = new com.roost.MessagePaneView
        session: @session
        model: paneModel
      @childViews.push(paneView)

      paneView.render()
      @$el.append(paneView.$el)
      @_recalculateWidth()

      # Move our scroll rightward to the newest added pane
      @$el.scrollLeft(@$el[0].scrollWidth)

    _removePaneView: (model) =>
      # TODO: this still causes scroll issues, even with caching/restoring on width changes
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
      width = Math.max(Math.floor(100/@childViews.length), Math.floor(100/MAX_PANES_ON_SCREEN))
      index = 0
      for view in @childViews
        view.recalculateWidth index, width
        index += 1