"use strict";

// The DOM really should provide this for you, so you don't have to
// keep reimplementing it.

function RoostEventTarget() {
  this.listeners_ = {};
};
RoostEventTarget.prototype.indexOfListener_ = function(type, cb) {
  if (!(type in this.listeners_))
    return -1;
  for (var i = 0; i < this.listeners_[type].length; i++) {
    if (this.listeners_[type][i].cb === cb)
      return i;
  }
  return -1;
};
RoostEventTarget.prototype.addEventListener = function(type, cb) {
  if (!(type in this.listeners_))
    this.listeners_[type] = [];
  if (this.indexOfListener_(type, cb) == -1)
    this.listeners_[type].push({cb: cb, doomed: false});
};
RoostEventTarget.prototype.removeEventListener = function(type, cb) {
  if (!(type in this.listeners_))
    return;
  var idx = this.indexOfListener_(type, cb);
  if (idx == -1)
    return;
  // Removing an event listener /does/ affect current dispatches.
  this.listeners_[type][idx].doomed = true;
  this.listeners_[type].splice(idx, 1);
};
RoostEventTarget.prototype.dispatchEvent = function(ev) {
  var type = ev.type;
  if (type in this.listeners_) {
    // Make a copy of the list; adding an event listener mid-dispatch
    // does /not/ run it.
    var listeners = this.listeners_[type].slice(0);
    for (var i = 0; i < listeners.length; i++) {
      if (!listeners[i].doomed)
        listeners[i].cb.call(this, ev);
    }
  }
};
