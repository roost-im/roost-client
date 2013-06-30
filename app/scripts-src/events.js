"use strict";

// The DOM really should provide this for you, so you don't have to
// keep reimplementing it.
//
// TODO(davidben): Make this DOM-style (EventTarget) instead of
// node-style. When we use SockJS, there won't be anything else
// node-style in the client.

function EventEmitter() {
  this.listeners_ = {};
};
EventEmitter.prototype.addListener = function(type, cb) {
  if (!(type in this.listeners_))
    this.listeners_[type] = [];
  if (this.listeners_[type].indexOf(cb) == -1)
    this.listeners_[type].push(cb);
};
EventEmitter.prototype.on = EventEmitter.prototype.addListener;
EventEmitter.prototype.removeListener = function(type, cb) {
  if (!(type in this.listeners_))
    return;
  var idx = this.listeners_[type].indexOf(cb);
  if (idx == -1)
    return;
  this.listeners_[type].splice(idx, 1);
};
EventEmitter.prototype.emit = function(type) {
  var args = [].slice.call(arguments, 1);
  if (type in this.listeners_) {
    for (var i = 0; i < this.listeners_[type].length; i++) {
      this.listeners_[type][i].apply(this, args);
    }
  }
};
