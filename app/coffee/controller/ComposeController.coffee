do ->
  class com.roost.ComposeController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @api          = options.api
      @userSettings = options.userSettings
      @model        = options.model

      @listenTo @model, 'sendMessage', @_sendMessage

    _sendMessage: =>
      msg = @model.get('composeFields')
      if msg.class == msg.instance == ""
        msg.class = "message"
        msg.instance = "personal"
      data = {
        message:
          class: msg.class
          instance: msg.instance
          recipient: msg.recipient
          opcode: ""
          signature: _.sample(@userSettings.get('zsigs')) or "Sent from Roost"
          message: msg.content
      }

      @api.post("/v1/zwrite", data, {
        withZephyr: true
        interactive: true
      }).then( (ret) =>
        console.log("Sent:", ret.ack)
      ).finally( =>
        @model.set
          showCompose: false
          sending: false
          composeFields: {}
      ).done()
