"use strict"

function webathenaRequest(webathenaRoot, params) {
  var deferred = Q.defer();
  var channel = WinChan.open({
    url: webathenaRoot + "/#!request_ticket_v1",
    relay_url: webathenaRoot + "/relay.html",
    params: params
  }, function (err, r) {
    if (err) {
      deferred.reject(err);
      return;
    }
    if (r.status !== "OK") {
      deferred.reject(r);
      return;
    }
    deferred.resolve(r.sessions.map(krb.Session.fromDict));
  });
  // Bah.
  return [deferred.promise, channel];
}

// TODO(davidben): Make this much much fancier. Periodically check on
// the state of tickets and emit an event when they're expiring. Also
// the iframe ticket renewal remember state thing Webathena-side. Yeah, I dunno.

var MINIMUM_LIFETIME = timespan.minutes(10);

function TicketManager(webathenaRoot, storageManager) {
  RoostEventTarget.call(this);

  this.webathenaRoot_ = webathenaRoot;
  this.storageManager_ = storageManager;

  this.sessions_ = null;
  this.waitForSession_ = Q.defer();
  this.pendingRequest_ = null;

  this.storageManager_.addEventListener(
    "change", this.loadFromStorage_.bind(this));
  this.loadFromStorage_();
}
TicketManager.prototype = Object.create(RoostEventTarget.prototype);

TicketManager.prototype.loadFromStorage_ = function() {
  var data = this.storageManager_.data();
  if (!data || !data.sessions)
    return;
  var sessions = {
    server: krb.Session.fromDict(data.sessions.server),
    zephyr: krb.Session.fromDict(data.sessions.zephyr)
  };
  if (sessions.server.timeRemaining() <= MINIMUM_LIFETIME ||
      sessions.zephyr.timeRemaining() <= MINIMUM_LIFETIME) {
    return;
  }
  this.handleNewSessions_(sessions);
};

TicketManager.prototype.refreshInteractive_ = function() {
  // If there is already a pending request, just focus it.
  if (this.pendingRequest_) {
    this.pendingRequest_.focus();
    return;
  }

  // Fire a new one.
  var r = webathenaRequest(this.webathenaRoot_, {
    services: [
      {
        principal: ["HTTP", "roost-api.mit.edu"],
        realm: CONFIG.realm
      },
      {
        principal: ["zephyr", "zephyr"],
        realm: CONFIG.realm
      }
    ]
  });
  var promise = r[0], channel = r[1];
  this.pendingRequest_ = channel;
  promise.then(function(ret) {
    this.pendingRequest_ = null;
    var sessions = {
      server: ret[0],
      zephyr: ret[1]
    };
    if (this.storageManager_.saveTickets(sessions)) {
      this.handleNewSessions_(sessions);
    }
  }.bind(this), function(err) {
    this.pendingRequest_ = null;
    this.dispatchEvent({
      type: "webathena-error",
      error: err
    });
  }.bind(this)).done();
};

TicketManager.prototype.handleNewSessions_ = function(sessions) {
  // Save locally.
  this.sessions_ = sessions;
  // Unblock any promises.
  this.waitForSession_.resolve(sessions);
  this.waitForSession_ = Q.defer();
};

TicketManager.prototype.getCachedTicket = function(which) {
  if (this.sessions_ &&
      this.sessions_[which].timeRemaining() > MINIMUM_LIFETIME) {
    return this.sessions_[which];
  }
  return null;
};

TicketManager.prototype.refreshTickets = function(opts, data) {
  opts = opts || {}; data = data || {};
  // If we have one saved, do nothing.
  if (this.getCachedTicket("server") != null &&
      this.getCachedTicket("zephyr") != null) {
    return;
  }

  if (opts.interactive) {
    this.refreshInteractive_();
  } else {
    // TODO(davidben): Later this may first query an iframe for
    // asynchronous non-interactive ticket and then dispatch
    // ticket-needed if it failed.
    setTimeout(function() {
      this.dispatchEvent({
        type: "ticket-needed",
        data: data
      });
    }.bind(this));
  }
};


TicketManager.prototype.getTicket = function(which) {
  var ticket = this.getCachedTicket(which);
  if (ticket != null)
    return Q(ticket);

  return this.waitForSession_.promise.then(function(sessions) {
    return sessions[which];
  });
};
