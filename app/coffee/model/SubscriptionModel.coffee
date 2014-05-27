do ->
  class com.roost.SubscriptionModel extends Backbone.Model
    defaults: =>
      class: ""
      classKey: ""
      instance: ""
      instanceKey: ""
      recipient: ""