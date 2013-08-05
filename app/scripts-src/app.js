"use strict";

function matchKey(ev, keyCode, mods) {
  if (ev.keyCode != keyCode)
    return false;
  mods = mods || { };
  var modifiers = ["altKey", "altGraphKey", "ctrlKey", "metaKey", "shiftKey"];
  for (var i = 0; i < modifiers.length; i++) {
    if (Boolean(ev[modifiers[i]]) != Boolean(mods[modifiers[i]]))
      return false;
  }
  return true;
}

// TODO(davidben): Make all this code not terrible. Seriously.

var roostApp = angular.module("roostApp", []);

roostApp.value("config", CONFIG);

roostApp.service("localStorage", [function() {
  return new LocalStorageWrapper();
}]);

roostApp.service("storageManager", ["localStorage", function(localStorage) {
  return new StorageManager(localStorage);
}]);

roostApp.service("ticketManager", ["storageManager", "config",
function(storageManager, config) {
  return new TicketManager(config.webathena, storageManager);
}]);

roostApp.service("api", ["config", "storageManager", "ticketManager",
function(config, storageManager, ticketManager) {
  return new API(config.server, config.serverPrincipal,
                 storageManager, ticketManager);
}]);

roostApp.directive("showModal", [function() {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      scope.$watch(attrs.showModal, function(value) {
        element.modal(value ? "show" : "hide");
      });
    }
  };
}]);

roostApp.directive("focusOn", ["$parse", function($parse) {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      var idx = attrs.focusOn.indexOf(";");
      var wait, condition;
      if (idx < 0) {
        wait = attrs.focusOn;
        condition = null;
      } else {
        wait = attrs.focusOn.substring(0, idx);
        condition = $parse(attrs.focusOn.substring(idx + 1));
      }

      scope.$watch(wait, function(newValue, oldValue) {
        newValue = !!newValue; oldValue = !!oldValue;
        if (newValue && newValue !== oldValue) {
          if (!condition || scope.$eval(condition)) {
            // Do it in an $evalAsync so that the DOM has had a chance
            // to react too.
            scope.$evalAsync(function() {
              element.focus();
            });
          }
        }
      });
    }
  }
}]);

roostApp.directive("onKeydown", ["$parse", function($parse) {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      var fn = $parse(attrs.onKeydown);
      element.on("keydown", function(event) {
        scope.$apply(function() {
          fn(scope, {$event:event});
        });
      });
    }
  }
}]);

// TODO(davidben): Dumb thing to get rid of later.
roostApp.directive("randomColorKey", [function() {
  var COLORS = ["black", "maroon", "red",
                "purple", "fuchsia", "green", "blue"];
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      if (element[0].nodeType !== Node.ELEMENT_NODE)
        return;
      attrs.$observe("randomColorKey", function(value) {
        var hash = 0;
        for (var i = 0; i < value.length; i++) {
          // Dunno, borrowed from some random thing on the Internet
          // that claims to be Java's.
          hash = ((hash << 5) - hash + value.charCodeAt(i)) | 0;
        }
        hash = hash % COLORS.length;
        if (hash < 0)
          hash += COLORS.length;
        element[0].style.color = COLORS[hash];
      });
    }
  };
}]);

roostApp.directive("bindZtext", [function() {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      attrs.$observe("bindZtext", function(value) {
        element.text("");
        element.append(ztextToDOM(parseZtext(value)));
      });
    }
  };
}]);

roostApp.filter("shortZuser", [function() {
  return shortZuser;
}]);
roostApp.filter("longZuser", [function() {
  return longZuser;
}]);
roostApp.filter("urlencode", [function() {
  return encodeURIComponent;
}]);

