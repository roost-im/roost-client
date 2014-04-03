$('document').ready( =>
  # Create the session
  session = new com.roost.RoostSession()

  # If not authenticated -> do authentication
  if !session.isAuthenticated()
    session.doAuthentication()

  # Add the first pane's model and controller
  session.addPane {}, null

  # Create the views
  navbar = new com.roost.NavBar
    userInfo: session.userInfo
  navbar.render()
  $('body').append(navbar.$el)
)