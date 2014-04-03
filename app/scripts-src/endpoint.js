(function() {
  $('document').ready((function(_this) {
    return function() {
      var authController, navbar, session;
      session = new com.roost.RoostSession();
      authController = new com.roost.AuthenticationController({
        userInfo: session.userInfo,
        ticketManager: session.ticketManager
      });
      session.addPane({}, null);
      navbar = new com.roost.NavBar({
        session: session
      });
      navbar.render();
      $('body').append(navbar.$el);
      return session.userInfo.trigger('login');
    };
  })(this));

}).call(this);
