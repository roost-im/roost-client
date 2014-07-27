do ->
  class com.roost.UIStateModel extends Backbone.Model
    defaults: =>
      showNavbar   : true
      showSubs     : false
      showSettings : false
      settingsTab  : 'subscriptions'
      limitReached : false