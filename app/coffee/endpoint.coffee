$('document').ready( =>
  # Create the session
  session = new com.roost.RoostSession()

  # Create the auth controller
  authController = new com.roost.AuthenticationController
    userInfo: session.userInfo
    ticketManager: session.ticketManager

  # Add the first pane's model and controller
  session.addPane {}, null

  # Create the views
  navbar = new com.roost.NavBar
    session: session
  navbar.render()
  $('body').append(navbar.$el)

  # Trigger login for the user
  session.userInfo.trigger 'login'
)