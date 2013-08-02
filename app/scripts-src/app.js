"use strict";

// TODO(davidben): Make all this code not terrible. Seriously.

var api, model, messageView, selectionTracker, ticketManager, storageManager;  // For debugging.

var roostApp = angular.module("roostApp", []);

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

roostApp.filter("shortZuser", [function() {
  return shortZuser;
}]);
roostApp.filter("longZuser", [function() {
  return longZuser;
}]);

roostApp.controller("RoostController",
                    ["$scope", "storageManager", "ticketManager", "api",
function($scope, storageManager, ticketManager, api) {
  window.storageManager = storageManager;
  window.ticketManager = ticketManager;
  window.api = api;

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

    // FIXME
    messageList.focus();
  };

  // TODO(davidben): This should take a message as parameter and
  // stuff. Do all the defaults and stuff as filters.
  $scope.sendZwrite = function() {
    var msgClass = $scope.replyClass || "message";
    var msgInstance = $scope.replyInstance || "personal";
    var msgRecipient = longZuser($scope.replyRecipient);
    var msgBody = $scope.replyMessage;

    var data = api.userInfo().ready().then(function() {
      var zsig = api.userInfo().get("zsig");
      zsig = (zsig == undefined) ? "Sent from Roost" : zsig;
      return {
        message: {
          class: msgClass,
          instance: msgInstance,
          recipient: msgRecipient,
          opcode: "",
          signature: zsig,
          message: msgBody
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

  var model = new MessageModel(api);
  window.model = model;
  var messageList = document.getElementById("messagelist");
  var messageView = new MessageView(model, messageList);
  window.messageView = messageView;
  var selectionTracker = new SelectionTracker(messageView);
  window.selectionTracker = selectionTracker;

  messageList.addEventListener("keydown", function(ev) {
    if (matchKey(ev, 82 /* r */)) {
      var msg = selectionTracker.selectedMessage_;
      if (msg) {
        ev.preventDefault();
        selectionTracker.ensureSelectionVisible_();

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

  messageList.focus();

  $scope.scrollStates = [];
  api.userInfo().addEventListener("change", function() {
    $scope.$apply(function() {
      $scope.scrollStates = api.userInfo().scrollStates();
    });
  });

  var loadState = true;

  // How many pixels you have to scroll before we fork scroll state
  // ids.
  var FORK_CUTOFF = 125;

  var oldState = null;

  function getScrollState() {
    // How far are we from the old scroll state.
    var id, scrollTotal = Infinity;
    if (oldState) {
      var dist = messageView.distanceToScrollState(oldState.scroll);
      if (dist == null)
        return null;
      scrollTotal = dist + (oldState.scrollTotal || 0);
    }
    // Fork if far enough away.
    if (Math.abs(scrollTotal) > FORK_CUTOFF) {
      id = generateId();
      scrollTotal = 0;
    } else {
      id = oldState.id;
    }

    var scrollState = messageView.scrollState();
    if (scrollState == null)
      return null;
    return {
      id: id,
      scroll: scrollState,
      scrollTotal: scrollTotal
    };
  }

  // True if the last save attempt had an empty cache. In that case,
  // don't throttle. As soon as cachechanged happens, just trigger
  // it.
  var needSave = false, lockSave = true /* to be unlocked on userinfo ready* */;
  function unlockSave() {
    lockSave = false;
    if (needSave)
      saveThrottler.request({ noThrottle: true });
  }
  var saveThrottler = new Throttler(function() {
    if (lockSave) {
      needSave = true;
      return;
    }
    var state = getScrollState();
    if (state == null) {
      needSave = true;
      return;
    }
    needSave = false;
    api.userInfo().replaceScrollState(oldState, state);
    oldState = state;
  }, timespan.seconds(1));
  // TODO(davidben): Changing filters happens to trigger scroll
  // events, but we should be listening for that more explicitly.
  messageView.container().addEventListener("scroll", function(ev) {
    saveThrottler.request({ noThrottle: needSave });
  });
  messageView.addEventListener("cachechanged", function(ev) {
    if (needSave && !lockSave)
      saveThrottler.request({ noThrottle: true });
  });

  $scope.setScrollState = function(state) {
    lockSave = true;
    try {
      oldState = state;
      messageView.changeFilter(new Filter(oldState.scroll.filter));
      messageView.scrollToMessage(oldState.scroll.id, {
        offset: oldState.scroll.offset
      });
    } finally {
      unlockSave();
    }
  };

  // Only save state when the user info is ready.
  api.userInfo().ready().then(function() {
    // Bootstrap everything, if needed.
    if (loadState) {
      var states = api.userInfo().scrollStates();
      if (states.length) {
        oldState = states[0];
        messageView.changeFilter(new Filter(oldState.scroll.filter));
        messageView.scrollToMessage(oldState.scroll.id, {
          offset: oldState.scroll.offset
        });
      } else {
        messageView.scrollToBottom();
        saveThrottler.request();
      }
    }

    unlockSave();
  }).done();

  $scope.resetView = function() {
    // TODO(davidben): Figure out the right anchor! Probably the last
    // guy you clicked on if it's still in view? I dunno.
    messageView.changeFilter(new Filter({}));
  };

  if (/#msg-/.test(location.hash)) {
    loadState = false;
    var msgId = location.hash.substring(5);
    messageView.scrollToMessage(msgId);
    selectionTracker.selectMessage(msgId);
  }
  // Otherwise, we'll wait for api.ready() to tell us where to scroll
  // to.

  window.addEventListener("hashchange", function(ev) {
    if (/#msg-/.test(location.hash)) {
      var msgId = location.hash.substring(5);
      messageView.scrollToMessage(msgId);
      selectionTracker.selectMessage(msgId);
    }
  });
}]);
