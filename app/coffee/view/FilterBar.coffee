do ->
  class com.roost.FilterBar extends Backbone.View
    className: 'filter-bar'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .filters"] = '_toggleFilters'
      eventsHash["#{com.roost.CLICK_EVENT} .clear-filters"] = '_removeFilters'
      eventsHash["#{com.roost.CLICK_EVENT} .remove"] = '_removePane'
      eventsHash["#{com.roost.CLICK_EVENT} .set-filters"] = '_setFilters'
      eventsHash['keydown input'] = '_handleInputKey'
      return eventsHash

    initialize: (options) =>
      @paneModel = options.paneModel
      @session = options.session

      @listenTo @paneModel, 'change:showFilters change:filters change:selected', @render

    render: =>
      @$el.empty()
      template = com.roost.templates['FilterBar']

      if !@paneModel.get('filters').class_key_base? and @paneModel.get('filters').instance_key_base
        noClass = true
      @$el.append template(_.defaults({}, @paneModel.attributes, {noClass: noClass}))

      # Set full opacity class if this pane is selected
      if @paneModel.get('selected')
        @$el.addClass('selected')
      else
        @$el.removeClass('selected')

      # Autocomplete currently only works for browser - mobile click event issues
      if not com.roost.ON_MOBILE
        @$('.class-input').typeahead({
          hint: true,
          highlight: true,
          minLength: 1
        },
        {
          name: 'subs'
          displayKey: 'value'
          source: substringMatcher(@session.subscriptions.pluck('class'))
        })
        @$('.class-input').typeahead('val', @paneModel.get('filters').class_key_base)

      # Bring focus to first input box
      @$('.class-input').focus()

    _toggleFilters: =>
      # Show or hide input boxes
      @paneModel.set('showFilters', !@paneModel.get('showFilters'))

      if com.roost.ON_MOBILE and @paneModel.get('showFilters')
        @session.uiStateModel.set('showNavbar', false)
      else
        @session.uiStateModel.set('showNavbar', true)

    _removeFilters: =>
      # Clears filters, prompting a reload.  Doesn't reset position
      @paneModel.set
        filters: {}
        loaded: false
        showFilters: false

    _removePane: =>
      @session.removePane(@paneModel.cid)

    _setFilters: =>
      opts = 
        class_key_base: baseString(@$('.class-input:not(.tt-hint)').val().toLowerCase())
        instance_key_base: baseString(@$('.instance-input').val().toLowerCase())
        recipient: @$('.recipient-input').val()

      # Only add the fields we actually have
      filters = {}
      if opts.class_key_base != ''
        filters.class_key_base = opts.class_key_base
      if opts.instance_key_base != ''
        filters.instance_key_base = opts.instance_key_base
      if opts.recipient != ''
        filters.recipient = opts.recipient

      # Set the filters and trigger a reset
      # Clear position on filter change
      @paneModel.set
        filters: filters
        loaded: false
        showFilters: false
        position: null

      # In case we hid it last time for mobile
      @session.settingsModel.set('showNavbar', true)

    _handleInputKey: (evt) =>
      # Enter and escape key handling in the input boxes
      if evt.keyCode == 13
        @_setFilters()
      else if evt.keyCode == 27
        @_toggleFilters()
