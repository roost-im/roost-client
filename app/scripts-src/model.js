"use strict";

function MessageModel(api) {
  this.api_ = api;
}
MessageModel.prototype.newTailInclusive = function(start, filter, cb) {
  return new MessageTail(this, start, true, filter, cb);
};
MessageModel.prototype.newTail = function(start, filter, cb) {
  return new MessageTail(this, start, false, filter, cb);
};
MessageModel.prototype.newReverseTail = function(start, filter, cb) {
  return new MessageReverseTail(this, start, filter, cb);
};
// This function is NOT meant to be that authoritative. It's just
// because some places in the message view would find it handle to be
// able to compare messages to each other and opaque message ids as a
// data model make this difficult.
MessageModel.prototype.compareMessages = function(a, b) {
  return a.receiveTime - b.receiveTime;
};

function MessageTail(model, start, inclusive, filter, cb) {
  this.model_ = model;
  // The last thing we sent.
  this.lastSent_ = start;
  // Whether the request is inclusive.
  this.inclusive_ = inclusive;
  // The number of messages sent total.
  this.messagesSentTotal_ = 0;
  // The number of messages sent since the last new-tail.
  this.messagesSentRecent_ = 0;
  // The number of messages we want ahead of lastSent_.
  this.messagesWanted_ = 0;
  // The filter to use.
  this.filter_ = filter;
  // Callback. null on close.
  this.cb_ = cb;
  // The ID of the tail.
  this.tailId_ = null;
  // The value of the most recent extend-tail message.
  this.lastExtend_ = 0;

  // Hold onto these so we can unregister them.
  this.connectedCb_ = this.onConnect_.bind(this);
  this.disconnectCb_ = this.onDisconnect_.bind(this);
  this.messagesCb_ = this.onMessages_.bind(this);
  this.model_.api_.addEventListener("connect", this.connectedCb_);

  this.onConnect_();
}
MessageTail.prototype.onConnect_ = function() {
  // Unregister our old handlers.
  this.onDisconnect_();
  this.socket_ = this.model_.api_.socket();
  if (this.socket_) {
    this.socket_.addEventListener("messages", this.messagesCb_);
    this.socket_.sockJS().addEventListener("close", this.disconnectCb_);
    // Reset everything.
    this.createTail_();
    this.expandTo(0);
  }
};
MessageTail.prototype.onDisconnect_ = function() {
  if (this.socket_) {
    this.socket_.removeEventListener("messages", this.messagesCb_);
    this.socket_.sockJS().removeEventListener("close", this.disconnectCb_);
    this.socket_ = null;

    // We disconnected. Mark as not the end anymore.
    //
    // TODO(davidben): This makes scrollToEnd reset everything. Maybe
    // add a third "disconnected" state? Would also be good as far as
    // displaying a different message. Could also use API's
    // disconnected event and just leave this one be?
    if (this.cb_)
      this.cb_([], false);
  }
};
MessageTail.prototype.expandTo = function(count) {
  this.messagesWanted_ = Math.max(this.messagesWanted_,
                                  count - this.messagesSentTotal_);
  var newExtend = this.messagesWanted_ + this.messagesSentRecent_;
  if (this.socket_ && this.lastExtend_ < newExtend) {
    this.socket_.send({
      type: "extend-tail",
      id: this.tailId_,
      count:newExtend
    });
    this.lastExtend_ = newExtend;
  }
};
MessageTail.prototype.close = function() {
  if (this.socket_) {
    this.socket_.send({
      type: "close-tail",
      id: this.tailId_
    });
  }
  this.cb_ = null;
  this.model_.api_.removeEventListener("connect", this.connectedCb_);
  this.onDisconnect_();
};
MessageTail.prototype.createTail_ = function() {
  if (this.socket_) {
    this.tailId_ = this.model_.api_.allocateTailId();
    this.messagesSentRecent_ = 0;  // New tail, so we reset offset.
    this.lastExtend_ = 0;  // Also reset what we've requested.
    var msg = {
      type: "new-tail",
      id: this.tailId_,
      start: this.lastSent_,
      inclusive: this.inclusive_
    }
    for (var key in this.filter_) {
      if (this.filter_.hasOwnProperty(key) && this.filter_[key] != null)
        msg[key] = this.filter_[key];
    }
    this.socket_.send(msg);
  }
};
MessageTail.prototype.onMessages_ = function(msg) {
  if (msg.id != this.tailId_)
    return;
  if (msg.messages.length) {
    this.lastSent_ = msg.messages[msg.messages.length - 1].id;
    this.inclusive_ = false;
    this.messagesSentTotal_ += msg.messages.length;
    this.messagesSentRecent_ += msg.messages.length;
    this.messagesWanted_ -= msg.messages.length;
  }
  if (this.cb_)
    this.cb_(msg.messages, msg.isDone);
};

