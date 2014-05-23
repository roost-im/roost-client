do ->
  class com.roost.FilterBar extends Backbone.View
    className: 'filter-bar'

    events:
      'click .filters': '_toggleFilters'
      'click .clear-filters': '_removeFilters'
      'click .remove': '_removePane'

      'click .set-filters': '_setFilters'

      'keyup input': '_handleInputKey'

    initialize: (options) =>
      @paneModel = options.paneModel
      @session = options.session

      @listenTo @paneModel, 'change:showFilters change:filters change:selected', @render

    render: =>
      @$el.empty()
      template = com.roost.templates['FilterBar']
      @$el.append template(@paneModel.attributes)

      # Set full opacity class if this pane is selected
      if @paneModel.get('selected')
        @$el.addClass('selected')
      else
        @$el.removeClass('selected')

      # Bring focus to first input box
      @$('.class-input').focus()

      # Make our header colored if filtering
      if @paneModel.get('filters').class_key?
        @_updateColors()

    _updateColors: =>
      # TODO: make this work through a Handlebars helper 
      string = @paneModel.get('filters').class_key
      color = shadeColor(stringToColor(string), 0.5)
      lighterColor = shadeColor(color, 0.4)

      # Get fancy if we have a class-instance filter
      if @paneModel.get('filters').instance_key
        @$('.top-bar').css
          color: 'black'
          background: lighterColor
        @$('.msg-class').css
          background: color
        @$('.divider').css("border-left", "5px solid #{color}")
      # Keep it simple otherwise
      else
        @$('.top-bar').css
          color: 'black'
          background: color

    _toggleFilters: =>
      # Show or hide input boxes
      @paneModel.set('showFilters', !@paneModel.get('showFilters'))

    _removeFilters: =>
      # Clears filters, prompting a reload.  Doesn't reset position
      @paneModel.set
        filters: {}
        loaded: false
        showFilters: false

    _removePane: =>
      # TODO: stop this from bubbling up to the session
      @session.removePane(@paneModel.cid)

    _setFilters: =>
      # Clear position on filter change
      opts = 
        class_key: @$('.class-input').val()
        instance_key: @$('.instance-input').val()
        recipient: @$('.recipient-input').val()

      # Only add the fields we actually have
      filters = {}
      if opts.class_key != ''
        filters.class_key = opts.class_key
      if opts.instance_key != ''
        filters.instance_key = opts.instance_key
      if opts.recipient != ''
        filters.recipient = opts.recipient

      # Set the filters and trigger a reset
      @paneModel.set
        filters: filters
        loaded: false
        showFilters: false
        position: null

    _handleInputKey: (evt) =>
      # Enter and escape key handling in the input boxes
      if evt.keyCode == 13
        @_setFilters()
      else if evt.keyCode == 27
        @_toggleFilters()