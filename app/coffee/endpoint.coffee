$('document').ready( =>
  # Create the Roost session
  session = new com.roost.RoostSession()

  # If not authenticated -> do authentication
  if !session.isAuthenticated()
    session.doAuthentication()

  # Add the first pane's model and controller
  session.addPane {}, null

  # Create the Roost view
)