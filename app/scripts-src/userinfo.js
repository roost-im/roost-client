"use strict";

// Wait one second to let changes accumulate.
var USER_INFO_UPDATE_DELAY = timespan.seconds(1);
// Minimum amount of time between updates.
var USER_INFO_UPDATE_THROTTLE = timespan.seconds(10);

function UserInfoConflict() {
}

function UserInfo(api) {
  RoostEventTarget.call(this);

  this.api_ = api;

  this.base_ = null;
  this.baseVersion_ = -1;

  this.local_ = null;
  this.pending_ = null;
  this.throttled_ = null;

  this.ready_ = Q.defer();

  this.loadInfo_().done();
}
UserInfo.prototype = Object.create(RoostEventTarget.prototype);

UserInfo.prototype.handleNewInfo_ = function(info, version) {
  try {
    this.base_ = JSON.parse(info);
  } catch (err) {
    if (window.console && console.log)
      console.log("Error parsing user info", err);
    this.base_ = null;
  }
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

  if (this.local_ && key in this.local_)
    return this.local_[key];
  if (this.pending_ && key in this.pending_)
    return this.pending_[key];
  return (typeof this.base_ === "object" && this.base_) ?
    this.base_[key] : undefined;
};

UserInfo.prototype.set = function(key, value) {
  if (this.baseVersion_ < 0)
    throw "User info not loaded!";

  if (!this.local_)
    this.local_ = {};
  this.local_[key] = value;
  this.dispatchEvent({type: "change"});
  this.scheduleUpdate_();
};

UserInfo.prototype.scheduleUpdate_ = function() {
  if (this.pending_ || !this.local_ || this.throttled_)
    return;

  this.pending_ = {};  // Silly marker.
  setTimeout(this.doUpdate_.bind(this), USER_INFO_UPDATE_DELAY);
};

UserInfo.prototype.doUpdate_ = function() {
  this.pending_ = this.local_;
  this.local_ = null;

  // Merge this into the current base.
  var newInfo = {};
  for (var key in this.base_) {
    if (this.base_.hasOwnProperty(key))
      newInfo[key] = this.base_[key];
  }
  for (var key in this.pending_) {
    if (this.pending_.hasOwnProperty(key))
      newInfo[key] = this.pending_[key];
  }

  // Fire off a test-and-set.
  var newVersion = this.baseVersion_ + 1;
  var newInfoStr = JSON.stringify(newInfo);
  this.api_.post("/v1/info", {
    expectedVersion: this.baseVersion_,
    info: newInfoStr
  }).then(function(ret) {
    if (ret.updated) {
      this.handleNewInfo_(newInfoStr, newVersion);
      this.pending_ = null;
      this.throttled_ = setTimeout(function() {
        this.throttled_ = null;
      }.bind(this), USER_INFO_UPDATE_THROTTLE);
    } else {
      this.handleNewInfo_(ret.info, ret.version);
      throw new UserInfoConflict();
    }
  }.bind(this)).then(null, function(err) {
    // The pending update failed. Merge them into one diff.
    for (var key in this.local_) {
      if (this.local_.hasOwnProperty(key))
        this.pending_[key] = this.local_[key];
    }
    this.local_ = this.pending_;
    this.pending_ = null;

    // Schedule a new update.
    if (err instanceof UserInfoConflict) {
      this.doUpdate_();
    } else {
      throw err;
    }
  }.bind(this)).done();;
    
};
