do ->
  class com.roost.FilterBar extends Backbone.View
    className: 'filter-bar'

    events:
      'click .filters': '_toggleFilters'
      'click .remove': '_removePane'

    initialize: (options) =>
      @paneModel = options.paneModel

      @listenTo @paneModel, 'change:showFilters', @render

    render: =>
      @$el.empty()
      template = com.roost.templates['FilterBar']
      @$el.append template(@paneModel.attributes)

    _toggleFilters: =>
      @paneModel.set('showFilters', !@paneModel.get('showFilters'))

    _removePane: =>
      return