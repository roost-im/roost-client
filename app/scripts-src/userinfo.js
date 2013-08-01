"use strict";

// Minimum amount of time between updates.
var USER_INFO_UPDATE_THROTTLE = timespan.seconds(3);

// Number of historical scroll states we save.
var USER_INFO_MAX_SCROLL_STATES = 5;

function UserInfoConflict() {
}

function UserInfo(api) {
  RoostEventTarget.call(this);

  this.api_ = api;

  this.base_ = null;
  this.baseVersion_ = -1;

  this.local_ = null;
  this.pending_ = null;

  this.throttler_ =
    new Throttler(this.doUpdate_.bind(this), USER_INFO_UPDATE_THROTTLE);

  this.ready_ = Q.defer();

  // TODO(davidben): If the initial load fails, we never get the
  // ready. Retry? Maybe just query on login and save the state.
  this.loadInfo_().done();
  this.api_.addEventListener("connect", this.onConnect_.bind(this));
  this.onConnect_();
}
UserInfo.prototype = Object.create(RoostEventTarget.prototype);

UserInfo.prototype.onConnect_ = function() {
  var socket = this.api_.socket();
  if (!socket)
    return;
  socket.addEventListener("info-changed", function(ev) {
    this.handleNewInfo_(ev.info, ev.version);
  }.bind(this));
}

UserInfo.prototype.handleNewInfo_ = function(info, version) {
  // Things might have gotten reordered.
  if (this.baseVersion_ >= version)
    return;

  try {
    this.base_ = JSON.parse(info);
  } catch (err) {
    if (window.console && console.log)
      console.log("Error parsing user info", err);
    this.base_ = {};
  }

  if (typeof this.base_ !== "object" || !this.base_)
    this.base_ = {};

  this.baseVersion_ = version;
  if (Q.isPending(this.ready_.promise))
    this.ready_.resolve();
  this.dispatchEvent({type: "change"});
};

UserInfo.prototype.loadInfo_ = function() {
  return this.api_.get("/v1/info").then(function(ret) {
    this.handleNewInfo_(ret.info, ret.version);
  }.bind(this));
};

UserInfo.prototype.ready = function() {
  return this.ready_.promise;
};

UserInfo.prototype.get = function(key) {
  if (this.baseVersion_ < 0)
    throw "User info not loaded!";

  if (key === 'scrollStates') {
    return this.scrollStates();
  } else {
    if (this.local_ && key in this.local_)
      return this.local_[key];
    if (this.pending_ && key in this.pending_)
      return this.pending_[key];
    return this.base_[key];
  }
};

UserInfo.prototype.scrollStates = function() {
  var base = {
    remove: {},
    add: this.base_.scrollStates || []
  };
  if (this.pending_)
    base = mergeScrollStateDiff(base, this.pending_.scrollStates);
  if (this.local_)
    base = mergeScrollStateDiff(base, this.local_.scrollStates);
  // Because we were dumb and put the recent things in the back.
  var ret = base.add.slice(0);
  ret.reverse();
  return ret;
}

UserInfo.prototype.ensureLocal_ = function() {
  if (this.local_)
    return;
  this.local_ = {
    scrollStates: {
      remove: {},
      add: []
    }
  };
}

UserInfo.prototype.set = function(key, value) {
  if (this.baseVersion_ < 0)
    throw "User info not loaded!";

  this.ensureLocal_();
  this.local_[key] = value;
  this.dispatchEvent({type: "change"});
  this.throttler_.request();
};

function mergeScrollStateDiff(diff, newDiff) {
  // Clone diff.
  var merged = {
    remove: {},
    add: diff.add.slice(0)
  };
  for (var id in diff.remove) {
    merged.remove[id] = 1;
  }

  // Apply removes.
  for (var id in newDiff.remove) {
    merged.remove[id] = 1;
  }
  merged.add = merged.add.filter(function(state) {
    return !newDiff.remove[state.id];
  });
  // Apply adds.
  merged.add = merged.add.concat(newDiff.add);
  // Clamp size.
  if (merged.add.length > USER_INFO_MAX_SCROLL_STATES) {
    merged.add =
      merged.add.slice(merged.add.length - USER_INFO_MAX_SCROLL_STATES);
  }
  return merged;
};

UserInfo.prototype.replaceScrollState = function(oldState, newState) {
  if (this.baseVersion_ < 0)
    throw "User info not loaded!";

  this.ensureLocal_();

  var diff = {
    remove: {},
    add: newState ? [newState] : []
  };
  if (oldState)
    diff.remove[oldState.id] = 1;

  this.local_.scrollStates = mergeScrollStateDiff(
    this.local_.scrollStates, diff);
  this.dispatchEvent({type: "change"});
  this.throttler_.request();
};

UserInfo.prototype.mergeLocalAndPending_ = function() {
  if (this.local_) {
    for (var key in this.local_) {
      if (this.local_.hasOwnProperty(key) && key != 'scrollStates')
        this.pending_[key] = this.local_[key];
    }
    this.pending_.scrollStates = mergeScrollStateDiff(
      this.pending_.scrollStates, this.local_.scrollStates);
  }

  this.local_ = this.pending_;
  this.pending_ = null;
};

UserInfo.prototype.doUpdate_ = function() {
  this.pending_ = this.local_;
  this.local_ = null;

  // Merge this into the current base.
  var newInfo = {};
  // Make a copy.
  for (var key in this.base_) {
    if (this.base_.hasOwnProperty(key))
      newInfo[key] = this.base_[key];
  }
  if (!newInfo.scrollStates)
    newInfo.scrollStates = [];

  // Apply this.pending_.
  for (var key in this.pending_) {
    if (this.pending_.hasOwnProperty(key) && key != 'scrollStates')
      newInfo[key] = this.pending_[key];
  }
  newInfo.scrollStates = mergeScrollStateDiff({
    remove: {},
    add: newInfo.scrollStates
  }, this.pending_.scrollStates).add;

  var newVersion = this.baseVersion_ + 1;
  var newInfoStr = JSON.stringify(newInfo);

  var oldInfoStr = JSON.stringify(this.base_);
  if (oldInfoStr === newInfoStr) {
    // Nothing changed. Don't bother.
    this.pending_ = null;
    return;
  }

  // Fire off a test-and-set.
  return this.api_.post("/v1/info", {
    expectedVersion: this.baseVersion_,
    info: newInfoStr
  }).then(function(ret) {
    if (ret.updated) {
      // Success!
      this.pending_ = null;
      this.handleNewInfo_(newInfoStr, newVersion);
    } else {
      // Failure. Retry.
      this.mergeLocalAndPending_();
      this.handleNewInfo_(ret.info, ret.version);
      // Just loop like this. It should be fine.
      return this.doUpdate_();
    }
  }.bind(this), function(err) {
    // HTTP error.
    this.mergeLocalAndPending_();
    // TODO(davidben): The throttler is bad at reporting errors! Make
    // sure this goes somewhere.
    throw err;
  }.bind(this));
    
};
