com.roost.CLICK_EVENT = 'click'

$('document').ready( =>
  # Create the session
  session = new com.roost.RoostSession()
  checkSettings(session)

  # Create the sub controller
  subController = new com.roost.SubscriptionController
    api: session.api
    userInfo: session.userInfo
    subscriptions: session.subscriptions

  # Create the auth controller
  # Automatically checks for existing tickets on init
  authController = new com.roost.AuthenticationController
    session: session
    userInfo: session.userInfo
    ticketManager: session.ticketManager

  # Create the navbar view and add it to the DOM
  navbar = new com.roost.NavBar
    session: session
  navbar.render()
  $('body').append(navbar.$el)

  # Create the login view and add it to the DOM
  loginView = new com.roost.LoginView
    userInfo: session.userInfo
  loginView.render()
  $('body').append(loginView.$el)

  # Create the message pane view and add it to the DOM
  messagePane = new com.roost.MessagePane
    session: session
    messageLists: session.messageLists
  messagePane.render()
  $('body').append(messagePane.$el)

  # Add the first pane if the user is logged in
  if session.userInfo.get('username')?
    session.addPane {}
)

checkSettings = (session) ->
  # Let's not toggle the pane/navbar settings for now, just to allow
  # panes in mobile.
  settingsModel = session.settingsModel
  if window.mobilecheck()
    com.roost.CLICK_EVENT = 'touchend'
    settingsModel.set 
      onMobile: true
  else
    settingsModel.set 
      onMobile: false
