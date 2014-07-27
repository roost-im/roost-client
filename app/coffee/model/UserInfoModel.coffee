do ->
  class com.roost.UserInfoModel extends Backbone.Model
    defaults: =>
      username : null
      realm    : null