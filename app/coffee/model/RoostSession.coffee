do ->

  # TODO: it's unclear if the functionality of adding or removing panes should exist here,
  # or if other views should be able to add/remove pains and this session just listens.
  # The main point is that something has to exist to both bind controllers and clean up
  # stuff when panes get deleted.

  class com.roost.RoostSession
    constructor: ->
      # User's login info
      @userInfoModel = new com.roost.UserInfoModel

      # User's general settings (includes zsigs)
      @userSettingsModel = new com.roost.UserSettingsModel

      # User's subscriptions
      @subscriptions            = new Backbone.Collection()
      @subscriptions.model      = com.roost.SubscriptionModel
      @subscriptions.comparator = ((a) => return baseString(a.get('class')))

      # Collection of Message List Models
      @messageLists = new Backbone.Collection()
      @messageLists.on 'add remove', @_saveState

      # Map of message controllers
      @messageControllers = {}

      # Map of compose controllers
      @composeControllers = {}

      # UI state - manage what is showing on overall UI/what can be done
      @uiStateModel = new com.roost.UIStateModel()

      # Singleton services used for storage on frontend/backend
      # Currently uses old Roost objects
      @localStorage   = new LocalStorageWrapper()
      @storageManager = new StorageManager(@localStorage)
      @ticketManager  = new TicketManager(CONFIG.webathena, @storageManager)
      @api            = new API(CONFIG.server, CONFIG.serverPrincipal, @storageManager, @ticketManager)
      @userState      = @api.userInfo()

      # I really don't know if this is where the hotkeys go.
      # Most of the hotkeys hang out in the MessagePane view.
      Mousetrap.bind('alt+t', (=> 
        if !@uiStateModel.get('limitReached')
          @addPane {}
      ))
      Mousetrap.bind('alt+p', (=>
        if !@uiStateModel.get('limitReached')
          @addPane 
            filters:
              is_personal: true
      ))

    addPane: (options, parent, fromState) =>
      # Add a pane to our list if we have the multi-pane setting enabled,
      # or if we don't have any panes at all.
      # Add a new model
      paneModel = new com.roost.MessagePaneModel(options)
      paneModel.on 'change:position change:filters change:selected', @_saveState

      # Add a new controller and fetch data
      paneController = new com.roost.MessagePaneController
        model: paneModel
        api: @api
      paneController.fetchFromPosition()

      # Add compose controller for sending messages
      composeController = new com.roost.ComposeController
        model: paneModel
        api: @api
        userState: @userState

      # If this pane was added from a parent pane, set proper
      # insertion index.
      if parent?
        index = @messageLists.indexOf(parent) + 1
      else
        index = @messageLists.length

      # Save references to the controllers and model
      @messageLists.add paneModel, {at: index, select: !fromState}
      @messageControllers[paneModel.cid] = paneController
      @composeControllers[paneModel.cid] = composeController

      if @messageLists.length >= com.roost.PANE_LIMIT
        @uiStateModel.set('limitReached', true)

    removePane: (cid) =>
      # Stop the controllers from listening to the model
      @messageControllers[cid].stopListening()
      @composeControllers[cid].stopListening()
      model = @messageLists.get(cid)

      # Remove references to the model and the controller
      @messageLists.remove(cid)
      delete @messageControllers[cid]
      delete @composeControllers[cid]

      # Stop anything else from listening to this model
      model.off()

      @uiStateModel.set('limitReached', false)

    movePane: (cid, newIndex) =>
      model = @messageLists.get(cid)
      @messageLists.remove(model, {silent: true})
      @messageLists.add(model, {at: newIndex, silent: true})
      @_saveState()

    removeAllPanes: =>
      cids = []
      for model in @messageLists.models
        cids.push(model.cid)

      for cid in cids
        @removePane(cid)

    # This is a bit hacky and might belong in a controller...
    loadState: =>
      @userState.ready().then(=>
        if @userState.get('panes')? and @userState.get('panes').length > 0
          for pane in @userState.get('panes')
            pane.messages = new com.roost.MessageCollection()
            @addPane(pane, null, true)
        else
          @addPane({})
          @_saveState()
      )

    _saveState: =>
      @userState.ready().then(=>
        state = []
        for model in @messageLists.models
          state.push
            filters  : model.get('filters')
            position : model.get('position')
            selected : model.get('selected')
        @userState.set('panes', state)
      )
