do ->
  class com.roost.SettingsController
    constructor: (options) ->
      $.extend @, Backbone.Events

      @userSettingsModel = options.userSettingsModel
      @userState         = options.userState
      @userInfoModel     = options.userInfoModel

      @listenTo @userInfoModel, 'change', @fetchSettings
      @listenTo @userSettingsModel, 'change', @_saveSettings

    fetchSettings: =>
      @userState.ready()
      .then( =>
        @userSettingsModel.set 'zsigs', @_getZsigs()
        @userSettingsModel.set @_getMiscSettings()
      )

    _getMiscSettings: =>
      settings = {}
      for key,value of @userSettingsModel.attributes
        if key == 'zsigs' then continue

        setting = @userState.get(key)
        if setting? then settings[key] = setting

      return settings

    _getZsigs: =>
      # Older versions of Roost store the zsig in 'zsig'. Check both.
      zsigs = @userState.get('zsigs') ? @userState.get('zsig')
      if !zsigs?
        zsigs = ["Sent from roost"]
      if typeof zsigs == "string"
        zsigs = [zsigs]
      # Defensive object copy so that @userState.set will always DTRT.
      return _.clone(zsigs)

    # Currently saves all settings - should be a bit smarter.
    _saveSettings: =>
      @userState.ready()
      .then( =>
        for key,value of @userSettingsModel.attributes
          @userState.set(key, value)
      )