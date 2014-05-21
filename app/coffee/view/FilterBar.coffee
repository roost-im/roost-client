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

      @listenTo @paneModel, 'change:showFilters change:filters', @render

    render: =>
      @$el.empty()
      template = com.roost.templates['FilterBar']
      @$el.append template(@paneModel.attributes)

      # Bring focus to first input box
      @$('.class-input').focus()

      # Make our header cooler
      if @paneModel.get('filters').class_key?
        @_updateColors()

    _updateColors: =>
      # TODO: make this work through a Handlebars helper 
      string = @paneModel.get('filters').class_key
      color = shadeColor(stringToColor(string), 0.5)
      lighterColor = shadeColor(color, 0.4)

      if @paneModel.get('filters').instance_key
        @$('.top-bar').css
          color: 'black'
          background: lighterColor

        @$('.msg-class').css
          background: color

        @$('.divider').css("border-left", "5px solid #{color}")
      else
        @$('.top-bar').css
          color: 'black'
          background: color

    _toggleFilters: =>
      @paneModel.set('showFilters', !@paneModel.get('showFilters'))

    _removeFilters: =>
      @paneModel.set
        filters: {}
        loaded: false
        showFilters: false

      @paneModel.trigger 'toBottom'

    _removePane: =>
      @session.removePane(@paneModel.cid)

    _setFilters: =>
      # Currently jumps to bottom upon filter load because position isn't saving dynamically
      opts = 
        class_key: @$('.class-input').val()
        instance_key: @$('.instance-input').val()
        recipient: @$('.recipient-input').val()

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
      @paneModel.trigger 'toBottom'

    _handleInputKey: (evt) =>
      if evt.keyCode == 13
        @_setFilters()