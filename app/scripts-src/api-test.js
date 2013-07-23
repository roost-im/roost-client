var storageManager = new StorageManager();
var ticketManager = new TicketManager(CONFIG.webathena, storageManager);
var api = new API(CONFIG.server, CONFIG.serverPrincipal,
                  storageManager, ticketManager);

var dialog = null;
ticketManager.addEventListener("ticket-needed", function() {
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

function checkCreds() {
  api.get("/v1/zephyrcreds").then(function(result) {
    if (result.needsRefresh) {
      log("Needs credential refresh");
    } else {
      log("Zephyr credentials up-to-date");
    }
  }, function(err) {
    log("Error checking inner demon status: " + err);
  }).done();
}

document.getElementById("clearlog").addEventListener("click", function(ev) {
  document.getElementById("log").textContent = "";
});

document.getElementById("subscribe").addEventListener("submit", function(ev) {
  ev.preventDefault();

  var msgClass = this.class.value;
  var msgInstance = this.instance.value;
  var msgRecipient = this.recipient.value;
  // TODO(davidben): Technically this value might not be available
  // yet. The login prompt should be modal, but ideally we'd only fill
  // this in when we get a ticket... allow passing a function as data?
  if (msgRecipient == "%me%")
    msgRecipient = storageManager.principal();

  var withZephyr = (msgRecipient && msgRecipient[0] !== '@') ? true : false;
  var data = {
    subscriptions: [{
      class: msgClass,
      instance: msgInstance,
      recipient: msgRecipient
    }],
  };
  return api.post("/v1/subscribe", data, {
    withZephyr: withZephyr,
    interactive: true
  }).then(function() {
    log("Subscribed to " + msgClass);
  }, function(err) {
    log("Failed to subscribed to " + msgClass + ": " + err);
    throw err;
  }).done();
});

document.getElementById("unsubscribe").addEventListener("submit", function(ev) {
  ev.preventDefault();

  var msgClass = this.class.value;
  var msgInstance = this.instance.value;
  var msgRecipient = this.recipient.value;
  // TODO(davidben): Technically this value might not be available
  // yet. The login prompt should be modal, but ideally we'd only fill
  // this in when we get a ticket... allow passing a function as data?
  if (msgRecipient == "%me%")
    msgRecipient = storageManager.principal();

  var data = {
    subscription: {
      class: msgClass,
      instance: msgInstance,
      recipient: msgRecipient
    }
  };
  api.post("/v1/unsubscribe", data, {interactive:true}).then(function() {
    log("Unsubscribed from " + msgClass);
  }, function(err) {
    log("Failed to unsubscribed from " + msgClass + ": " + err);
    throw err;
  }).done();
});

document.getElementById("getmessages").addEventListener("submit", function(ev) {
  ev.preventDefault();

  var params = {
    offset: this.offset.value,
    count: '10'
  };
  api.get("/v1/messages", params, {
    interactive:true
  }).then(function(result) {
    result.messages.forEach(function(msg) {
      log(msg.id + ": " + msg.class + " / " + msg.instance + " / " +
          msg.sender + " " + new Date(msg.time) + "\n" +
          msg.message + "\n");
    });
  }, function(err) {
    log("Failed to get messages: " + err);
  }).done();
});

document.getElementById("checkdemon").addEventListener("click", function(ev) {
  api.get("/v1/zephyrcreds", {}, {interactive:true}).then(function(result) {
    if (result.needsRefresh) {
      log("Needs credential refresh");
    } else {
      log("Zephyr credentials up-to-date");
    }
  }, function(err) {
    log("Error checking inner demon status: " + err);
  }).done();
});

document.getElementById("refreshcreds").addEventListener("click", function(ev) {
  api.post("/v1/zephyrcreds", {}, {
    withZephyr: true,
    interactive: true
  }).then(function() {
    log("Refreshed");
  }, function(err) {
    log("Error refreshing creds: " + err);
  }).done();
});

function log(msg) {
  document.getElementById("log").textContent += msg + "\n";
}

(function() {
  api.get("/v1/subscriptions").then(function(subs) {
    log("Currently subscribed to:");

    function compare(a, b) {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }
    function splitClassInst(a) {
      var uns = /^(?:un)*/.exec(a)[0];
      var ds = /(?:\.d)*$/.exec(a)[0];
      return [uns, a.substring(uns.length, a.length - ds.length), ds];
    }
    function compareClassInst(a, b) {
      var sa = splitClassInst(a);
      var sb = splitClassInst(b);
      return compare(sa[1], sb[1]) ||
        compare(sa[0].length, sb[0].length) ||
        compare(sb[2].length, sb[2].length);
    }
    subs.sort(function(a, b) {
      return compare(a.recipient, b.recipient) ||
        compareClassInst(a.classKey, b.classKey) ||
        compareClassInst(a.instanceKey, b.instanceKey);
    });

    subs.forEach(function(sub) {
      log(" <" + sub.class + "," + sub.instance + "," + sub.recipient + ">");
    });
  }, function(err) {
    log("Failed to get subscriptions: " + err);
    throw err;
  }).done();
  checkCreds();
})();