function MessageReverseTail(model, start, filter, cb) {
  this.model_ = model;
  this.start_ = start;
  this.messagesSent_ = 0;
  this.messagesWanted_ = 0;
  this.filter_ = filter;
  this.cb_ = cb;
  this.pending_ = false;
  // Exponential back-off thing on error.
  this.throttleTimer_ = null;
  this.throttle_ = 500;

  this.reconnectCb_ = this.onReconnect_.bind(this);
  this.model_.api_.addEventListener("connect", this.reconnectCb_);
}
MessageReverseTail.prototype.expandTo = function(count) {
  this.messagesWanted_ = Math.max(this.messagesWanted_,
                                  count - this.messagesSent_);
  this.fireRequest_();
};
MessageReverseTail.prototype.close = function() {
  this.cb_ = null;
  this.model_.api_.removeEventListener("connect", this.reconnectCb_);
};
MessageReverseTail.prototype.fireRequest_ = function() {
  if (this.pending_ || this.throttleTimer_ ||
      !this.cb_ || this.messagesWanted_ == 0)
    return;
  var params = {
    reverse: "1",
    count: String(this.messagesWanted_)
  }
  if (this.start_ != null)
    params.offset = this.start_;
  for (var key in this.filter_) {
    if (this.filter_.hasOwnProperty(key) && this.filter_[key] != null)
      params[key] = this.filter_[key];
  }
  // TODO(davidben): Report errors back up somewhere?
  this.pending_ = true;
  this.model_.api_.get("/v1/messages", params).then(function(resp) {
    // Bleh. The widget code wants the messages in reverse order.
    resp.messages.reverse();

    if (this.cb_)
      this.cb_(resp.messages, resp.isDone);

    // Update fields (specifically |pending_|) AFTER the callback to
    // ensure they don't fire a new request; we might know there's no
    // use in continuing.
    if (resp.messages.length)
      this.start_ = resp.messages[0].id;
    this.messagesSent_ += resp.messages.length;
    this.messagesWanted_ -= resp.messages.length;

    this.pending_ = false;
    this.throttle_ = 500;

    // We're done. Shut everything off.
    if (resp.isDone) {
      this.close();
    } else {
      // Keep going if needbe.
      this.fireRequest_();
    }
  }.bind(this), function(err) {
    this.pending_ = false;

    // If we get an error, do an exponential backoff.
    var timer = { disabled: false };
    window.setTimeout(function() {
      if (timer.disabled)
        return;
      this.throttleTimer_ = null;
      this.fireRequest_();
    }.bind(this), this.throttle_);
    this.throttleTimer_ = timer;
    this.throttle_ *= 2;

    // Don't lose the error.
    throw err;
  }.bind(this)).done();
};
MessageReverseTail.prototype.onReconnect_ = function() {
  // We don't use the socket, but if we get a reconnect, take that as
  // a sign that we've got connectivity again.
  if (this.throttleTimer_) {
    this.throttleTimer_.disabled = true;
    this.throttleTimer_ = null
  }
  this.throttle_ = 500;
  this.fireRequest_();
};