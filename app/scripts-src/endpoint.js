(function() {
  $('document').ready((function(_this) {
    return function() {
      var authController, messagePane, navbar, session, subController;
      session = new com.roost.RoostSession();
      $('body').append('<div class="login-cont"><button class="btn mobile-login">Login</button></div>');
      $('.mobile-login').click(function() {
        return session.userInfo.trigger('login');
      });
      session.userInfo.once('change', (function() {
        return $('.login-cont').hide();
      }));
      subController = new com.roost.SubscriptionController({
        api: session.api,
        userInfo: session.userInfo,
        subscriptions: session.subscriptions
      });
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
      if (session.userInfo.get('username') != null) {
        return session.addPane({});
      }
    };
  })(this));

}).call(this);
