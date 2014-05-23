do ->
  # TODO: determine this dynamically based on window size and adjust accordingly.
  MAX_PANES_ON_SCREEN = 3

  class com.roost.MessagePane extends Backbone.View
    className: 'message-pane'

    events:
      'click .message-pane-view': '_setSelectionOnClick'

    initialize: (options) =>
      @session = options.session
      @messageLists = options.messageLists
      @settingsModel = @session.settingsModel

      # When a model is added to the list (courtesy of the session),
      # add a new view to the DOM as well.
      @listenTo @messageLists, 'add', @_addPaneView
      @listenTo @messageLists, 'remove', @_removePaneView

      # Since we handle panes, pane selection, and keyboard shortcuts,
      # listen for any settings changes and act accordingly
      @listenTo @settingsModel, 'change:keyboard', @_toggleKeyboard
      @listenTo @settingsModel, 'change:panes', @_togglePanes

      # Hotkeys that will either move the selection or only affect
      # the selected pane.
      Mousetrap.bind('left', (=> @_moveSelection(1)))
      Mousetrap.bind('right', (=> @_moveSelection(-1)))
      Mousetrap.bind('>', @_sendPaneToBottom)

    render: =>
      @$el.empty()
      @childViews = []
      @selectedPosition = 0

      for paneModel in @messageLists.models
        @_addPaneView(paneModel)

      if @childViews.length > 0
        @_setSelection()

    _toggleKeyboard: =>
      # Pause or unpause hotkeys.
      # Requires moving the selection around since the pane selection concept
      # goes away when the keyboard shortcuts are turned off.
      if @settingsModel.get('keyboard')
        Mousetrap.unpause()
        @_setSelection()
      else
        Mousetrap.pause()
        for view in @childViews
          view.model.set('selected', true)

    _togglePanes: =>
      # TODO: as always, stop doing this in the session.
      # This is a pretty ass-backwards way of doing this.
      if !@settingsModel.get('panes') and @childViews.length > 1
        for i in [@childViews.length-1..1]
          @session.removePane(@childViews[i].model.cid)

    _setSelectionOnClick: (evt) =>
      # Set the selection to a pane if that pane has received a click event
      @selectedPosition = @$('.message-pane-view').index(evt.currentTarget)
      @_setSelection()

    _moveSelection: (diff) =>
      # Keep our selected position within proper bounds.
      # TODO: can underscore clamp a value?
      @selectedPosition = @selectedPosition - diff
      @selectedPosition = Math.min(@selectedPosition, @childViews.length - 1)
      @selectedPosition = Math.max(@selectedPosition, 0)

      @_setSelection()

    _setSelection: =>
      selectedView = @childViews[@selectedPosition]

      # If we actually have a selected view, make sure to set the model and move the scroll
      if selectedView?
        for view in @childViews
          view.model.set('selected', false)
        selectedView.model.set('selected', true)
        offset = selectedView.$el.offset().left
        width = selectedView.$el.width()
        if offset < 0
          @$el.scrollLeft(@$el.scrollLeft() + offset)
        else if (offset + width) > @$el.width()
          @$el.scrollLeft(@$el.scrollLeft() + (offset + width - @$el.width()))

    _sendPaneToBottom: =>
      @childViews[@selectedPosition].model.set('position', null)
      @childViews[@selectedPosition].model.trigger 'reload'
      
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

      @_moveSelection(-1 * @childViews.length)

    _removePaneView: (model) =>
      # TODO: this still causes scroll issues, even with caching/restoring on width changes
      for view in @childViews
        if view.model.cid == model.cid
          toDelete = view
      toDelete.remove()
      @childViews = _.reject(@childViews, ((view) => view.cid == toDelete.cid))
      @_recalculateWidth()

      # Turn off the model
      model.off()

      # Move the selection off this model
      if model.get('selected')
        @_moveSelection(1)

      # Show a no-panes message if there are no panes
      if @messageLists.length == 0
        @$el.append($('<div class="no-panes">').text('Click "New Pane" above to start browsing your messages.'))

    _recalculateWidth: =>
      # Tell all the child views to recalculate their width
      width = Math.max(Math.floor(100/@childViews.length), Math.floor(100/MAX_PANES_ON_SCREEN))
      index = 0
      for view in @childViews
        view.recalculateWidth index, width
        index += 1