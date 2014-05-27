(function() {
  $('document').ready((function(_this) {
    return function() {
      var authController, messagePane, navbar, session, subController;
      session = new com.roost.RoostSession();
      authController = new com.roost.AuthenticationController({
        session: session,
        userInfo: session.userInfo,
        ticketManager: session.ticketManager
      });
      subController = new com.roost.SubscriptionController({
        api: session.api,
        userInfo: session.userInfo,
        subscriptions: session.subscriptions
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
        return session.addPane({});
      }
    };
  })(this));

}).call(this);
