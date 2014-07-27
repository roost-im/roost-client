do ->
  class com.roost.ComposeController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @api = options.api
      @userState = options.userState
      @model = options.model

      @listenTo @model, 'sendMessage', @_sendMessage

    _sendMessage: =>
      data = @userState().ready().then( =>
        # First try loading from 'zsigs', then 'zsig', then the default.
        zsigs = @userState().get('zsigs')
        legacy = @userstate().get('zsig') ? "Sent from Roost"
        zsigs = zsigs ? [legacy]
        zsig = _.sample(zsigs)
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
