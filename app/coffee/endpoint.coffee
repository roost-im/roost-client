$('document').ready( =>
  # Create the session
  session = new com.roost.RoostSession()

  # Oh lawd this is so dirty but at least you can login on mobile this way
  $('body').append('<div class="login-cont"><button class="btn mobile-login">Login</button></div>')
  $('.mobile-login').click(() =>
    session.userInfo.trigger('login')
  )
  session.userInfo.once 'change', (=> $('.login-cont').hide())

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