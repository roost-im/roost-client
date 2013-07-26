"use strict";

function NetworkError(msg) {
  this.msg = msg;
}
NetworkError.prototype.toString = function() {
  return "Network error";
};
function HttpError(status, statusText, responseText) {
  this.status = status;
  this.statusText = statusText;
  this.responseText = responseText;
}
HttpError.prototype.toString = function() {
  return this.responseText;
};

function corsRequest(method, url, data) {
  var xhr = new XMLHttpRequest();
  if ("withCredentials" in xhr) {
    // XHR with CORS
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != "undefined") {
    // XDomainRequest for IE9.
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    return Q.reject("CORS not supported.");
  }

  var deferred = Q.defer();
  xhr.onload = function() {
    if (this.status == 200) {
      deferred.resolve(this.responseText);
    } else if (this.status) {
      deferred.reject(new HttpError(this.status, this.statusText,
                                    this.responseText));
    } else {
      deferred.reject(new NetworkError());
    }
  };
  xhr.onerror = function() {
    deferred.reject("Request failed");
  };

  if (data !== undefined) {
    // The server accepts text/plain as application/json. For CORS as
    // an optimization to avoid the preflight. For IE9
    // (XDomainRequest) as a necessity. (It accepts application/json
    // just fine too, of course.)
    if (xhr.setRequestHeader)
      xhr.setRequestHeader("Content-Type", "text/plain");
    xhr.send(JSON.stringify(data));
  } else {
    xhr.send();
  }
  return deferred.promise;
}

var SOCKET_PING_TIMER_VISIBLE = timespan.seconds(5);
var SOCKET_PING_TIMER_HIDDEN = timespan.minutes(1);
var SOCKET_PONG_TIMEOUT = timespan.seconds(5);

if (typeof document.hidden === "undefined") {
  if (window.console && console.log)
    console.log("Page visibility API not supported.");
}

function RoostSocket(sockJS) {
  RoostEventTarget.call(this);
  this.sockJS_ = sockJS;
  this.sockJS_.addEventListener("message", this.onMessage_.bind(this));
  this.sockJS_.addEventListener("close", this.onClose_.bind(this));

  this.ready_ = false;
  this.pingVisible_ = null;
  this.pingHidden_ = null;

  this.pongTimer_ = null;
  this.onVisibilityChangeCb_ = this.onVisibilityChange_.bind(this);
  document.addEventListener("visibilitychange", this.onVisibilityChangeCb_);
};
RoostSocket.prototype = Object.create(RoostEventTarget.prototype);
RoostSocket.prototype.sockJS = function() {
  return this.sockJS_;
};
RoostSocket.prototype.onMessage_ = function(ev) {
  // Heard from the server. Stop the pong timer.
  if (this.pongTimer_ != null) {
    clearTimeout(this.pongTimer_);
    this.pongTimer_ = null;
  }
  var msg = JSON.parse(ev.data);
  if (msg.type === 'ready') {
    this.ready_ = true;
    this.onVisibilityChangeCb_();
  }
  this.dispatchEvent(msg);
};
RoostSocket.prototype.send = function(msg) {
  this.sockJS_.send(JSON.stringify(msg));
};
RoostSocket.prototype.onVisibilityChange_ = function(ev) {
  if (!this.ready_)
    return;
  // Send a new ping if it's time to.
  if ((document.hidden && (this.pingHidden_ == null)) ||
      (!document.hidden && (this.pingVisible_ == null))) {
    this.sendPing_();
  }
};
RoostSocket.prototype.sendPing_ = function() {
  this.send({type: "ping"});

  // Refresh the pong timer, assuming there isn't already one. (If
  // there is, let it keep running.)
  if (this.pongTimer_ == null) {
    this.pongTimer_ = setTimeout(function() {
      // Didn't hear from the server for too long.
      if (window.console && console.log)
        console.log("No response from server");
      this.sockJS_.close();
    }.bind(this), SOCKET_PONG_TIMEOUT);
  }

  // Flag for whether the timeout for visible has passed. We do it
  // this way instead of creating and tearing down timers on
  // visibilitychange so that things don't act funny if visibility
  // state switches like crazy or something.
  if (this.pingVisible_ != null)
    clearTimeout(this.pingVisible_);
  this.pingVisible_ = setTimeout(function() {
    this.pingVisible_ = null;
    this.onVisibilityChange_();
  }.bind(this), SOCKET_PING_TIMER_VISIBLE);

  // Flag for whether the timeout for hidden has passed.
  if (this.pingHidden_ != null)
    clearTimeout(this.pingHidden_);
  this.pingHidden_ = setTimeout(function() {
    this.pingHidden_ = null;
    this.onVisibilityChange_();
  }.bind(this), SOCKET_PING_TIMER_HIDDEN);
};
RoostSocket.prototype.onClose_ = function(ev) {
  // Shut off all timers.
  if (this.pongTimer_ != null) {
    clearTimeout(this.pongTimer_);
    this.pongTimer_ = null;
  }
  if (this.pingVisible_ != null) {
    clearTimeout(this.pingVisible_);
    this.pingVisible_ = null;
  }
  if (this.pingHidden_ != null) {
    clearTimeout(this.pingHidden_);
    this.pingHidden_ = null;
  }
  // Stop listening for visibility changes.
  document.removeEventListener("visibilitychange", this.onVisibilityChangeCb_);
  this.ready_ = false;
};

