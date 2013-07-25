"use strict";

// StorageManager has two purposes. First, because localStorage has
// questionable concurrency guarantees, we put everything under one
// key and only assume reads and writes are atomic. The second is to
// be the central place where we check what user all the storage is
// associated with.

function StorageManager() {
  RoostEventTarget.call(this);

  // Cached copy of the data.
  this.data_ = null;

  // Once we see a user mismatch, disable storage so we don't write to
  // it anymore.
  this.deferredPrincipal_ = Q.defer();
  this.expectedPrincipal_ = null;
  this.disabled_ = false;

  window.addEventListener("storage", this.loadFromStorage_.bind(this));
  this.loadFromStorage_();
};
StorageManager.prototype = Object.create(RoostEventTarget.prototype);

StorageManager.prototype.principalCheck_ = function(principal) {
  if (this.expectedPrincipal_ == null) {
    this.expectedPrincipal_ = principal;
    this.deferredPrincipal_.resolve(principal);
  } else if (this.expectedPrincipal_ != principal) {
    this.disabled_ = true;
    this.dispatchEvent({
      type: "usermismatch",
      actual: principal,
      expected: this.expectedPrincipal_
    });
    return false;
  }
  return true;
};

StorageManager.prototype.loadFromStorage_ = function() {
  var dataJson = localStorage.getItem("roostData");
  if (!dataJson) {
    // TODO(davidben): Set this.data_ to null? Maybe emit an event to
    // pick up the logout or something.
    return;
  }
  var data = JSON.parse(dataJson);
  if (this.principalCheck_(data.principal)) {
    this.data_ = data;
    this.dispatchEvent({type: "change"});
  }
};

StorageManager.prototype.data = function() {
  return this.data_;
};

StorageManager.prototype.isLoggedIn = function() {
  return this.expectedPrincipal_ != null;
};

StorageManager.prototype.principal = function() {
  return this.deferredPrincipal_.promise;
};

StorageManager.prototype.saveTickets = function(sessions) {
  var principal = sessions.server.client.toString();
  if (sessions.zephyr.client.toString() !== principal) {
    // Uhh... what?
    throw "Zephyr and server tickets don't match!";
  }

  if (this.disabled_)
    return;

  var goodUser = this.principalCheck_(principal);
  if (goodUser) {
    this.data_ = this.data_ || { };
  } else {
    // Save it anyway, but blow everything away. We'll ask the user to
    // refresh to pick the changes up.
    this.data_ = { };
  }
  this.data_.principal = principal;
  this.data_.sessions = {
    server: sessions.server.toDict(),
    zephyr: sessions.zephyr.toDict()
  };
  localStorage.setItem("roostData", JSON.stringify(this.data_));

  this.dispatchEvent({type: "change"});
  return goodUser;
};

StorageManager.prototype.saveToken = function(principal, token, expires) {
  if (this.disabled_)
    return;

  var goodUser = this.principalCheck_(principal);
  if (goodUser) {
    this.data_ = this.data_ || { };
  } else {
    // Save it anyway, but blow everything away. We'll ask the user to
    // refresh to pick the changes up.
    this.data_ = { };
  }
  this.data_.principal = principal;
  this.data_.token = { value: token, expires: expires };
  localStorage.setItem("roostData", JSON.stringify(this.data_));

  this.dispatchEvent({type: "change"});
  return goodUser;
};