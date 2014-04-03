(function() {
  $('document').ready((function(_this) {
    return function() {
      var session;
      session = new com.roost.RoostSession();
      if (!session.isAuthenticated()) {
        session.doAuthentication();
      }
      return session.addPane({}, null);
    };
  })(this));

}).call(this);
