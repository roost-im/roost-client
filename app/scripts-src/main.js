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
  var form = replyBox.getElementsByClassName("zwrite-form")[0];

  replyBox.getElementsByClassName(
    "zwrite-send"
  )[0].addEventListener("click", function(ev) {
    var message = {
      class: null,
      instance: null,
      recipient: null,
      opcode: null,
      signature: null
    };
    for (var key in message)
      message[key] = document.getElementById("zwrite-" + key).textContent;
    if ([ message.class, message.instance, message.recipient ].join("|") ==
        "message|personal|") {
      console.log("noooo");
      return;
    }
    if (message.recipient.indexOf("@") < 0)
      message.recipient += "@" + CONFIG.realm;
    message.message = form.message.value;

    return api.post("/v1/zwrite", { message: message }, {
      withZephyr: true,
      interactive: true
    }).then(function(ret) {
      console.log("Sent:", ret.ack);
    }).finally(function() {
      hideForm(true);
      messageList.focus();
    }).done();
  });
  replyBox.getElementsByClassName(
    "close-button"
  )[0].addEventListener("click", function(ev) {
    hideForm(true);
    messageList.focus();
  });
  document.addEventListener("keydown", function(ev) {
    if (matchKey(ev, 27 /* ESC */)) {
      hideForm(true);
      messageList.focus();
    }
  });

  replyBox.getElementsByClassName(
    "send-button"
  )[0].addEventListener("click", function(ev) {
    ev.preventDefault();
    zwrite();
  });
  replyBox.getElementsByClassName(
    "filter-button"
  )[0].addEventListener("click", function(ev) {
    alert("you can't filter yet QvQ");
  });
  replyBox.getElementsByClassName(
    "unfilter-button"
  )[0].addEventListener("click", function(ev) {
    // TODO(davidben): Figure out the right anchor! Probably the last
    // guy you clicked on if it's still in view? I dunno.
    messageView.changeFilter(new Filter({}));
  });
  replyBox.getElementsByClassName(
    "logout-button"
  )[0].addEventListener("click", function(ev) {
    alert("you can't log out yet QvQ");
  });

  api = new API(CONFIG.server, CONFIG.serverPrincipal,
                storageManager, ticketManager);
  model = new MessageModel(api);
  var messageList = document.getElementById("messagelist");
  messageView = new MessageView(model, messageList);
  selectionTracker = new SelectionTracker(messageView);

  var snapBox = function() {
    var top = window.innerHeight - replyBox.offsetHeight;
    replyBox.style.bottom = top % 15 - 15 + "px";
    messageList.style.height = top + 15 + "px";
  };
  window.addEventListener("resize", snapBox);
  snapBox();

  var hideForm = function(hidep) {
    form.hidden = hidep;
    snapBox();

    var yawai = document.getElementById("yawai");
    for (var i = 100; i < 1000; i *= 2) {
      setTimeout(function() {
        yawai.textContent = yawai.textContent == " (^^^) " ?
          "//^^^\\\\" : " (^^^) ";
      }, i);
    }
  };

  ticketManager.getTicket("zephyr").then(function(ticket) {
    document.getElementById("user-display").textContent = ticket.client;
  });
  api.userInfo().ready().then(function() {
    var zsig = api.userInfo().get("zsig");
    zsig = (zsig == undefined) ? "Sent from Roost" : zsig;
    document.getElementById("zwrite-signature").textContent = zsig;
  });
  for (var field in { signature: null, opcode: null }) {
    var element = document.getElementById("collapse-" + field);
    var label = element.getElementsByTagName("label")[0];
    label.addEventListener("click", function(ev) {
      if (this.className) {
        this.className = "";
      } else {
        this.className = "collapsed";
      }
    }.bind(element));
  }

  var zwrite = function() {
    document.getElementById('zwrite-class').textContent = "message";
    document.getElementById('zwrite-instance').textContent = "personal";
    form.message.value = "";
    document.getElementById('zwrite-recipient').textContent = "";

    hideForm(false);
    document.getElementById('zwrite-class').focus();
  };
  messageList.addEventListener("keydown", function(ev) {
    if (matchKey(ev, 82 /* r */)) {
      var msg = selectionTracker.selectedMessage_;
      if (msg) {
        ev.preventDefault();
        selectionTracker.ensureSelectionVisible_();

        document.getElementById('zwrite-class').textContent = msg.class;
        document.getElementById('zwrite-instance').textContent = msg.instance;
        form.message.value = "";
        document.getElementById('zwrite-recipient').textContent = stripRealm(
          (msg.isPersonal && !msg.isOutgoing) ? msg.sender : msg.recipient);

        hideForm(false);
        form.message.focus();
      }
    } else if (matchKey(ev, 90 /* z */)) {
      ev.preventDefault();
      zwrite();
    } else if (matchKey(ev, 73 /* i */)) {
      var msg = selectionTracker.selectedMessage_;
      if (msg) {
        console.log(msg);
      }
    }
  });

  messageList.focus();

  if (/#msg-/.test(location.hash)) {
    var msgId = location.hash.substring(5);
    messageView.scrollToMessage(msgId);
    selectionTracker.selectMessage(msgId);
  } else {
    messageView.scrollToBottom();
  }

  window.addEventListener("hashchange", function(ev) {
    if (/#msg-/.test(location.hash)) {
      var msgId = location.hash.substring(5);
      messageView.scrollToMessage(msgId);
      selectionTracker.selectMessage(msgId);
    }
  });
});
