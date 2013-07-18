"use strict";

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


  api = new API(CONFIG.server, CONFIG.serverPrincipal,
                storageManager, ticketManager);
  model = new MessageModel(api);
  messageView = new MessageView(model, document.getElementById("messagelist"));
  selectionTracker = new SelectionTracker(messageView);
  document.getElementById("messagelist").focus();

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
