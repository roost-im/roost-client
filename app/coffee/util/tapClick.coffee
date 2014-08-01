# Set up events that need to be either tap or click depending on whether the
# browser is mobile or not. Based on backbone.hammer by Sam Breed.
View = Backbone.View

# We only want to use hammer.js for tap events on iOS. Android has some weird
# bug with them, and click events work fine on it anyway as long as you set the
# right viewport meta attribute.
useTap = ->
  return com.roost.ON_MOBILE and /iPad|iPhone/.test(navigator.userAgent)

Backbone.View = View.extend({
  # Must be ->, not =>! extend requires the late this-binding in order to work
  # properly.
  delegateEvents: ->
    computeEvents = =>
      # If we're using tap events, no point in setting up click handlers.
      if useTap()
        return {}
      events = events || _.result(this, 'tapClickEvents')
      if not events
        return {}

      desktopEvents = {}
      for selector, method of events
        desktopEvents["click " + selector] = method

      return desktopEvents

    events = _.result(this, 'events')
    if not events
      events = {}

    _.extend(events, computeEvents())

    View.prototype.delegateEvents.call(this, events)
    return this

  render: ->
    View.prototype.render.apply(this, arguments)
    if not useTap()
      return this

    # We defer here so that the hammers and everything will get set up *after*
    # rendering finishes.
    _.defer(=>
      events = _.result(this, 'tapClickEvents')
      if not events
        return this

      for selector, method of events
        if not _.isFunction(method)
          method = this[method]

        @$(selector).each(->
          # Give each element that matches the selector its own Hammer instance.
          $el = $(this)
          if not $el.data('hammer')
            $el.data('hammer', new Hammer(this,
              recognizers: [[Hammer.Tap]],
              touchAction: 'auto'))
          $el.data('hammer').on('tap', method)
        )
    )
    return this
})
