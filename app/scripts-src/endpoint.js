(function() {
  com.roost.PANE_LIMIT = 10;

  com.roost.ON_MOBILE = false;

  $('document').ready((function(_this) {
    return function() {
      var authController, loginView, messagePane, navbar, session, subController;
      vex.defaultOptions.className = 'vex-theme-top';
      session = new com.roost.RoostSession();
      if (window.mobilecheck()) {
        com.roost.PANE_LIMIT = 6;
        com.roost.ON_MOBILE = true;
      }
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
      loginView = new com.roost.LoginView({
        userInfo: session.userInfo
      });
      loginView.render();
      $('body').append(loginView.$el);
      messagePane = new com.roost.MessagePane({
        session: session,
        messageLists: session.messageLists
      });
      messagePane.render();
      $('body').append(messagePane.$el);
      if (session.userInfo.get('username') != null) {
        return session.loadState();
      }
    };
  })(this));

}).call(this);
