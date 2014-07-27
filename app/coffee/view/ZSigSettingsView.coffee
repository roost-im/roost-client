do ->
  class com.roost.ZSigSettingsView extends Backbone.View
    className : 'zsig-settings'

    events: ->
      eventsHash = {}
      eventsHash["#{com.roost.CLICK_EVENT} .add-zsig"]    = '_addZsig'
      eventsHash["#{com.roost.CLICK_EVENT} .remove-zsig"] = '_removeZsig'
      eventsHash['keyup #new-zsig']                       = '_handleZsigInputKey'
      return eventsHash

    initialize: =>
      @listenTo @model, 'change:zsigs', @render

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['ZSigSettingsView'](@model.attributes)

    _addZsig: =>
      zsig = @$('#new-zsig').val()
      oldZsigs = _.clone(@model.get('zsigs'))
      @model.set('zsigs', oldZsigs.concat([zsig]))

    _removeZsig: (evt) =>
      zsigs = _.clone(@model.get('zsigs'))
      zsigs.splice($(evt.target).data().zsigIndex, 1)
      @model.set('zsigs', zsigs)

    _handleZsigInputKey: (evt) =>
      if evt.keyCode == 13
        @_addZsig()
      else if evt.keyCode == 27
        @uiState.set 'showSettings', false