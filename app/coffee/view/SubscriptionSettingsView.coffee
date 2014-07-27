do ->
  class com.roost.SubscriptionSettingsView extends Backbone.View
    className : 'subscription-settings'

    events: ->
      eventsHash = {}
      return eventsHash

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['SubscriptionSettingsView']()