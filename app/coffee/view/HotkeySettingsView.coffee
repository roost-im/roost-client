do ->
  class com.roost.HotkeySettingsView extends Backbone.View
    className : 'hotkey-settings'

    events: ->
      eventsHash = {}
      return eventsHash

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['HotkeySettingsView']()