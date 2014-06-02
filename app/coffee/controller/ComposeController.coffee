do ->
  class com.roost.ComposeController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @api = options.api
      @model = options.model

      @listenTo @model, 'sendMessage', @_sendMessage

    _sendMessage: =>
      data = @api.userInfo().ready().then( =>
        zsig = @api.userInfo().get('zsig')
        if !zsig?
          zsig = "Sent from Roost"
        msg = @model.get('composeFields')
        if msg.class == msg.instance == ""
          msg.class = "message"
          msg.instance = "personal"
        return {
          message:
            class: msg.class
            instance: msg.instance
            recipient: msg.recipient
            opcode: ""
            signature: zsig
            message: msg.content
        }
      )

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
