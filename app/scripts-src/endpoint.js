(function() {
  $('document').ready((function(_this) {
    return function() {
      var navbar, session;
      session = new com.roost.RoostSession();
      if (!session.isAuthenticated()) {
        session.doAuthentication();
      }
      session.addPane({}, null);
      navbar = new com.roost.NavBar({
        userInfo: session.userInfo
      });
      navbar.render();
      return $('body').append(navbar.$el);
    };
  })(this));

}).call(this);
