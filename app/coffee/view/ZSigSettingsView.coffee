do ->
  class com.roost.ZSigSettingsView extends Backbone.View
    className : 'zsig-settings'

    events: ->
      eventsHash = {}
      return eventsHash

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['ZSigSettingsView']()