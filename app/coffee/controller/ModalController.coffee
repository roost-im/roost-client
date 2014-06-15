# The ModalController deals with modal dialogs. It ensures that there's only one
# controller at a time, that modals behave uniformly (clicking outside closes
# them),
do ->
  class com.roost.ModalController

    # ModalController manages a global resource, so it makes sense for it to be
    # a singleton. This wrapper ensures that outer code can't access the inner
    # class to construct their own modal controllers.
    instance = null

    @getInstance: =>
      instance ?= new ModalControllerInner()
      return instance

    class ModalControllerInner
      constructor: (options) ->
        $.extend(this, Backbone.Events)

        # The jQuery selector for the root element of the modal, if any.
        @$el = null

      # Display a modal with the given inner HTML if there is no existing
      # one.
      #
      # The width parameter is necessary because it turns out that horizontally
      # centering an element of unknown width with absolute positioning is
      # basically impossible without doing some JS to keep it there when the
      # window resizes.
      display: (title, content, width) =>
        if @isDisplaying() then return

        inner = com.roost.templates['Modal'](title: title, content: content)
        @$el = $(inner).appendTo('body')
        $('#modal').width(width)
        $('#close-modal').click(@hide)

      # Stop displaying the existing modal, if any.
      hide: =>
        @$el.remove()
        @$el = null

      # Whether the controller is displaying something.
      isDisplaying: =>
        return @$el?
