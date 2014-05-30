(function() {
  var checkSettings;

  $('document').ready((function(_this) {
    return function() {
      var authController, loginView, messagePane, navbar, session, subController;
      session = new com.roost.RoostSession();
      checkSettings(session);
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
        session.addPane({});
      }
      return $(window).resize((function() {
        return checkSettings(session);
      }));
    };
  })(this));

  checkSettings = function(session) {
    var settingsModel;
    settingsModel = session.settingsModel;
    if ($('body').width() < 500) {
      return settingsModel.set({
        panes: false,
        keyboard: false,
        showNavbar: false
      });
    } else {
      return settingsModel.set({
        panes: true,
        keyboard: true,
        showNavbar: true
      });
    }
  };

}).call(this);
