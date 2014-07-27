do ->
  class com.roost.UserSettingsModel extends Backbone.Model
    defaults: =>
      zsigs              : ['Sent from Roost']
      showGravatar       : true
      newToRoost         : false
      subscriptionColors : {}
      starkHours         : 3
      hotkeyMap          : {}