do ->
  class com.roost.UserSettingsModel extends Backbone.Model
    defaults: =>
      zsigs              : ['Sent from Roost']
      showGravatar       : true
      hasSeenRoost       : false
      subscriptionColors : {}
      starkHours         : 3
      hotkeyMap          : {}