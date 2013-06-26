"use strict";

var api, model, messageView, selectionTracker, ticketManager;  // For debugging.
document.addEventListener("DOMContentLoaded", function() {
  ticketManager = new TicketManager(CONFIG.webathena);

  var dialog = null;
  ticketManager.on("ticket-needed", function() {
    if (dialog)
      return;
    var dialogTemplate = document.getElementById(
      ticketManager.isLoggedIn() ? "renew-template" : "login-template");
    dialog = dialogTemplate.cloneNode(true);
    dialog.id = null;
    dialog.removeAttribute("hidden");

    dialog.querySelector(".login-button").addEventListener("click", function(ev) {
      ticketManager.ticketPromptIfNeeded();
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
  ticketManager.on("user-mismatch", function() {
    console.log("User mismatch do something useful");
  });
  ticketManager.on("webathena-error", function() {
    console.log("Webathena error do something useful");
  });


  api = new API(CONFIG.server, CONFIG.serverPrincipal, ticketManager);
  model = new MessageModel(api);
  messageView = new MessageView(model, document.getElementById("messagelist"));
  selectionTracker = new SelectionTracker(messageView);
  document.getElementById("messagelist").focus();

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
