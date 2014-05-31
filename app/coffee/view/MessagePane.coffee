do ->
  # We have to enforce this here, because just doing CSS on the messages
  # neglects the filter/compose bars, which are also jankily placed.
  MIN_MESSAGE_WIDTH = 580

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

      @listenTo @session.userInfo, 'change', @_toggleVisibility

      # Since we handle panes, pane selection, and keyboard shortcuts,
      # listen for any settings changes and act accordingly
      @listenTo @settingsModel, 'change:keyboard', @_toggleKeyboard
      @listenTo @settingsModel, 'change:panes', @_togglePanes
      @listenTo @settingsModel, 'change:showNavbar', @_toggleNavbar
      @listenTo @settingsModel, 'change:onMobile', @_toggleSwiping

      # Hotkeys related to the selected pane.
      # Feel free to add more, just be sure to add any new hotkeys
      # to the HotkeyHelp modal. 
      Mousetrap.bind('left', ((e) => @_moveSelection(1, e)))
      Mousetrap.bind('shift+left', ((e) => @_shiftSelection(-1, e)))
      Mousetrap.bind('right', ((e) => @_moveSelection(-1, e)))
      Mousetrap.bind('shift+right', ((e) => @_shiftSelection(1, e)))
      Mousetrap.bind('up', ((e) => @_moveMessageSelection(-1, e)))
      Mousetrap.bind('down', ((e) => @_moveMessageSelection(1, e)))
      Mousetrap.bind('>', @_sendPaneToBottom)
      Mousetrap.bind('<', @_sendPaneToTop)
      Mousetrap.bind('shift+v', @_clearPaneFilters)
      Mousetrap.bind('z', @_showPaneCompose)
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
      Mousetrap.bind('alt+s', @_toggleSubSetting)

      # Set up swiping
      @$el.swipe(
        swipeLeft: => @_moveSelection(-1)
        swipeRight: => @_moveSelection(1)
      )

      $(window).resize(@_recalculateWidth)

    render: =>
      @$el.empty()
      @childViews = []
      @selectedPosition = 0

      for paneModel in @messageLists.models
        @_addPaneView(paneModel)

      if @childViews.length > 0
        @_setSelection()

      @subView = new com.roost.SubscriptionPanel
        settings: @settingsModel
        subscriptions: @session.subscriptions
        session: @session
      @subView.render()
      @$el.append(@subView.$el)

      @_checkSettings()

    _checkSettings: =>
      @_toggleKeyboard()
      @_togglePanes()
      @_toggleNavbar()
      @_toggleSwiping()

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
      # This is a pretty ass-backwards way of doing this.
      if !@settingsModel.get('panes') and @childViews.length > 1
        for i in [@childViews.length-1..1]
          @session.removePane(@childViews[i].model.cid)

    _toggleNavbar: =>
      if not @settingsModel.get('showNavbar')
        @$el.addClass('expanded')
      else
        @$el.removeClass('expanded')

    _toggleSwiping: =>
      if @settingsModel.get('onMobile')
        @$el.swipe('enable')
        @undelegateEvents()
      else
        @$el.swipe('disable')
        @delegateEvents()

    _toggleVisibility: =>
      if @session.userInfo.get('username')?
        @$el.show()
      else
        @$el.hide()

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
          # Make sure the other views stop being selected
          if view.cid != selectedView.cid
            view.model.set('selected', false)

        # Mark our new selected view model as selected
        selectedView.model.set('selected', true)

        # Figure out how much we need to scroll left/right to get the new selected pane on screen
        offset = selectedView.$el.offset().left
        width = selectedView.$el.width()
        if offset < 0
          @$el.scrollLeft(@$el.scrollLeft() + offset)
        else if (offset + width) > @$el.width()
          @$el.scrollLeft(@$el.scrollLeft() + (offset + width - @$el.width()))

    _shiftSelection: (diff, e) =>
      # No point in doing this if we will overshoot the ends.
      if (@selectedPosition + diff) <= @childViews.length - 1 and (@selectedPosition + diff) >= 0
        currentSelected = @childViews[@selectedPosition]
        jumpTarget = @childViews[@selectedPosition + diff]

        # We want to save off where the moving view is scrolled.
        # After the move, we have to restore it.
        oldScroll = currentSelected.$el.scrollTop()

        # Jump before or after target, depending on diff
        if diff < 0
          jumpTarget.$el.before(currentSelected.$el)
        else
          jumpTarget.$el.after(currentSelected.$el)

        # Swap places in the childViews array
        @childViews[@selectedPosition] = jumpTarget
        @childViews[@selectedPosition + diff] = currentSelected

        # Update our selected position
        @selectedPosition = @selectedPosition + diff
        @_setSelection()

        # Restore the scroll position
        currentSelected.$el.scrollTop(oldScroll)

        # This seems awkward to do here, but is necessary since recalcWidth also gets the fitler/
        # compose bars into the right spots.
        @_recalculateWidth()

      e?.preventDefault()
      e?.stopPropagation()

    _handleSwipeLeft: (e) =>
      @_moveSelection(-1, e)

    _handleSwipeRight: (e) =>
      @_moveSelection(1, e)

    _toggleNavbarSetting: (e)=>
      @settingsModel.set 'showNavbar', !@settingsModel.get('showNavbar')
      e?.preventDefault()
      e?.stopPropagation()

    _toggleSubSetting: (e) =>
      @settingsModel.set 'showSubs', !@settingsModel.get('showSubs')
      e?.preventDefault()
      e?.stopPropagation()

    # Lots of tunneling into the selected pane for hotkeying
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
      e?.preventDefault()
      e?.stopPropagation()

    _showPaneFilters: (e) =>
      @childViews[@selectedPosition].model.set('showFilters', true)
      e?.preventDefault()
      e?.stopPropagation()

    _closeSelectedPane: =>
      @session.removePane(@childViews[@selectedPosition].model.cid)

    # Tunneling down even further to the message
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
      # Well, we have a pane now.
      @$('.no-panes').remove()

      # Create the pane, save it off
      paneView = new com.roost.MessagePaneView
        session: @session
        model: paneModel
      @childViews.push(paneView)

      # Render, stick it in our $el, and tell everyone to redo their widths
      paneView.render()
      @$el.append(paneView.$el)
      @_recalculateWidth()

      # Select the newly added pane
      @_moveSelection(-1 * @childViews.length)

    _removePaneView: (model) =>
      for view in @childViews
        if view.model.cid == model.cid
          toDelete = view
      toDelete.remove()
      @childViews = _.reject(@childViews, ((view) => view.cid == toDelete.cid))
      @_recalculateWidth()

      # Stop anything listening to this model
      model.off()

      # Move the selection off this model
      if model.get('selected')
        @_moveSelection(1)

      # Show a no-panes message if there are no panes.
      # Also make sure the navbar is out and we can see it.
      if @messageLists.length == 0
        @$el.append($('<div class="no-panes">').text('Click "+ New Pane" above to start browsing your messages.'))
        @session.settingsModel.set('showNavbar', true)

    _recalculateWidth: =>
      # Tell all the child views to recalculate their width.
      # This will also move filter/compose bars to the right spots, since the layout for
      # the pane is actually quite dirty.
      if @$el.width() < MIN_MESSAGE_WIDTH
        percentageLimit = 100
      else
        percentageLimit = 100 * MIN_MESSAGE_WIDTH/@$el.width()
      width = Math.max(Math.floor(100/@childViews.length), Math.floor(percentageLimit))
      index = 0
      for view in @childViews
        view.recalculateWidth index, width
        index += 1

    # Normally you might put a bit more effort into displaying this, especially since we
    # have to crummily shove it into the body from within this message pane. However,
    # it's so simple that I've chosen to just inject it into the body from here.
    # If this view gets more complex, please please please give it its own view class.
    # Currently duplicated in the Navbar...
    _showHelp: =>
      if $('.modal-overlay').length == 0
        $('body').append com.roost.templates['HotkeyHelp']({})
        $('.close-help').click(@_hideHelp)

    _hideHelp: =>
      $('.modal-overlay').remove()
      $('.modal').remove()