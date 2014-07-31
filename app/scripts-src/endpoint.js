(function() {
  com.roost.PANE_LIMIT = 10;

  com.roost.ON_MOBILE = false;

  $('document').ready((function(_this) {
    return function() {
      var authController, loginView, messagePane, navbar, session, settingsController, settingsPanel, subController;
      session = new com.roost.RoostSession();
      if (window.mobilecheck()) {
        com.roost.PANE_LIMIT = 6;
        com.roost.ON_MOBILE = true;
      }
      subController = new com.roost.SubscriptionController({
        api: session.api,
        userInfoModel: session.userInfoModel,
        subscriptions: session.subscriptions
      });
      settingsController = new com.roost.SettingsController({
        userState: session.userState,
        userInfoModel: session.userInfoModel,
        userSettingsModel: session.userSettingsModel
      });
      authController = new com.roost.AuthenticationController({
        session: session,
        userInfoModel: session.userInfoModel,
        ticketManager: session.ticketManager
      });
      navbar = new com.roost.NavBar({
        session: session
      });
      navbar.render();
      $('body').append(navbar.$el);
      loginView = new com.roost.LoginView({
        userInfoModel: session.userInfoModel
      });
      loginView.render();
      $('body').append(loginView.$el);
      messagePane = new com.roost.MessagePane({
        session: session,
        messageLists: session.messageLists
      });
      messagePane.render();
      $('body').append(messagePane.$el);
      settingsPanel = new com.roost.SettingsPanel({
        session: session,
        subscriptions: session.subscriptions,
        userSettingsModel: session.userSettingsModel,
        uiState: session.uiStateModel,
        userState: session.userState
      });
      settingsPanel.render();
      $('body').append(settingsPanel.$el);
      if (session.userInfoModel.get('username') != null) {
        return session.loadState();
      }
    };
  })(this));

}).call(this);
