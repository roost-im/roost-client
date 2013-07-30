"use strict";

// TODO(davidben): Make all this code not terrible. Seriously.

var api, model, messageView, selectionTracker, ticketManager, storageManager;  // For debugging.
document.addEventListener("DOMContentLoaded", function() {
  storageManager = new StorageManager();
  ticketManager = new TicketManager(CONFIG.webathena, storageManager);
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
  replyBox.getElementsByClassName(
    "zwrite-form"
  )[0].addEventListener("submit", function(ev) {
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
  replyBox.getElementsByClassName(
    "close-button"
  )[0].addEventListener("click", function(ev) {
    replyBox.setAttribute("hidden", "");
    messageList.focus();
  });
  replyBox.addEventListener("keydown", function(ev) {
    if (matchKey(ev, 27 /* ESC */)) {
      replyBox.setAttribute("hidden", "");
      messageList.focus();
    }
  });

  api = new API(CONFIG.server, CONFIG.serverPrincipal,
                storageManager, ticketManager);
  model = new MessageModel(api);
  var messageList = document.getElementById("messagelist");
  messageView = new MessageView(model, messageList);
  selectionTracker = new SelectionTracker(messageView);

  messageList.addEventListener("keydown", function(ev) {
    if (matchKey(ev, 82 /* r */)) {
      var msg = selectionTracker.selectedMessage_;
      if (msg) {
        ev.preventDefault();
        selectionTracker.ensureSelectionVisible_();

        var form = replyBox.getElementsByClassName("zwrite-form")[0];

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

      var form = replyBox.getElementsByClassName("zwrite-form")[0];

      form.class.value = "";
      form.instance.value = "";
      form.recipient.value = "";
      form.message.value = "";

      replyBox.removeAttribute("hidden");
      form.class.focus();
    }
  });

  messageList.focus();

  /* State-saving code: */
  var CHARCODE_a = 'a'.charCodeAt(0);
  function generateId() {
    var chars = [];
    for (var i = 0; i < 10; i++) {
      chars.push(String.fromCharCode(
        CHARCODE_a + Math.floor(Math.random() * 26)))
    }
    return chars.join("");
  }
  function getScrollState() {
    var scrollState = messageView.scrollState();
    if (scrollState == null)
      return null;
    var id = generateId();
    return {
      id: id,
      scroll: scrollState
    };
  }

  var loadState = true;
  api.userInfo().ready().then(function() {
    // TODO(davidben): Can we just move everything in here? It'd be
    // nice to not care about this state.
    var oldState = null;

    // True if the last save attempt had an empty cache. In that case,
    // don't throttle. As soon as cachechanged happens, just trigger
    // it.
    var needSave = false;
    var saveThrottler = new Throttler(function() {
      var state = getScrollState();
      if (state == null) {
        needSave = true;
        return;
      }
      needSave = false;
      api.userInfo().replaceScrollState(oldState, state);
      oldState = state;
    }, timespan.seconds(1));
    messageView.container().addEventListener("scroll", function(ev) {
      saveThrottler.request({ noThrottle: needSave });
    });
    messageView.addEventListener("cachechanged", function(ev) {
      if (needSave)
        saveThrottler.request({ noThrottle: true });
    });


    // TODO(davidben): Replace all this with more sensible AngularJS
    // code or something.
    var recentStates = document.getElementById("recent-states");
    recentStates.addEventListener("change", function() {
      var option = recentStates.options[recentStates.selectedIndex];
      if (!option.roostState)
        return;
      oldState = option.roostState;
      messageView.changeFilter(new Filter(oldState.scroll.filter));
      messageView.scrollToMessage(oldState.scroll.id, {
        offset: oldState.scroll.offset
      });
    });
    function loadPositions() {
      var scrollStates = api.userInfo().scrollStates();
      recentStates.textContent = "";

      var option = document.createElement("option");
      option.textContent = "Recent positions";
      recentStates.appendChild(option);

      for (var i = scrollStates.length - 1; i >= 0; i--) {
        option = document.createElement("option");
        option.textContent =
          new Date(scrollStates[i].scroll.receiveTime).toString();
        // Bah.
        option.roostState = scrollStates[i];
        recentStates.appendChild(option);
      }
    }
    api.userInfo().addEventListener("change", loadPositions);
    loadPositions();

    // Bootstrap everything, if needed.
    if (loadState) {
      var states = api.userInfo().scrollStates();
      if (states.length) {
        oldState = states[states.length - 1];
        messageView.changeFilter(new Filter(oldState.scroll.filter));
        messageView.scrollToMessage(oldState.scroll.id, {
          offset: oldState.scroll.offset
        });
      } else {
        messageView.scrollToBottom();
        saveThrottler.request();
      }
    }
  }).done();

  document.getElementById("reset-view").addEventListener("click", function(ev) {
    ev.preventDefault();
    // TODO(davidben): Figure out the right anchor! Probably the last
    // guy you clicked on if it's still in view? I dunno.
    messageView.changeFilter(new Filter({}));
  });

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
});
