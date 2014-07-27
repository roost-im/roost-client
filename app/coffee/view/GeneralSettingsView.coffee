do ->
  class com.roost.GeneralSettingsView extends Backbone.View
    className : 'general-settings'

    events: ->
      eventsHash = {}
      return eventsHash

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['GeneralSettingsView']()