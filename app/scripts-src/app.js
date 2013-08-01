"use strict";

// TODO(davidben): Make all this code not terrible. Seriously.

var api, model, messageView, selectionTracker, ticketManager, storageManager;  // For debugging.

var roostApp = angular.module("roostApp", []);

roostApp.controller("RoostController", ["$scope", function($scope) {
  var storageManager = new StorageManager();
  window.storageManager = storageManager;
  var ticketManager = new TicketManager(CONFIG.webathena, storageManager);
  window.ticketManager = ticketManager;

  $scope.principal = undefined;
  storageManager.principal().then(function(principal) {
    $scope.$apply(function() {
      $scope.principal = principal;
    });
  }).done();

  var dialog = null;
  ticketManager.addEventListener("ticket-needed", function(ev) {
    // TODO(davidben): check ev.data.nonModal for whether we should
    // pop open a modal dialog or not.
    if (dialog)
      return;
    var dialogTemplate = document.getElementById(
      storageManager.isLoggedIn() ? "renew-template" : "login-template");
    dialog = dialogTemplate.cloneNode(true);
    dialog.id = null;
    dialog.removeAttribute("hidden");

    dialog.querySelector(".login-button").addEventListener("click", function(ev) {
      ticketManager.refreshTickets({interactive: true});
    });

    // Close the dialog when we get our tickets.
    Q.all(
      [ticketManager.getTicket("server"), ticketManager.getTicket("zephyr")]
    ).then(function() {
      document.body.removeChild(dialog);
      dialog = null;
    }).done();

    document.body.appendChild(dialog);
  });
  ticketManager.addEventListener("webathena-error", function() {
    console.log("Webathena error do something useful");
  });
  storageManager.addEventListener("usermismatch", function() {
    console.log("User mismatch do something useful");
  });

  var replyBox = document.getElementById("reply-box");
  replyBox.querySelector(
    ".zwrite-form"
  ).addEventListener("submit", function(ev) {
    ev.preventDefault();

    var msgClass = this.class.value || "message";
    var msgInstance = this.instance.value || "personal";
    var msgRecipient = this.recipient.value;
    if (msgRecipient.indexOf("@") < 0)
      msgRecipient = msgRecipient + "@" + CONFIG.realm;
    var msgBody = this.message.value;

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
      replyBox.setAttribute("hidden", "");
      messageList.focus();
    }).done();
  });
  replyBox.querySelector(
    ".close-button"
  ).addEventListener("click", function(ev) {
    replyBox.setAttribute("hidden", "");
    messageList.focus();
  });
  replyBox.addEventListener("keydown", function(ev) {
    if (matchKey(ev, 27 /* ESC */)) {
      replyBox.setAttribute("hidden", "");
      messageList.focus();
    }
  });

  var api = new API(CONFIG.server, CONFIG.serverPrincipal,
                storageManager, ticketManager);
  window.api = api;
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

        var form = replyBox.querySelector(".zwrite-form");

        form.class.value = (msg.classKey === "message") ? "" : msg.class;
        form.instance.value = (msg.instanceKey === "personal") ? "" : msg.instance;
        form.message.value = "";
        if (msg.isPersonal && !msg.isOutgoing) {
          form.recipient.value = msg.sender;
        } else {
          form.recipient.value = msg.recipient;
        }

        replyBox.removeAttribute("hidden");
        form.message.focus();
      }
    } else if (matchKey(ev, 90 /* z */)) {
      ev.preventDefault();

      var form = replyBox.querySelector(".zwrite-form");

      form.class.value = "";
      form.instance.value = "";
      form.recipient.value = "";
      form.message.value = "";

      replyBox.removeAttribute("hidden");
      form.class.focus();
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
