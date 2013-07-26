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

    var msgClass = this.class.value || 'message';
    var msgInstance = this.instance.value || 'personal';
    var msgRecipient = this.recipient.value;
    if (msgRecipient.indexOf("@") < 0)
      msgRecipient = msgRecipient + "@" + CONFIG.realm;
    var msgBody = this.message.value;

    var data = api.userInfo().ready().then(function() {
      var zsig = api.userInfo().get('zsig');
      zsig = (zsig == undefined) ? 'Sent from Roost' : zsig;
      return {
        message: {
          class: msgClass,
          instance: msgInstance,
          recipient: msgRecipient,
          opcode: '',
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

        form.class.value = (msg.class === "message") ? "" : msg.class;
        form.instance.value = (msg.instance === "personal") ? "" : msg.instance;
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

  document.getElementById("reset-view").addEventListener("click", function(ev) {
    ev.preventDefault();
    // TODO(davidben): Figure out the right anchor! Probably the last
    // guy you clicked on if it's still in view? I dunno.
    messageView.changeFilter(new Filter({}));
  });

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
