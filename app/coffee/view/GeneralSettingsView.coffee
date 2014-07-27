do ->
  class com.roost.GeneralSettingsView extends Backbone.View
    className : 'general-settings settings-form'

    events: ->
      eventsHash = {}
      eventsHash['change .gravatar']  = '_saveSettings'
      eventsHash['change .first-run'] = '_saveSettings'
      return eventsHash

    initialize: (options) =>
      @listenTo @model, 'change:showGravatar change:hasSeenRoost', @render

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['GeneralSettingsView'](@model.attributes)

    _saveSettings: =>
      @model.set
        showGravatar : @$('.gravatar').is(":checked")
        hasSeenRoost : !@$('.first-run').is(":checked")