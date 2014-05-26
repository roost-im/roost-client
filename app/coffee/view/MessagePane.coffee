do ->
  # We have to enforce this here, because just doing CSS on the messages
  # neglects the filter/compose bars, which are also jankily placed.
  MIN_MESSAGE_WIDTH = 580

  class com.roost.MessagePane extends Backbone.View
    className: 'message-pane'

    events:
      'click .message-pane-view': '_setSelectionOnClick'
      'click .close-help': '_hideHelp'

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
      @listenTo @settingsModel, 'change:showNavbar', @_toggleNavbar

      # Hotkeys related to the selected pane.
      # Feel free to add more, just be sure to add any new hotkeys
      # to the HotkeyHelp modal. 
      Mousetrap.bind('left', ((e) => @_moveSelection(1, e)))
      Mousetrap.bind('right', ((e) => @_moveSelection(-1, e)))
      Mousetrap.bind('up', ((e) => @_moveMessageSelection(-1, e)))
      Mousetrap.bind('down', ((e) => @_moveMessageSelection(1, e)))
      Mousetrap.bind('>', @_sendPaneToBottom)
      Mousetrap.bind('<', @_sendPaneToTop)
      Mousetrap.bind('shift+v', @_clearPaneFilters)
      Mousetrap.bind('shift+c', @_showPaneCompose)
      Mousetrap.bind('shift+f', @_showPaneFilters)

      # Hotkeys that affect the selected message
      Mousetrap.bind('r', @_selectedMessageReply)
      Mousetrap.bind('q', @_selectedMessageQuote)
      Mousetrap.bind('p', @_selectedMessagePM)

      # Awkward that this is here, since all it does is call something
      # in the session.
      Mousetrap.bind('alt+x', @_closeSelectedPane)

      # Hotkeys for showing/hiding the hotkey help.
      Mousetrap.bind('?', @_showHelp)
      Mousetrap.bind('esc', @_hideHelp)

      # Hotkeys for toggling settings      
      Mousetrap.bind('alt+h', @_toggleNavbarSetting)

      $(window).resize(@_recalculateWidth)

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

    _toggleNavbar: =>
      if not @settingsModel.get('showNavbar')
        @$el.addClass('expanded')
      else
        @$el.removeClass('expanded')

    _setSelectionOnClick: (evt) =>
      # Set the selection to a pane if that pane has received a click event
      @selectedPosition = @$('.message-pane-view').index(evt.currentTarget)
      @_setSelection()

    _moveSelection: (diff, e) =>
      # Keep our selected position within proper bounds.
      @selectedPosition = @selectedPosition - diff
      @selectedPosition = Math.min(@selectedPosition, @childViews.length - 1)
      @selectedPosition = Math.max(@selectedPosition, 0)

      @_setSelection()

      e?.preventDefault()
      e?.stopPropagation()

    _setSelection: =>
      selectedView = @childViews[@selectedPosition]

      # If we actually have a selected view, make sure to set the model and move the scroll
      if selectedView?
        for view in @childViews
          if view.cid != selectedView.cid
            view.model.set('selected', false)
        selectedView.model.set('selected', true)
        offset = selectedView.$el.offset().left
        width = selectedView.$el.width()
        if offset < 0
          @$el.scrollLeft(@$el.scrollLeft() + offset)
        else if (offset + width) > @$el.width()
          @$el.scrollLeft(@$el.scrollLeft() + (offset + width - @$el.width()))

    _toggleNavbarSetting: =>
      @settingsModel.set 'showNavbar', !@settingsModel.get('showNavbar')

    _sendPaneToBottom: =>
      @childViews[@selectedPosition].model.set('position', null)
      @childViews[@selectedPosition].model.trigger 'reload'

    _sendPaneToTop: =>
      @childViews[@selectedPosition].model.set('position', null)
      @childViews[@selectedPosition].model.trigger 'toTop'

    _moveMessageSelection: (diff, e) =>
      @childViews[@selectedPosition].moveSelectedMessage(diff)

      e?.preventDefault()
      e?.stopPropagation()

    _clearPaneFilters: =>
      @childViews[@selectedPosition].model.set('filters', {})

    _showPaneCompose: (e) =>
      @childViews[@selectedPosition].model.set('showCompose', true)
      e.preventDefault()
      e.stopPropagation()

    _showPaneFilters: (e) =>
      @childViews[@selectedPosition].model.set('showFilters', true)
      e.preventDefault()
      e.stopPropagation()

    _closeSelectedPane: =>
      @session.removePane(@childViews[@selectedPosition].model.cid)

    _selectedMessageReply: (e) =>
      @childViews[@selectedPosition].selectedMessageReply()

      e?.preventDefault()
      e?.stopPropagation()

    _selectedMessageQuote: (e) =>
      @childViews[@selectedPosition].selectedMessageQuote()

      e?.preventDefault()
      e?.stopPropagation()

    _selectedMessagePM: (e) =>
      @childViews[@selectedPosition].selectedMessagePM()

      e?.preventDefault()
      e?.stopPropagation()
      
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
      width = Math.max(Math.floor(100/@childViews.length), Math.floor(100 * MIN_MESSAGE_WIDTH/@$el.width()))
      index = 0
      for view in @childViews
        view.recalculateWidth index, width
        index += 1

    _showHelp: =>
      if @$('.modal-overlay').length == 0
        @$el.append com.roost.templates['HotkeyHelp']({})

    _hideHelp: =>
      @$('.modal-overlay').remove()
      @$('.modal').remove()