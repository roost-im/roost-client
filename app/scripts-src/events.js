"use strict";

// The DOM really should provide this for you, so you don't have to
// keep reimplementing it.

function RoostEventTarget() {
  this.listeners_ = {};
};
RoostEventTarget.prototype.addEventListener = function(type, cb) {
  if (!(type in this.listeners_))
    this.listeners_[type] = [];
  if (this.listeners_[type].indexOf(cb) == -1)
    this.listeners_[type].push(cb);
};
RoostEventTarget.prototype.removeEventListener = function(type, cb) {
  if (!(type in this.listeners_))
    return;
  var idx = this.listeners_[type].indexOf(cb);
  if (idx == -1)
    return;
  this.listeners_[type].splice(idx, 1);
};
RoostEventTarget.prototype.dispatchEvent = function(ev) {
  var type = ev.type;
  if (type in this.listeners_) {
    for (var i = 0; i < this.listeners_[type].length; i++) {
      this.listeners_[type][i].call(this, ev);
    }
  }
};