var RECONNECT_DELAY = timespan.milliseconds(500);
var RECONNECT_TRIES = 10;

var TOKEN_REFRESH_TIMER = timespan.minutes(30);
var TOKEN_RENEW_SOFT = timespan.days(1);
var TOKEN_RENEW_HARD = timespan.minutes(5);

function API(urlBase, servicePrincipal, storageManager, ticketManager) {
  RoostEventTarget.call(this);

  this.urlBase_ = urlBase;
  this.storageManager_ = storageManager;
  this.ticketManager_ = ticketManager;
  this.peer_ = gss.Name.importName(servicePrincipal,
                                   gss.KRB5_NT_PRINCIPAL_NAME);

  this.token_ = null;
  this.tokenDeferred_ = Q.defer();
  this.tokenPending_ = false;

  this.socket_ = null;
  this.socketPending_ = false;
  this.reconnectDelay_ = RECONNECT_DELAY;
  this.reconnectTries_ = RECONNECT_TRIES;
  this.nextTailId_ = 1;

  setTimeout(this.tryConnectSocket_.bind(this), 0);

  this.loadTokenFromStorage_();
  this.storageManager_.addEventListener(
    "change", this.loadTokenFromStorage_.bind(this));

  this.userInfo_ = new UserInfo(this);

  window.setInterval(this.checkExpiredToken_.bind(this),
                     TOKEN_REFRESH_TIMER);

  // If we go online, try to reconnect then and there.
  window.addEventListener("online", this.tryConnectSocket_.bind(this));
}
API.prototype = Object.create(RoostEventTarget.prototype);

API.prototype.userInfo = function() {
  return this.userInfo_;
};

API.prototype.handleNewToken_ = function(token, expires) {
  // Save locally.
  this.token_ = { value: token, expires: expires };
  // Notify blockers.
  this.tokenDeferred_.resolve(token);
  this.tokenDeferred_ = Q.defer();
};

API.prototype.loadTokenFromStorage_ = function() {
  var data = this.storageManager_.data();
  if (data && data.token &&
      data.token.expires - new Date().getTime() > TOKEN_RENEW_HARD) {
    this.handleNewToken_(data.token.value, data.token.expires);
  }
};

API.prototype.checkExpiredToken_ = function() {
  if (this.token_ == null)
    return;
  // TODO(davidben): Is any of this complexity reeaaaally necessary?
  // With the tokens lasting that long, it seems this is more helpful
  // for just refreshing zephyr credentials slightly more frequently.
  var remaining = this.token_.expires - new Date().getTime();
  if (remaining < TOKEN_RENEW_SOFT) {
    this.refreshAuthToken_({interactive: false}, {
      nonModal: remaining > TOKEN_RENEW_HARD
    });
  }
};

API.prototype.refreshAuthToken_ = function(opts, data) {
  // Refresh ticket regardless of whether we have a pending request or
  // not. Previous one might not have been interactive, etc.
  this.ticketManager_.refreshTickets(opts, data);

  if (this.tokenPending_)
    return;
  this.tokenPending_ = true;
  this.ticketManager_.getTicket("server").then(function(ticket) {
    // TODO(davidben): Do we need to negotiate anything interesting?
    // Mutual auth could be useful but only with channel-binding and
    // only in a non-browser environment.
    var context = new gss.Context(this.peer_, gss.KRB5_MECHANISM, ticket, { });
    var gssToken = context.initSecContext(null);
    if (!context.isEstablished())
      throw "Context not established after one message!";

    // TODO(davidben): On auth error, reject the ticket and wait for a
    // new one? And on other errors, some sort of exponential back-off
    // I guess.
    var principal = ticket.client.toString();
    return corsRequest("POST", this.urlBase_ + "/v1/auth", {
      // Only used by fake auth mode.
      principal: principal,
      // Actual auth token.
      token: arrayutils.toBase64(gssToken),
      // TODO(davidben): Only do this for the initial one?
      createUser: true
    }).then(function(json) {
      this.tokenPending_ = false;
      var resp = JSON.parse(json);
      if (this.storageManager_.saveToken(principal,
                                         resp.authToken, resp.expires)) {
        this.handleNewToken_(resp.authToken, resp.expires);
      }
    }.bind(this));
  }.bind(this)).then(null, function(err) {
    this.tokenPending_ = false;
    // TODO(davidben): Error-handling!
    throw err;
  }.bind(this));
};

