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

function RoostSocket(sockJS) {
  EventEmitter.call(this);
  this.sockJS_ = sockJS;
  this.sockJS_.addEventListener("message", this.onMessage_.bind(this));
};
RoostSocket.prototype = Object.create(EventEmitter.prototype);
RoostSocket.prototype.sockJS = function() {
  return this.sockJS_;
};
RoostSocket.prototype.onMessage_ = function(ev) {
  var msg = JSON.parse(ev.data);
  this.emit(msg.type, msg);
};
RoostSocket.prototype.send = function(msg) {
  this.sockJS_.send(JSON.stringify(msg));
};

var RECONNECT_DELAY = 500;
var RECONNECT_TRIES = 10;

function API(urlBase, servicePrincipal, ticketManager) {
  EventEmitter.call(this);

  this.urlBase_ = urlBase;
  this.ticketManager_ = ticketManager;
  this.peer_ = gss.Name.importName(servicePrincipal,
                                   gss.KRB5_NT_PRINCIPAL_NAME);

  this.tokenPromise_ = null;

  this.socket_ = null;
  this.socketPending_ = false;
  this.reconnectDelay_ = RECONNECT_DELAY;
  this.reconnectTries_ = RECONNECT_TRIES;
  this.nextTailId_ = 1;

  setTimeout(this.tryConnectSocket_.bind(this), 0);

  // If we go online, try to reconnect then and there.
  window.addEventListener("online", this.tryConnectSocket_.bind(this));
}
API.prototype = Object.create(EventEmitter.prototype);

API.prototype.refreshAuthToken_ = function(interactive) {
  return this.ticketManager_.getTicket(
    "server", interactive
  ).then(function(ticket) {
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
    return corsRequest("POST", this.urlBase_ + "/v1/auth", {
      principal: ticket.client.toString(),
      token: arrayutils.toBase64(gssToken),
      // TODO(davidben): Only do this for the initial one?
      createUser: true
    });
  }.bind(this)).then(function(json) {
    var resp = JSON.parse(json);
    return resp.authToken;
  }.bind(this));
};

API.prototype.badToken_ = function(token) {
  console.log("Bad token!");
  if (this.tokenPromise_ &&
      Q.isFulfilled(this.tokenPromise_) &&
      this.tokenPromise_.valueOf() == token) {
    this.tokenPromise_ = null;
  }
};

API.prototype.getAuthToken_ = function(interactive) {
  if (this.tokenPromise_ == null) {
    this.tokenPromise_ = this.refreshAuthToken_(interactive);
  } else if (interactive && Q.isPending(this.tokenPromise_)) {
    // Silly hack: in case the existing tokenPromise_ was not created
    // interactively, at least we can use that now.
    this.ticketManager_.ticketPromptIfNeeded("server");
  }
  return this.tokenPromise_;
};

API.prototype.request = function(method, path, params, data, opts, isRetry) {
  opts = opts || { };
  var tokenPromise = this.getAuthToken_(opts.interactive);
  var credsPromise = opts.withZephyr ?
    this.ticketManager_.getTicket("zephyr", opts.interactive) : Q();
  return Q.all([tokenPromise, credsPromise]).then(function(ret) {
    var token = ret[0], credentials = ret[1];
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
        // TODO(davidben): Retry the request after we get a new
        // one. Only retry it once though.
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
    socket.once("ready", function() {
      connected = true;
      this.socketPending_ = false;
      this.socket_ = socket;
      // Reset reconnect state.
      this.reconnectDelay_ = RECONNECT_DELAY;
      this.reconnectTries_ = RECONNECT_TRIES;

      this.emit("connect");
    }.bind(this));

    var onClose = function(ev) {
      socket.sockJS().removeEventListener("close", onClose);
      console.log("Disconnected", ev);
      if (connected) {
        this.emit("disconnect");
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