roostApp.controller("RoostController",
                    ["$scope", "storageManager", "ticketManager", "api",
function($scope, storageManager, ticketManager, api) {
  window.storageManager = storageManager;  // DEBUG
  window.ticketManager = ticketManager;  // DEBUG
  window.api = api;  // DEBUG

  $scope.principal = undefined;
  $scope.isLoggedIn = false;
  storageManager.principal().then(function(principal) {
    $scope.$apply(function() {
      $scope.principal = principal;
      $scope.isLoggedIn = true;
    });
  }).done();

  $scope.refreshTicketsInteractive = function() {
    ticketManager.refreshTickets({interactive: true});
  };

  $scope.ticketNeeded = false;
  ticketManager.addEventListener("ticket-needed", function(ev) {
    $scope.$apply(function() {
      $scope.ticketNeeded = true;
    });
    // Ticket no longer needed when we get our tickets.
    Q.all(
      [ticketManager.getTicket("server"), ticketManager.getTicket("zephyr")]
    ).then(function() {
      $scope.$apply(function() {
        $scope.ticketNeeded = false;
      });
    }).done();

    // TODO(davidben): check ev.data.nonModal for whether we should
    // pop open a modal dialog or not.
  });

  ticketManager.addEventListener("webathena-error", function() {
    console.log("Webathena error do something useful");
  });
  storageManager.addEventListener("usermismatch", function() {
    console.log("User mismatch do something useful");
  });

  // TODO(davidben): Move this to a separate controller?
  $scope.showReplyBox = false;
  $scope.focusClass = false;
  $scope.focusMessage = false;
  $scope.replyClass = "";
  $scope.replyInstance = "";
  $scope.replyRecipient = "";
  $scope.replyMessage = "";

  $scope.hideReplyBox = function() {
    $scope.showReplyBox = false;
    $scope.focusClass = $scope.focusMessage = false;

    $scope.replyClass = "";
    $scope.replyInstance = "";
    $scope.replyRecipient = "";
    $scope.replyMessage = "";

    // TODO(davidben): Ugh, really?
    document.activeElement.blur();
  };

  $scope.sendZwrite = function(msg) {
    var data = api.userInfo().ready().then(function() {
      var zsig = api.userInfo().get("zsig");
      zsig = (zsig == undefined) ? "Sent from Roost" : zsig;
      return {
        message: {
          class: msg.class,
          instance: msg.instance,
          recipient: msg.recipient,
          opcode: "",
          signature: zsig,
          message: msg.message
        }
      };
    });
    return api.post("/v1/zwrite", data, {
      withZephyr: true,
      interactive: true
    }).then(function(ret) {
      console.log("Sent:", ret.ack);
    }).finally(function() {
      $scope.$apply(function() {
        $scope.hideReplyBox();
      });
    }).done();
  };

  // TODO(davidben): This is a silly thing to put in a
  // controller. Pull in some fancy directive like angular-ui's
  // keypress.
  $scope.replyBoxKeydown = function(ev) {
    if (matchKey(ev, 27 /* ESC */)) {
      ev.preventDefault();
      $scope.hideReplyBox();
    }
  };

  $scope.model = new MessageModel(api);
  window.model = $scope.model;  // DEBUG

  window.addEventListener("keydown", function(ev) {
    if (ev.target !== document.body)
      return;

    if (matchKey(ev, 82 /* r */)) {
      var msg = $scope.selection;
      if (msg) {
        ev.preventDefault();
        $scope.$broadcast("ensureSelectionVisible");

        $scope.$apply(function() {
          $scope.showReplyBox = true;
          $scope.focusMessage = true;

          $scope.replyClass = (msg.classKey === "message") ? "" : msg.class;
          $scope.replyInstance =
            (msg.instanceKey === "personal") ? "" : msg.instance;
          if (msg.isPersonal && !msg.isOutgoing) {
            $scope.replyRecipient = msg.sender;
          } else {
            $scope.replyRecipient = msg.recipient;
          }
          $scope.replyRecipient = shortZuser($scope.replyRecipient);
        });
      }
    } else if (matchKey(ev, 90 /* z */)) {
      ev.preventDefault();

      $scope.$apply(function() {
        $scope.showReplyBox = true;
        $scope.focusClass = true;
      });
    }
  });

  $scope.scrollStates = [];
  api.userInfo().addEventListener("change", function() {
    $scope.$apply(function() {
      $scope.scrollStates = api.userInfo().scrollStates();
    });
  });

  var loadState = true;

  $scope.setScrollState = function(state) {
    $scope.$broadcast("setScrollState", state);
  };

  // Only save state when the user info is ready.
  api.userInfo().ready().then(function() {
    // Bootstrap everything, if needed.
    if (loadState) {
      var states = api.userInfo().scrollStates();
      if (states.length) {
        $scope.$broadcast("setScrollState", states[0]);
      } else {
        $scope.$broadcast("scrollToBottom");
      }
    }
    $scope.$broadcast("apiReady");
  }).done();

  $scope.$on("replaceScrollState", function(ev, oldState, state) {
    api.userInfo().replaceScrollState(oldState, state);
  });

  $scope.resetView = function() {
    // TODO(davidben): Figure out the right anchor! Probably the last
    // guy you clicked on if it's still in view? I dunno.
    $scope.$broadcast("changeFilter", new Filter({}));
  };

  if (/#msg-/.test(location.hash)) {
    loadState = false;
    $scope.$broadcast("scrollToMessage", location.hash.substring(5));
  }
  // Otherwise, we'll wait for api.ready() to tell us where to scroll
  // to.

  window.addEventListener("hashchange", function(ev) {
    if (/#msg-/.test(location.hash)) {
      $scope.$broadcast("scrollToMessage", location.hash.substring(5));
    }
  });
}]);