API.prototype.badToken_ = function(token) {
  if (window.console && console.log)
    console.log("Bad token!");
  if (this.token_ && this.token_.value == token) {
    this.token_ = null;
  }
};

API.prototype.getAuthToken_ = function(interactive) {
  if (this.token_ &&
      this.token_.expires - new Date().getTime() > TOKEN_RENEW_HARD) {
    return Q(this.token_.value);
  } else {
    this.refreshAuthToken_({interactive: interactive});
    return this.tokenDeferred_.promise;
  }
};

API.prototype.request = function(method, path, params, data, opts, isRetry) {
  opts = opts || { };
  var tokenPromise = this.getAuthToken_(opts.interactive);
  var credsPromise;
  if (opts.withZephyr) {
    this.ticketManager_.refreshTickets({interactive:true});
    credsPromise = this.ticketManager_.getTicket("zephyr");
  } else {
    credsPromise = Q();
  }
  params = Q(params); data = Q(data);
  return Q.all([tokenPromise, credsPromise, params, data]).then(function(ret) {
    var token = ret[0], credentials = ret[1], params = ret[2], data = ret[3];
    var url =
      this.urlBase_ + path + "?access_token=" + encodeURIComponent(token);
    for (var key in params) {
      url += "&" + key + "=" + encodeURIComponent(params[key]);
    }
    if (opts.withZephyr) {
      data.credentials = credentials.toDict();
    }
    return corsRequest(method, url, data).then(function(responseText) {
      return JSON.parse(responseText);
    }, function(err) {
      // 401 means we had a bad token (it may have expired). Refresh it.
      if (err instanceof HttpError && err.status == 401) {
        this.badToken_(token);
        // Retry the request after we get a new one. Only retry it
        // once though.
        if (!isRetry)
          return this.request(method, path, params, data, false, true);
      }
      throw err;
    }.bind(this));
  }.bind(this));
};

API.prototype.get = function(path, params, opts) {
  return this.request("GET", path, params, undefined, opts);
};

API.prototype.post = function(path, data, opts) {
  return this.request("POST", path, {}, data, opts);
};

API.prototype.socket = function() {
  return this.socket_;
};

API.prototype.allocateTailId = function() {
  return this.nextTailId_++;
};

API.prototype.tryConnectSocket_ = function() {
  if (this.socket_ || this.socketPending_)
    return;

  this.socketPending_ = true;
  this.getAuthToken_(false).then(function(token) {
    var socket = new RoostSocket(new SockJS(this.urlBase_ + "/v1/socket"));
    socket.sockJS().addEventListener("open", function() {
      socket.send({type: "auth", token: token});
    });

    var connected = false;
    var onReady = function() {
      socket.removeEventListener("ready", onReady);
      connected = true;
      this.socketPending_ = false;
      this.socket_ = socket;
      // Reset reconnect state.
      this.reconnectDelay_ = RECONNECT_DELAY;
      this.reconnectTries_ = RECONNECT_TRIES;

      this.dispatchEvent({type: "connect"});
    }.bind(this);
    socket.addEventListener("ready", onReady);

    var onClose = function(ev) {
      socket.sockJS().removeEventListener("close", onClose);
      if (window.console && console.log)
        console.log("Disconnected", ev);
      if (connected) {
        this.dispatchEvent({type: "disconnect"});
        this.socket_ = null;

        setTimeout(this.tryConnectSocket_.bind(this), this.reconnectDelay_);
      } else {
        this.socketPending_ = false;
        if (ev.code == 4003)
          this.badToken_(token);
        // Reconnect with exponential back-off.
        this.reconnectDelay_ *= 2;
        if (this.reconnectTries_-- > 0) {
          setTimeout(this.tryConnectSocket_.bind(this), this.reconnectDelay_);
        }
      }
    }.bind(this);
    socket.sockJS().addEventListener("close", onClose);
  }.bind(this), function(err) {
    // Failure to get auth token... should this also reconnect?
    this.socketPending_ = false;
    throw err;
  }.bind(this)).done();
};
