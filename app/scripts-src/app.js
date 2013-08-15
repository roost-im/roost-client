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

roostApp.directive("bootstrapTooltip", [function() {
  return {
    restrict: "A",
    link: function(scope, element, attrs) {
      element.tooltip();
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
  // Color palette from
  // http://tango.freedesktop.org/Tango_Icon_Theme_Guidelines which is
  // public domain and seems pretty enough.
  var COLORS = [["#fce94f", 0],
                ["#fcaf3e", 0],
                ["#e9b96e", 0],
                ["#8ae234", 0],
                ["#729fcf", 0],
                ["#ad7fa8", 1],
                ["#ef2929", 1],
                ["#edd400", 0],
                ["#f57900", 1],
                ["#c17d11", 1],
                ["#73d216", 0],
                ["#3465a4", 1],
                ["#75507b", 1],
                ["#cc0000", 1],
                ["#c4a000", 1],
                ["#ce5c00", 1],
                ["#8f5902", 1],
                ["#4e9a06", 1],
                ["#204a87", 1],
                ["#5c3566", 1],
                ["#a40000", 1],
                ["#eeeeec", 0],
                ["#d3d7cf", 0],
                ["#babdb6", 0],
                ["#888a85", 1],
                ["#555753", 1],
                ["#2e3436", 1]
               ];
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
        element[0].style.backgroundColor = COLORS[hash][0];
        element[0].style.color = COLORS[hash][1] ? "white" : "black";
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
roostApp.filter("wrapText", [function() {
  return wrapText;
}]);
roostApp.filter("gravatar", [function() {
  return function(principal, size) {
    size = Number(size);
    try {
      var obj = krb.Principal.fromString(principal);
      if (obj.realm == "ATHENA.MIT.EDU") {
        principal = obj.nameToString() + "@mit.edu";
      }
    } catch (e) {
      if (window.console && console.error)
        console.error("Failed to parse principal", e);
    }
    // 1. Trim leading and trailing whitespace from an email address.
    principal = principal.replace(/^\s+/, '');
    principal = principal.replace(/\s+$/, '');
    // 2. Force all characters to lower-case.
    principal = principal.toLowerCase();
    // 3. md5 hash the final string.
    var hash = CryptoJS.enc.Hex.stringify(
      CryptoJS.MD5(CryptoJS.enc.Utf8.parse(principal)));
    var ret = "https://secure.gravatar.com/avatar/" + hash + "?d=identicon";
    if (size)
      ret += "&s=" + size;
    return ret;
  };
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
  $scope.ticketNeededModal = false;
  $scope.ticketNeededDemon = false;
  ticketManager.addEventListener("ticket-needed", function(ev) {
    if (!$scope.ticketNeeded) {
      // Ticket no longer needed when we get our tickets.
      Q.all(
        [ticketManager.getTicket("server"), ticketManager.getTicket("zephyr")]
      ).then(function() {
        $scope.$apply(function() {
          $scope.ticketNeeded = false;
          $scope.ticketNeededModal = false;
          $scope.ticketNeededDemon = false;
        });
      }).done();
    }

    $scope.$apply(function() {
      $scope.ticketNeeded = true;
      if (!ev.data.nonModal)
        $scope.ticketNeededModal = true;
      if (ev.data.innerDemon)
        $scope.ticketNeededDemon = true;
    });

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
  $scope.replyWrapText = true;
  $scope.replySending = false;

  $scope.hideReplyBox = function() {
    $scope.showReplyBox = false;
    $scope.focusClass = $scope.focusMessage = false;

    $scope.replyClass = "";
    $scope.replyInstance = "";
    $scope.replyRecipient = "";
    $scope.replyMessage = "";
    $scope.replyWrapText = true;
    $scope.replySending = false;

    // TODO(davidben): Ugh, really?
    document.activeElement.blur();
  };

  $scope.sendZwrite = function(msg) {
    var data = api.userInfo().ready().then(function() {
      var zsig = api.userInfo().get("zsig");
      zsig = (zsig == undefined) ? "Sent from Roost" : zsig;
      var message = msg.message;
      // Bah.
      if (msg.wrapText)
        message = wrapText(message);
      return {
        message: {
          class: msg.class,
          instance: msg.instance,
          recipient: msg.recipient,
          opcode: "",
          signature: zsig,
          message: message
        }
      };
    });
    $scope.replySending = true;
    api.post("/v1/zwrite", data, {
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
      // Make sure $scope.selection is up-to-date. Because Angular is
      // unbearably slow, we're not doing a full digest on many
      // operations.
      //
      // TODO(davidben): This is dumb. Can I rip the message scopes
      // out of the main scope tree and manage those manually?
      $scope.$digest();

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
    } else if (matchKey(ev, 78 /* n */, {altKey:true})) {
      $scope.$apply(function() {
        if ($scope.$broadcast("narrowSelection", false, true).defaultPrevented)
          ev.preventDefault();
      });
    } else if (matchKey(ev, 78 /* n */, {altKey:true, shiftKey:true})) {
      $scope.$apply(function() {
        if ($scope.$broadcast("narrowSelection", true, true).defaultPrevented)
          ev.preventDefault();
      });
    } else if (matchKey(ev, 77 /* m */, {altKey:true})) {
      $scope.$apply(function() {
        if ($scope.$broadcast("narrowSelection", false, false).defaultPrevented)
          ev.preventDefault();
      });
    } else if (matchKey(ev, 77 /* m */, {altKey:true, shiftKey:true})) {
      $scope.$apply(function() {
        if ($scope.$broadcast("narrowSelection", true, false).defaultPrevented)
          ev.preventDefault();
      });
    } else if (matchKey(ev, 80 /* p */, {altKey:true})) {
      $scope.$apply(function() {
        if ($scope.$broadcast("changeFilter",
                              new Filter({is_personal:true}),
                              true).defaultPrevented) {
          ev.preventDefault();
        }
      });
    } else if (matchKey(ev, 86 /* v */, {shiftKey:true})) {
      $scope.$apply(function() {
        if ($scope.$broadcast("changeFilter",
                              new Filter({}), true).defaultPrevented) {
          ev.preventDefault();
        }
      });
    } else if (matchKey(ev, 188 /* < */, {shiftKey:true})) {
      $scope.$apply(function() {
        $scope.$broadcast("scrollToTop");
        ev.preventDefault();
      });
    } else if (matchKey(ev, 190 /* > */, {shiftKey:true})) {
      $scope.$apply(function() {
        $scope.$broadcast("scrollToBottom");
        ev.preventDefault();
      });
    }
  });

  $scope.scrollStates = [];

  // Because Angular is too slow.
  var scrollStateThrottle = new Throttler(function() {
    $scope.$apply(function() {
      $scope.scrollStates = api.userInfo().scrollStates();
    });
  }, timespan.seconds(2));
  api.userInfo().addEventListener("change", function() {
    scrollStateThrottle.request();
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
    // HACK: The controller isn't there yet.
    setTimeout(function() {
      $scope.$broadcast("scrollToMessage", location.hash.substring(5));
    });
  }
  // Otherwise, we'll wait for api.ready() to tell us where to scroll
  // to.

  window.addEventListener("hashchange", function(ev) {
    if (/#msg-/.test(location.hash)) {
      $scope.$broadcast("scrollToMessage", location.hash.substring(5));
    }
  });
}]);
