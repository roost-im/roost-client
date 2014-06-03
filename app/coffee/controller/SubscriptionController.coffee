do ->
  class com.roost.SubscriptionController
    constructor: (options) ->
      $.extend @, Backbone.Events

      # Subscription model
      @subscriptions = options.subscriptions

      # API singleton from the session
      @api = options.api

      # User info
      @userInfo = options.userInfo

      @listenTo @userInfo, 'change', @fetchSubscriptions
      @listenTo @subscriptions, 'add', @_subscribe
      @listenTo @subscriptions, 'remove', @_unsubscribe

    fetchSubscriptions: =>
      @api.get("/v1/subscriptions").then(((subs) =>
        @subscriptions.reset subs
        @subscriptions.sort()
      ), ((err) =>
        console.log "Failed to get subscriptions: " + err
        throw err
      )).done()

    _subscribe: (subModel) =>
      withZephyr = if subModel.get('recipient') and subModel.get('recipient')[0] != '@' then true else false
      recipPromise = if subModel.get('recipient') == "%me%" then storageManager.principal() else Q(subModel.get('recipient'))
      data = recipPromise.then(((msgRecipient) =>
        return {
          subscriptions: [subModel.attributes]
        }
      ))

      @api.post("/v1/subscribe", data, {
        withZephyr: withZephyr
        interactive: true
      }).then((() =>
        console.log("Subscribed to " + subModel.get('class'))
      ), ((err) =>
        console.log("Failed to subscribed to " + subModel.get('class') + ": " + err)
        throw err
      )).done()

    _unsubscribe: (subModel) =>
      recipPromise = if subModel.get('recipient') == "%me%" then storageManager.principal() else Q(subModel.get('recipient'))
      data = recipPromise.then(((msgRecipient) =>
        return {
          subscription: subModel.attributes
        }
      ))
      @api.post("/v1/unsubscribe", data, {interactive:true}).then((() =>
        console.log("Unsubscribed from " + subModel.get('class'))
      ), ((err) =>
        console.log("Failed to unsubscribed from " + subModel.get('class') + ": " + err)
        throw err
      )).done()