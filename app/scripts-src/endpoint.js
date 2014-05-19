(function() {
  $('document').ready((function(_this) {
    return function() {
      var authController, messagePane, navbar, session;
      session = new com.roost.RoostSession();
      authController = new com.roost.AuthenticationController({
        session: session,
        userInfo: session.userInfo,
        ticketManager: session.ticketManager
      });
      navbar = new com.roost.NavBar({
        session: session
      });
      navbar.render();
      $('body').append(navbar.$el);
      messagePane = new com.roost.MessagePane({
        session: session,
        messageLists: session.messageLists
      });
      messagePane.render();
      $('body').append(messagePane.$el);
      session.userInfo.trigger('login');
      if (session.userInfo.get('username') != null) {
        return session.addPane({}, null);
      }
    };
  })(this));

}).call(this);
