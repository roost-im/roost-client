do ->
  class com.roost.HelpView extends Backbone.View
    className : 'help'

    events: ->
      eventsHash = {}
      return eventsHash

    render: =>
      @$el.empty()
      @$el.append com.roost.templates['HelpView']()