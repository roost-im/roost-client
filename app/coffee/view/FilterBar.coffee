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

      fclass = @paneModel.get('filters').class_key_base
      # If we're only an instance filter, flag it and set fclass to the instance for coloring
      # (Hacky, I'm sorry.)
      if !fclass? and @paneModel.get('filters').instance_key_base
        noClass = true
        fclass = @paneModel.get('filters').instance_key_base
      @$el.append template(_.defaults({}, @paneModel.attributes, {class: fclass, noClass: noClass}))

      # Set full opacity class if this pane is selected
      if @paneModel.get('selected')
        @$el.addClass('selected')
      else
        @$el.removeClass('selected')

      # Bring focus to first input box
      @$('.class-input').focus()

      # Make our header colored if filtering
      if fclass?
        @_updateColors(fclass)

    _updateColors: (string)=>
      # TODO: make this work through a Handlebars helper 
      color = shadeColor(stringToColor(string), 0.5)
      lighterColor = shadeColor(color, 0.4)

      # Get fancy if we have a class-instance filter
      if @paneModel.get('filters').instance_key_base
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

      if @session.settingsModel.get('onMobile') and @paneModel.get('showFilters')
        @session.settingsModel.set('showNavbar', false)
      else
        @session.settingsModel.set('showNavbar', true)

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
        class_key: @$('.class-input').val()
        instance_key: @$('.instance-input').val()
        recipient: @$('.recipient-input').val()

      # Only add the fields we actually have
      filters = {}
      if opts.class_key != ''
        filters.class_key_base = opts.class_key
      if opts.instance_key != ''
        filters.instance_key_base = opts.instance_key
      if opts.recipient != ''
        filters.recipient = opts.recipient

      # Set the filters and trigger a reset
      # Clear position on filter change
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