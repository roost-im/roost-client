com.roost.CLICK_EVENT = 'click'
com.roost.PANE_LIMIT  = 10
com.roost.ON_MOBILE   = false

$('document').ready( =>
  # Create the session
  session = new com.roost.RoostSession()

  # Set 'constants' for mobile
  if window.mobilecheck()
    com.roost.PANE_LIMIT = 6
    com.roost.ON_MOBILE  = true

  # Create the sub controller
  subController = new com.roost.SubscriptionController
    api           : session.api
    userInfoModel : session.userInfoModel
    subscriptions : session.subscriptions

  # Create the settings controller
  settingsController = new com.roost.SettingsController
    userState         : session.userState
    userInfoModel     : session.userInfoModel
    userSettingsModel : session.userSettingsModel

  # Create the auth controller
  # Automatically checks for existing tickets on init
  authController = new com.roost.AuthenticationController
    session       : session
    userInfoModel : session.userInfoModel
    ticketManager : session.ticketManager

  # Create the navbar view and add it to the DOM
  navbar = new com.roost.NavBar
    session: session
  navbar.render()
  $('body').append(navbar.$el)

  # Create the login view and add it to the DOM
  loginView = new com.roost.LoginView
    userInfoModel: session.userInfoModel
  loginView.render()
  $('body').append(loginView.$el)

  # Create the message pane view and add it to the DOM
  messagePane = new com.roost.MessagePane
    session      : session
    messageLists : session.messageLists
  messagePane.render()
  $('body').append(messagePane.$el)

  # Create the settings panel view and add it to the DOM
  settingsPanel = new com.roost.SettingsPanel
    session           : session
    subscriptions     : session.subscriptions
    userSettingsModel : session.userSettingsModel
    uiState           : session.uiStateModel
    userState         : session.userState
  settingsPanel.render()
  $('body').append(settingsPanel.$el)

  if session.userInfoModel.get('username')?
    session.loadState()
)
