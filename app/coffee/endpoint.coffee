$('document').ready( =>
  # Create the session
  session = new com.roost.RoostSession()

  # Create the auth controller
  authController = new com.roost.AuthenticationController
    session: session
    userInfo: session.userInfo
    ticketManager: session.ticketManager

  # Create the views
  navbar = new com.roost.NavBar
    session: session
  navbar.render()
  $('body').append(navbar.$el)

  messagePane = new com.roost.MessagePane
    messageLists: session.messageLists
  messagePane.render()
  $('body').append(messagePane.$el)

  # Trigger login for the user if necessary
  session.userInfo.trigger 'login'

  # Add the first pane's model and controller if the user is logged in
  if session.userInfo.get('username')?
    session.addPane {}, null
    session.addPane {}, null
)