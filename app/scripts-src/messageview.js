"use strict";

// This thing's only purpose in life is to know where to anchor our MutationObserver.
roostApp.directive("messageView", [function() {
  return {
    restrict: "E",
    controller: ["$element", function($element) {
      this.element = $element[0];
    }]
  };
}]);

roostApp.directive("msgviewRepeatMessage", [function() {
  return {
    restrict: "A",
    scope: {
      model: "=msgviewModel",
      selection: "=msgviewSelection",
      atTop: "=msgviewAtTop",
      atBottom: "=msgviewAtBottom",
      emptyCache: "=msgviewEmptyCache"
    },
    transclude: true,
    priority: 1000,
    terminal: true,
    require: "^messageView",
    compile: function(element, attr, linker) {
      return function($scope, $element, $attr, messageViewCtrl) {
        var scopes = {};
        var messageView = new MessageView($scope,
                                          $scope.model,
                                          messageViewCtrl.element,
                                          $element[0],
                                          formatMessage);
        window.messageView = messageView;  // DEBUG
        var selectionTracker = new SelectionTracker(messageView);
        window.selectionTracker = selectionTracker;  // DEBUG

        $scope.emptyCache = true;
        messageView.addEventListener("cachechanged", function() {
          var emptyCache = messageView.cacheCount() == 0;
          if (emptyCache !== $scope.emptyCache) {
            $scope.emptyCache = emptyCache;
            // This is dumb. I don't know if I'm in a $scope.$apply or
            // not, so just fire one later. This transition does not
            // happen often.
            setTimeout(function() {
              $scope.$digest();
            });
          }
        });

        $scope.$on("ensureSelectionVisible", function(ev) {
          selectionTracker.ensureSelectionVisible();
        });
        $scope.$on("changeFilter", function(ev, filter) {
          messageView.changeFilter(filter);
        });

        $scope.smartNarrow = function(msg, withInstance, related) {
          // TODO(davidben): Unify is keyboard copy of the code with
          // this. It's silly.
          var opts = { };
          if (!msg.isPersonal || msg.classKey !== "message") {
            opts.recipient = msg.recipient;
            if (related) {
              opts.class_key_base = msg.classKeyBase;
            } else {
              opts.class_key = msg.classKey;
            }
          } else {
            opts.conversation = msg.conversation;
          }

          if (withInstance) {
            if (related) {
              opts.instance_key_base = msg.instanceKeyBase;
            } else {
              opts.instance_key = msg.instanceKey;
            }
          }

          var filter = new Filter(opts);
          messageView.changeFilter(filter, msg.id);
        };

        function formatMessage(msg, doDigest) {
          var scope, nodeOut, node;
          scope = $scope.$new();
          scope.msg = msg;
          scope.selected = (msg.id == selectionTracker.selectedId());

          linker(scope, function(clone) {
            nodeOut = clone;
          });
          node = nodeOut; nodeOut = null;

          // Remember the scope so we can manipulate it.
          var id = msg.id;
          scopes[id] = scope;
          scope.$on("$destroy", function(ev) {
            delete scopes[id];
          });

          if (doDigest)
            scope.$digest();

          // Is there a better way to do this? I want only the
          // elements, not the text nodes.
          var i;
          for (var i = 0; i < node.length; i++) {
            if (node[i].nodeType == Node.ELEMENT_NODE)
              break;
          }
          return {
            node: node[i],
            removeCb: scope.$destroy.bind(scope)
          };
        }

        // Update existing scopes as selections change.
        selectionTracker.addEventListener("changed", function(ev) {
          // Optimize away a full digest cycle, again for
          // performance. Unlike other ones, this is actually changing
          // the root scope. But it's used in the reply box
          if (ev.oldSelection && ev.oldSelection in scopes) {
            scopes[ev.oldSelection].selected = false;
            scopes[ev.oldSelection].$digest();
          }
          if (ev.selection && ev.selection in scopes) {
            scopes[ev.selection].selected = true;
            scopes[ev.selection].$digest();
          }
          $scope.selection = selectionTracker.selectedMessage();
        });
        selectionTracker.addEventListener("seenselection", function(ev) {
//          $scope.$apply(function() {
            $scope.selection = selectionTracker.selectedMessage();
//          });
        });

        // Maintain atTop vs. atBottom.
        $scope.atTop = messageView.atTop();
        $scope.atBottom = messageView.atBottom();
        messageView.addEventListener("edgechange", function() {
          $scope.$apply(function() {
            $scope.atTop = messageView.atTop();
            $scope.atBottom = messageView.atBottom();
          });
        });

        // State-saving code.
        (function() {
          // How many pixels you have to scroll before we fork scroll state
          // ids.
          var FORK_CUTOFF = 125;

          var oldState = null;
          function getScrollState() {
            // How far are we from the old scroll state.
            var id, scrollTotal = Infinity;
            if (oldState) {
              var dist = messageView.distanceToScrollState(oldState.scroll);
              if (dist == null)
                return null;
              scrollTotal = dist + (oldState.scrollTotal || 0);
            }
            // Fork if far enough away.
            if (Math.abs(scrollTotal) > FORK_CUTOFF) {
              id = generateId();
              scrollTotal = 0;
            } else {
              id = oldState.id;
            }

            var scrollState = messageView.scrollState();
            if (scrollState == null)
              return null;
            return {
              id: id,
              scroll: scrollState,
              scrollTotal: scrollTotal
            };
          }

          // True if the last save attempt had an empty cache. In that case,
          // don't throttle. As soon as cachechanged happens, just trigger
          // it.
          var needSave = false, lockSave = 1 /* to be unlocked on API ready */;
          function unlockSave() {
            if (--lockSave <= 0) {
              if (needSave)
                saveThrottler.request({ noThrottle: true });
            }
          }
          var saveThrottler = new Throttler(function() {
            var deferred = Q.defer();
            JsMutationObserver.setSafeImmediate(function() {
              if (lockSave) {
                needSave = true;
                deferred.resolve();
                return;
              }
              var state = getScrollState();
              if (state == null) {
                needSave = true;
                deferred.resolve();
                return;
              }
              $scope.$apply(function() {
                needSave = false;
                $scope.$emit("replaceScrollState", oldState, state);
                oldState = state;
              });
              deferred.resolve();
            });
            return deferred.promise;
          }, timespan.seconds(1));
          // TODO(davidben): Changing filters happens to trigger scroll
          // events, but we should be listening for that more explicitly.
          window.addEventListener("scroll", function(ev) {
            saveThrottler.request({ noThrottle: needSave });
          });
          messageView.addEventListener("cachechanged", function(ev) {
            if (needSave && !lockSave)
              saveThrottler.request({ noThrottle: true });
          });

          $scope.$on("apiReady", function(ev) {
            unlockSave();
          });
          $scope.$on("setScrollState", function(ev, state) {
            lockSave++;
            try {
              oldState = state;
              messageView.changeFilter(new Filter(oldState.scroll.filter));
              messageView.scrollToMessage(oldState.scroll.id, {
                offset: oldState.scroll.offset
              });
            } finally {
              unlockSave();
            }
          });
          $scope.$on("scrollToBottom", function(ev) {
            messageView.scrollToBottom();
          });
          $scope.$on("scrollToMessage", function(ev, msgId) {
            messageView.scrollToMessage(msgId);
            selectionTracker.selectMessage(msgId);
          });
        })();
      };
    }
  };
}]);

// If the number of messages outside the scroll goes outside
// [MIN_BUFFER, MAX_BUFFER], request/retire messages to reach
// TARGET_BUFFER. That there is a buffer between TARGET_BUFFER and our
// endpoints ensures that spurious scrolling will not repeatedly
// request and retire the same message. Also that we do our requests
// in large-ish batches.
var MIN_BUFFER = 20;
var TARGET_BUFFER = MIN_BUFFER * 2;
var MAX_BUFFER = MIN_BUFFER * 3;

var MAX_ARROW_SCROLL = 50;
var GOAL_RATIO_UP = 0.25;
var GOAL_RATIO_DOWN = 0.60;

var MARGIN_TOP = 20;
var MARGIN_BELOW = 40;

var SCROLL_PAGE_MARGIN = 40;

function clamp(a, b, c) {
  return Math.max(a, Math.min(b, c));
}

var MESSAGE_VIEW_SCROLL_TOP = 0;
var MESSAGE_VIEW_SCROLL_BOTTOM = 1;


function MessageView(scope, model, observerRoot, parent, formatMessage) {
  RoostEventTarget.call(this);

  this.scope_ = scope;
  this.model_ = model;

  this.formatMessage_ = formatMessage;

  this.placeholderAbove_ = document.createElement("div");
  this.placeholderAbove_.classList.add("message-placeholder");
  this.placeholderBelow_ = document.createElement("div");
  this.placeholderBelow_.classList.add("message-placeholder");
  parent.appendChild(this.placeholderAbove_);
  parent.appendChild(this.placeholderBelow_);

  this.tailBelow_ = null;
  this.tailBelowOffset_ = 0;  // The global index of the tail reference.

  this.tailAbove_ = null;
  this.tailAboveOffset_ = 0;  // The global index of the tail reference.

  this.filter_ = new Filter({});

  // True if we have a pending checkBuffers_ call.
  this.checkBuffersPending_ = false;

  this.reset_();

  this.observer_ = new MutationObserver(this.restorePosition_.bind(this));
  this.observer_.observe(observerRoot, {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true
  });

  window.addEventListener("scroll", function() {
    this.schedulePositionSave_();
    this.checkBuffers_();
  }.bind(this));
  window.addEventListener("keydown", this.onKeydown_.bind(this));
  // Might have reflowed.
  window.addEventListener("resize", this.restorePosition_.bind(this));
}
MessageView.prototype = Object.create(RoostEventTarget.prototype);

MessageView.prototype.viewportBounds = function() {
  // TODO(davidben): Have this include the reply box and everything
  // else.
  return {
    top: 0,
    bottom: document.documentElement.clientHeight,
    height: document.documentElement.clientHeight
  };
};

MessageView.prototype.cacheCount = function() {
  return this.cache_.length;
}

MessageView.prototype.cachedMessage = function(i) {
  return this.cache_[i].msg;
};

MessageView.prototype.cachedNode = function(i) {
  return this.cache_[i].node;
};

MessageView.prototype.getCacheIndex = function(id) {
  if (id in this.messageToIndex_) {
    return this.messageToIndex_[id] - this.listOffset_;
  }
  return null;
};

MessageView.prototype.getNode = function(id) {
  var idx = this.getCacheIndex(id);
  if (idx == null)
    return null;
  return this.cache_[idx].node;
};

MessageView.prototype.getMessage = function(id) {
  var idx = this.getCacheIndex(id);
  if (idx == null)
    return null;
  return this.cache_[idx].msg;
};

MessageView.prototype.findTopMessage = function() {
  var bounds = this.viewportBounds();
  if (this.cache_.length == 0)
    return null;
  var lo = 0;
  var hi = this.cache_.length - 1;
  while (lo < hi) {
    var mid = ((lo + hi) / 2) | 0;
    var b = this.cache_[mid].node.getBoundingClientRect();
    // Find the first message which starts at or after the bounds.
    if (b.top < bounds.top) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  // It's possible the message we found starts very late, if the
  // previous is long. In that case, prefer the previous one.
  if (lo > 0 &&
      this.cache_[lo].node.getBoundingClientRect().top >=
      (bounds.top + bounds.height/2)) {
    lo--;
  }
  return lo;
};

MessageView.prototype.findBottomMessage = function() {
  var bounds = this.viewportBounds();
  if (this.cache_.length == 0)
    return null;
  var lo = 0;
  var hi = this.cache_.length - 1;
  while (lo < hi) {
    var mid = ((lo + hi + 1) / 2) | 0;
    var b = this.cache_[mid].node.getBoundingClientRect();
    // Find the first message which ends at or before the bounds.
    if (b.bottom < bounds.bottom) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  // It's possible the message we found ends very early, if the
  // next is long. In that case, prefer the next one.
  if (lo < this.cache_.length - 2 &&
      this.cache_[lo].node.getBoundingClientRect().bottom <=
      (bounds.top + bounds.height/2)) {
    lo++;
  }
  return lo;
};

MessageView.prototype.reset_ = function() {
  // It's not visible. Blow everything away and start from
  // there. (This is mildly annoying. Can we refactor some of this
  // code to not need this?)
  if (this.tailAbove_) {
    this.tailAbove_.close();
    this.tailAbove_ = null;
  }
  if (this.tailBelow_) {
    this.tailBelow_.close();
    this.tailBelow_ = null;
  }

  // Blow away the messages.
  if (this.cache_) {
    for (var i = 0; i < this.cache_.length; i++) {
      $(this.cache_[i].node).remove();
      this.cache_[i].removeCb();
    }
  }

  // The global index to the top of the list. Indices are relative to
  // pendingCenter_ at the last reset_ call. That is, the first
  // message >= pendingCenter_ is always 0. (It's possible it's not
  // equal to pendingCenter_ if pendingCenter_ wasn't in the view.)
  this.listOffset_ = 0;
  this.cache_ = [];

  this.messageToIndex_ = {};  // Map id to global index.

  // Only in the case if this.cache_ is empty, this is the
  // bootstrap cutoff between the two tails. It is either a message id
  // (string) or a one of two magic values for top and bottom.
  //
  // Or it's null if we haven't done anything yet.
  this.pendingCenter_ = null;

  // The most recent saved scroll position.
  this.savedPosition_ = null;
  this.pendingPositionSave_ = false;

  // FIXME: This shows two loading bars. But we can't actually lie
  // about one side because atTop_ and atBottom_ are needed to
  // implement home/end behavior.
  this.setAtTop_(false);
  this.setAtBottom_(false);
  this.placeholderBelow_.scrollIntoView();

  this.dispatchEvent({type: "cachechanged"});
};

MessageView.prototype.changeFilter = function(filter, anchor) {
  // First: if there is no anchor, set the anchor to be the top
  // message, arbitrarily.
  if (anchor == null) {
    // TODO(davidben): Look for a message on-screen that matches. If
    // there is one, use it instead.
    var topIdx = this.findTopMessage();
    anchor = topIdx == null ? null : this.cache_[topIdx].msg.id;
  }

  // Next: Save scroll position relative to the anchor. We need to
  // convert the anchor into an index.
  var anchorIdx;
  if (anchor == null) {
    // If anchor is null, we have no cached message. Use the pending center.
    anchorIdx = 0;
    anchor = this.pendingCenter_;
  } else {
    if (anchor in this.messageToIndex_) {
      anchorIdx = this.messageToIndex_[anchor];
    } else if (anchor === this.pendingCenter_) {
      anchorIdx = 0;
    } else {
      // This can only happen if the caller anchored on a bogus id?
      throw "Bad anchor id";
    }
  }
  var position = this.scrollPosition_(anchorIdx);

  // Next: Gather any bootstrap nodes.
  var bootstrapBefore = [], bootstrapAfter = [];
  var anchorCacheIdx = anchorIdx - this.listOffset_;
  if (filter.isStricterThan(this.filter_)) {
    // If we are stricter than the current filter, we can keep the
    // whole cache.
    for (var i = 0; i < anchorCacheIdx; i++) {
      if (filter.matchesMessage(this.cache_[i].msg))
        bootstrapBefore.push(this.cache_[i].msg);
    }
    for (var i = anchorCacheIdx; i < this.cache_.length; i++) {
      if (filter.matchesMessage(this.cache_[i].msg))
        bootstrapAfter.push(this.cache_[i].msg);
    }
  } else {
    // Otherwise, we only keep the anchor message.
    if (anchorCacheIdx >= 0 &&
        anchorCacheIdx < this.cache_.length &&
        filter.matchesMessage(this.cache_[anchorCacheIdx].msg)) {
      bootstrapAfter.push(this.cache_[anchorCacheIdx].msg);
    }
  }

  // Now we are ready to blow everything away.
  this.reset_();
  this.pendingCenter_ = anchor;
  // Adjust position to be valid post-reset.
  position.idx = 0;
  this.savedPosition_ = position;

  // TODO(davidben): Silliness with top/bottom. Make this state also
  // more rederivable or something.
  if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_TOP) {
    this.setAtTop_(true);
    this.setAtBottom_(false);
  } else if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_BOTTOM) {
    this.setAtTop_(false);
    this.setAtBottom_(true);
  }

  this.filter_ = filter;

  // Apply the bootstrap. That will trigger tails and everything else.
  if (bootstrapBefore.length)
    this.prependMessagesRaw_(bootstrapBefore, false);
  if (bootstrapAfter.length)
    this.appendMessagesRaw_(bootstrapAfter, false);
  this.checkBuffers_();
};

// Scroll positions are not valid across reset_ calls. They are a pair
// of (index, offset) tuples. (Note: index is /not/ a cacheIndex.
MessageView.prototype.scrollPosition_ = function(anchorIdx) {
  var node;
  if (anchorIdx != null) {
    var anchorCacheIdx = anchorIdx - this.listOffset_;
    if (anchorCacheIdx > 0 && anchorCacheIdx >= this.cache_.length)
      throw "Bad scroll position anchor";
    node = (this.cache_[anchorCacheIdx] || {node:this.placeholderBelow_}).node;
  } else {
    var topCacheIdx = this.findTopMessage();
    if (topCacheIdx == null) {
      // Message list is empty. Use the pending center.
      anchorIdx = 0;
      node = this.placeholderBelow_;
    } else {
      anchorIdx = topCacheIdx + this.listOffset_;
      node = this.cache_[topCacheIdx].node;
    }
  }
  var offset = node.getBoundingClientRect().top - this.viewportBounds().top;
  return {
    idx: anchorIdx,
    offset: offset
  };
};

MessageView.prototype.forgetScrollPosition_ = function() {
  this.savedPosition_ = null;
  // Schedule one on the next event loop iteration.
  this.schedulePositionSave_();
}
MessageView.prototype.saveScrollPosition_ = function() {
  if (!JsMutationObserver.observersScheduled())
      this.savedPosition_ = this.scrollPosition_();
};
MessageView.prototype.schedulePositionSave_ = function() {
  if (!this.pendingPositionSave_) {
    this.pendingPositionSave_ = true;
    JsMutationObserver.setSafeImmediate(function() {
      this.pendingPositionSave_ = false;
      this.savedPosition_ = this.scrollPosition_();
    }.bind(this));
  }
};
MessageView.prototype.restorePosition_ = function() {
  if (this.savedPosition_) {
    if (!this.jumpToScrollPosition_(this.savedPosition_))
      console.error("Failed to restore saved position", this.savedPosition_);
  }
};

MessageView.prototype.scrollState = function() {
  var position = this.scrollPosition_();
  var msg = this.cache_[position.idx - this.listOffset_];
  // Cache was empty. Position may still be resolvable, but not as an
  // external scroll state.
  if (!msg)
    return null;
  return {
    offset: position.offset,
    id: msg.msg.id,
    receiveTime: msg.msg.receiveTime,
    filter: this.filter_.toDict()
  };
};

MessageView.prototype.jumpToScrollPosition_ = function(position) {
  var node;
  var cacheIdx = position.idx - this.listOffset_;
  if (cacheIdx == this.cache_.length) {
    // Placeholder block.
    node = this.placeholderBelow_;
  } else {
    node = this.cache_[cacheIdx].node;
    if (node == null)
      return false;
  }
  $(window).scrollTop(node.getBoundingClientRect().top +
                      $(window).scrollTop() -
                      position.offset);
  this.savedPosition_ = position;
  return true;
};

MessageView.prototype.distanceToScrollState = function(state) {
  // Returns how far we are from a given scroll state. Either returns
  // a value (positive or negative) in pixels. Infinity if it's
  // uncomparable or "really far away". Or null if we don't know the
  // answer know but will in a tick or two.

  // Filter change => uncomparable.
  var filter = this.filter_.toDict();
  for (var i = 0; i < Filter.FIELDS.length; i++) {
    if (filter[Filter.FIELDS[i]] !== state.filter[Filter.FIELDS[i]])
      return Infinity;
  }

  // Find the message in state.
  var node = this.getNode(state.id);
  if (node != null) {
    // Great, easy case. Just give the actual distance. Calculation is
    // where the top of the node currently is vs. where it used to be.
    return node.getBoundingClientRect().top -
      (this.viewportBounds().top + state.offset);
  }

  // It wasn't there. So the question is whether it's unknown right
  // now due to pending cache or because it's so far away, we're
  // off-screen. We'll use a fairly simple heuristic for this: Find
  // the top message. Require either 10 messages above/below or that
  // we're atTop/atBottom.
  var topIdx = this.findTopMessage();
  if (topIdx == null)
    return null;  // Oops. We're empty.
  if (topIdx < 10 && !this.atTop_)
    return null;  // Inconclusive: not enough above.
  if (this.cache_.length - topIdx < 10 && !this.atBottom_)
    return null;  // Inconclusive: not enough below.
  return Infinity;
};

MessageView.prototype.scrollToMessage = function(id, opts) {
  // TODO(davidben): This function is pretty wonky. Really it should
  // just be two functions.
  opts = opts || {};
  var bootstrap = opts.bootstrap;
  var alignWithTop = opts.alignWithTop;
  var offset = opts.offset;
  if (bootstrap == undefined || alignWithTop == undefined)
    alignWithTop = true;

  if (bootstrap &&
      !(id in this.messageToIndex_) &&
      this.filter_.matchesMessage(bootstrap)) {
    this.reset_();
    this.appendMessagesRaw_([bootstrap], false);
  }

  if (offset != undefined) {
    if (id in this.messageToIndex_) {
      this.forgetScrollPosition_();
      if (!this.jumpToScrollPosition_({
        idx: this.messageToIndex_[id],
        offset: offset
      })) {
        console.error("Couldn't jump to valid scroll position");
      }
    } else {
      // Wasn't there. Reset to the position instead.
      this.reset_();
      this.pendingCenter_ = id;
      this.checkBuffers_();

      if (!this.jumpToScrollPosition_({
        idx: 0,
        offset: offset
      })) {
        console.error("Couldn't jump to valid scroll position");
      }
    }
  } else {
    // Bah. alignWithTop-type stuff.
    var node = this.getNode(id);
    if (node == null) {
      this.reset_();
      this.pendingCenter_ = id;
      this.checkBuffers_();
    } else {
      this.forgetScrollPosition_();
      node.scrollIntoView(alignWithTop);
      if (!alignWithTop) {
        if (node.getBoundingClientRect().top < this.viewportBounds().top) {
          node.scrollIntoView(true);
        }
      }
    }
  }
};

MessageView.prototype.scrollToTop = function(id) {
  if (this.atTop_) {
    // Easy case: if the top is buffered, go there.
    this.forgetScrollPosition_();
    $(window).scrollTop(0);
    this.saveScrollPosition_();
    return;
  }

  // Otherwise, we reset the universe and use |id| as our new point of
  // reference.
  this.reset_();
  this.pendingCenter_ = MESSAGE_VIEW_SCROLL_TOP;
  // Blegh. Cut out the "Loading..." text now.
  this.setAtTop_(true);
  this.setAtBottom_(false);
  $(window).scrollTop(0);
  this.saveScrollPosition_();
  this.checkBuffers_();
};

MessageView.prototype.scrollToBottom = function(id) {
  if (this.atBottom_) {
    // Easy case: if the bottom is buffered, go there.
    this.forgetScrollPosition_();
    $(window).scrollTop($(document).height());
    this.saveScrollPosition_();
    return;
  }

  // Otherwise, we reset the universe and use |id| as our new point of
  // reference.
  this.reset_();
  this.pendingCenter_ = MESSAGE_VIEW_SCROLL_BOTTOM;
  // Blegh. Cut out the "Loading..." text now.
  this.setAtTop_(false);
  this.setAtBottom_(true);
  $(window).scrollTop($(document).height());
  this.saveScrollPosition_();
  this.checkBuffers_();
};

MessageView.prototype.atTop = function() { return this.atTop_; };
MessageView.prototype.setAtTop_ = function(atTop) {
  if (this.atTop_ == atTop) return;
  this.atTop_ = atTop;
  // Blargh, nested $scope.$apply.
  setTimeout(function() {
    this.dispatchEvent({type: "edgechange"});
  }.bind(this), 0);
};
MessageView.prototype.atBottom = function() { return this.atBottom_; };
MessageView.prototype.setAtBottom_ = function(atBottom) {
  if (this.atBottom_ == atBottom) return;
  this.atBottom_ = atBottom;
  // Blargh, nested $scope.$apply.
  setTimeout(function() {
    this.dispatchEvent({type: "edgechange"});
  }.bind(this), 0);
};

MessageView.prototype.appendMessages_ = function(msgs, isDone) {
  // Don't do a full $apply. Only $digest the new scopes.
  this.saveScrollPosition_();
  this.appendMessagesRaw_(msgs, isDone, true);
};

MessageView.prototype.appendMessagesRaw_ = function(msgs, isDone, doDigest) {
  for (var i = 0; i < msgs.length; i++) {
    var idx = this.cache_.length + this.listOffset_;
    this.messageToIndex_[msgs[i].id] = idx;

    var ret = this.formatMessage_(msgs[i], doDigest);
    this.cache_.push({
      msg: msgs[i],
      node: ret.node,
      removeCb: ret.removeCb
    });

    this.placeholderBelow_.parentNode.insertBefore(ret.node,
                                                   this.placeholderBelow_);
  }
  this.setAtBottom_(isDone);
  // If we were waiting to select a message that hadn't arrived yet,
  // refresh that.
  this.dispatchEvent({type: "cachechanged"});
  this.checkBuffers_();
};

MessageView.prototype.prependMessages_ = function(msgs, isDone) {
  // Don't do a full $apply. Only $digest the new scopes.
  this.saveScrollPosition_();
  this.prependMessagesRaw_(msgs, isDone, true);
};

MessageView.prototype.prependMessagesRaw_ = function(msgs, isDone, doDigest) {
  // TODO(davidben): This triggers layout a bunch. Optimize this if needbe.
  var cacheAdd = [];
  var insertReference = this.placeholderAbove_.nextSibling;
  for (var i = 0; i < msgs.length; i++) {
    var idx = this.listOffset_ - msgs.length + i;
    this.messageToIndex_[msgs[i].id] = idx;

    var ret = this.formatMessage_(msgs[i], doDigest);
    cacheAdd.push({
      msg: msgs[i],
      node: ret.node,
      removeCb: ret.removeCb
    });

    this.placeholderBelow_.parentNode.insertBefore(ret.node, insertReference);
  }
  this.setAtTop_(isDone);

  this.cache_.unshift.apply(this.cache_, cacheAdd);
  this.listOffset_ -= msgs.length;

  // If we were waiting to select a message that hadn't arrived yet,
  // refresh that.
  this.dispatchEvent({type: "cachechanged"});
  this.checkBuffers_();
};

// Return 1 if we need to expand below, -1 if we need to contract, and
// 0 if neither.
MessageView.prototype.checkBelow_ = function(bounds) {
  // Do we need to expand?
  if (this.cache_.length < MIN_BUFFER)
    return 1;
  var b = this.cache_[this.cache_.length - MIN_BUFFER].node.getBoundingClientRect();
  if (bounds.bottom > b.top)
    return 1;

  // Do we need to contract?
  if (this.cache_.length < MAX_BUFFER)
    return 0;
  b = this.cache_[this.cache_.length - MAX_BUFFER].node.getBoundingClientRect();
  if (bounds.bottom < b.top)
    return -1;

  return 0;
};

MessageView.prototype.checkAbove_ = function(bounds) {
  // Do we need to expand?
  if (this.cache_.length < MIN_BUFFER)
    return 1;
  var b = this.cache_[MIN_BUFFER - 1].node.getBoundingClientRect();
  if (bounds.top < b.bottom)
    return 1;

  // Do we need to contract?
  if (this.cache_.length < MAX_BUFFER)
    return 0;
  b = this.cache_[MAX_BUFFER - 1].node.getBoundingClientRect();
  if (bounds.top > b.bottom)
    return -1;

  return 0;
};

MessageView.prototype.ensureTailAbove_ = function() {
  if (this.tailAbove_)
    return;
  // Optimization: if atTop_ is set, we don't need to ask the server
  // to confirm that there are no more messages. We know there aren't.
  if (this.atTop_)
    return;

  if (this.cache_.length) {
    this.tailAbove_ = this.model_.newReverseTail(
      this.cache_[0].msg.id,
      this.filter_,
      this.prependMessages_.bind(this));
    this.tailAboveOffset_ = this.listOffset_;
  } else {
    // Bootstrap with the pending center.
    if (this.pendingCenter_ === null) {
      // Nothing
    } else if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_TOP) {
      // Don't do anything. We're at the top. There's nothing useful
      // here.
    } else if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_BOTTOM) {
      this.tailAbove_ = this.model_.newReverseTail(
        null,
        this.filter_,
        this.prependMessages_.bind(this));
      this.tailAboveOffset_ = this.listOffset_;
    } else {
      this.tailAbove_ = this.model_.newReverseTail(
        this.pendingCenter_,
        this.filter_,
        this.prependMessages_.bind(this));
      this.tailAboveOffset_ = this.listOffset_;
    }
    // We're just starting, so go ahead and request the full buffer.
    if (this.tailAbove_)
      this.tailAbove_.expandTo(TARGET_BUFFER);
  }
};

MessageView.prototype.ensureTailBelow_ = function() {
  if (this.tailBelow_)
    return;

  if (this.cache_.length) {
    this.tailBelow_ = this.model_.newTail(
      this.cache_[this.cache_.length - 1].msg.id,
      this.filter_,
      this.appendMessages_.bind(this));
    this.tailBelowOffset_ = this.listOffset_ + this.cache_.length - 1;
  } else {
    // Bootstrap with the pending center.
    if (this.pendingCenter_ === null) {
      // Nothing
    } else if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_TOP) {
      // Top. null for forward tails means top.
      this.tailBelow_ = this.model_.newTail(
        null,
        this.filter_,
        this.appendMessages_.bind(this));
      this.tailBelowOffset_ = this.listOffset_;
    } else if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_BOTTOM) {
      // Awkward special-case: if we...
      //
      // 1. Reach the end of the tail above.
      // 2. Have no messages.
      // 3. Have no downward tail.
      //
      // ...then we must have scrolled to the bottom on an empty
      // message list. But that doesn't mean we shouldn't have a
      // bottom tail. We may later receive messages and have no way to
      // bootstrap everything. In that case, pretend we scrolled to
      // the top.
      if (this.atTop_) {
        this.tailBelow_ = this.model_.newTail(
          null, this.filter_, this.appendMessages_.bind(this));
        this.tailBelowOffset_ = this.listOffset_;
      }
      // Otherwise, we can't create the bottom tail until we get info
      // from the top. It'll come soon.
    } else {
      this.tailBelow_ = this.model_.newTailInclusive(
        this.pendingCenter_,
        this.filter_,
        this.appendMessages_.bind(this));
      this.tailBelowOffset_ = this.listOffset_;
    }
    // We're just starting, so go ahead and request the full buffer.
    if (this.tailBelow_)
      this.tailBelow_.expandTo(TARGET_BUFFER);
  }
};

MessageView.prototype.checkBuffers_ = function() {
  if (!this.checkBuffersPending_) {
    setTimeout(function() {
      JsMutationObserver.setSafeImmediate(
        this.checkBuffersReal_.bind(this));
    }.bind(this), 50);
    this.checkBuffersPending_ = true;
  }
};

MessageView.prototype.checkBuffersReal_ = function() {
  this.checkBuffersPending_ = false;
  var bounds = this.viewportBounds();

  // Check if we need to expand/contract above or below. If a tail
  // doesn't exist in the direction we need, create it. EXCEPTION: if
  // we need a tail and there are no messages, we don't have a
  // reference to create the tail from. Delay creating the tail; we'll
  // get our reference on append/prepend from the other side. (This
  // happens if we jump to the top or bottom.)
  //
  // TODO(davidben): Instead of only ever working 50 messages at a
  // time, it's possibly better to just pay a binary search and figure
  // out exactly how many we need to reach TARGET_BUFFER?
  //
  // TODO(davidben): Trigger removal by receiving messages?
  var below = this.checkBelow_(bounds);
  var above = this.checkAbove_(bounds);

  // These don't need angular scopes.
  if (below > 0) {
    this.ensureTailBelow_();
    if (this.tailBelow_) {
      this.tailBelow_.expandTo(
        this.listOffset_ + this.cache_.length - 1 + (TARGET_BUFFER - MIN_BUFFER)
          - this.tailBelowOffset_);
    }
  }
  if (above > 0) {
    this.ensureTailAbove_();
    if (this.tailAbove_) {
      this.tailAbove_.expandTo(
        this.tailAboveOffset_ -
          (this.listOffset_ - (TARGET_BUFFER - MIN_BUFFER)));
    }
  }

  // These do.
  if (below >= 0 && above >= 0)
    return;
  // TODO(davidben): Do any scopes need to be digested here? We're
  // just destroying things.

//  this.scope_.$apply(function() {
    if (below < 0) {
      // Close the current tail.
      if (this.tailBelow_) {
        this.tailBelow_.close();
        this.tailBelow_ = null;
      }

      var num = MAX_BUFFER - TARGET_BUFFER;
      for (var i = 0; i < num; i++) {
        var idx = this.cache_.length - i - 1;
        $(this.cache_[idx].node).remove();
        this.cache_[idx].removeCb();
        delete this.messageToIndex_[this.cache_[idx].msg.id];
      }
      this.cache_.splice(this.cache_.length - num, num);

      this.setAtBottom_(false);
    }

    if (above < 0) {
      // Close the current tail.
      if (this.tailAbove_) {
        this.tailAbove_.close();
        this.tailAbove_ = null;
      }

      var num = MAX_BUFFER - TARGET_BUFFER;
      this.saveScrollPosition_();
      for (var i = 0; i < num; i++) {
        $(this.cache_[i].node).remove();
        this.cache_[i].removeCb();
        delete this.messageToIndex_[this.cache_[i].msg.id];
      }
      this.setAtTop_(false);
      this.cache_.splice(0, num);
      this.listOffset_ += num;
    }

    this.checkBuffers_();
//  }.bind(this));
};

MessageView.prototype.onKeydown_ = function(ev) {
  if (ev.target !== document.body)
    return;

  // Handle home/end keys ourselves. Instead of going to the bounds of
  // the currently buffered view (totally meaningless), they go to the
  // top/bottom of the full message list.
  if (matchKey(ev, 36 /* HOME */) ||
      matchKey(ev, 32 /* UP */, {metaKey:1})) {
    ev.preventDefault();
    this.scrollToTop();
  } else if (matchKey(ev, 35 /* END */) ||
             matchKey(ev, 40 /* DOWN */, {metaKey:1})) {
    ev.preventDefault();
    this.scrollToBottom();
  }
};

// Split the selection logic out for sanity.
function SelectionTracker(messageView) {
  RoostEventTarget.call(this);
  this.messageView_ = messageView;

  this.selected_ = null;  // The id of the selected message.
  this.selectedMessage_ = null;  // null if we never saw the message.

  // Bah. This'll get done differently later.
  window.addEventListener("keydown", this.onKeydown_.bind(this));
  this.messageView_.addEventListener("cachechanged",
                                     this.onCacheChanged_.bind(this));
};
SelectionTracker.prototype = Object.create(RoostEventTarget.prototype);

SelectionTracker.prototype.selectedId = function() {
  return this.selected_;
};

SelectionTracker.prototype.selectedMessage = function() {
  return this.selectedMessage_;
};

SelectionTracker.prototype.getSelectedNode_ = function() {
  if (this.selected_ == null)
    return null;
  return this.messageView_.getNode(this.selected_);
};

SelectionTracker.prototype.selectMessage = function(id) {
  if (this.selected_ !== id) {
    var oldSelection = this.selected_;

    this.selected_ = id;
    if (this.selected_ != null) {
      this.selectedMessage_ = this.messageView_.getMessage(this.selected_);
    } else {
      this.selectedMessage_ = null;
    }

    this.dispatchEvent({
      type: "changed",
      oldSelection: oldSelection,
      selection: this.selected_
    });
  }
};

SelectionTracker.prototype.clampSelection_ = function(top) {
  // If there is an on-screen selection, don't do anything.
  if (this.selected_ != null) {
    var node = this.getSelectedNode_();
    if (node) {
      var bounds = this.messageView_.viewportBounds();
      var b = node.getBoundingClientRect();
      if (b.bottom > bounds.top && b.top < bounds.bottom)
        return false;
    }
  }

  // Otherwise, clamp to top or bottom.
  var newIdx = top ? this.messageView_.findTopMessage()
    : this.messageView_.findBottomMessage();
  if (newIdx == null)
    return false;
  this.selectMessage(this.messageView_.cachedMessage(newIdx).id);
  return true;
};

SelectionTracker.prototype.adjustSelection_ = function(direction,
                                                       scrollLongMessages) {
  // Clamp the selection.
  if (this.clampSelection_(direction > 0))
    return true;

  // Get the currently selected node. Pretty sure this can only be
  // null now with an empty messagelist, but let's be thorough.
  if (this.selected_ == null)
    return false;
  var node = this.getSelectedNode_();
  if (node == null)
    return false;

  var bounds = this.messageView_.viewportBounds();
  var b = node.getBoundingClientRect();
  // Scroll to show the corresponding edge of the message first.
  if (scrollLongMessages) {
    if (direction > 0 && b.bottom > bounds.bottom - MARGIN_BELOW)
      return false;
    if (direction < 0 && b.top < bounds.top)
      return false;
  }

  var idx = this.messageView_.getCacheIndex(this.selected_);
  if (idx == null) return false;  // Again, should not happen.
  var newIdx = idx + direction;
  if (newIdx < 0 || newIdx >= this.messageView_.cacheCount())
    return false;  // There isn't a message to select.

  // TODO(davidben): This grew organically out of a handful of
  // experiments before settling on something similar to what BarnOwl
  // does anyway. It can probably be simplified.
  var newMsg = this.messageView_.cachedMessage(newIdx);
  this.selectMessage(newMsg.id);
  var newNode = this.messageView_.cachedNode(newIdx);

  // What it would take to get the top of the new message at the top
  // of the screen.
  var topScroll = 0;
  // What it would take to get to the goal ratio.
  var goalScroll = ((direction < 0) ?
                    (bounds.height * GOAL_RATIO_UP) :
                    (bounds.height * GOAL_RATIO_DOWN));
  var currentOffset = newNode.getBoundingClientRect().top - bounds.top;
  if ((direction < 0 && currentOffset < goalScroll) ||
      (direction > 0 && currentOffset > goalScroll)) {
    // What it would take to keep the top of the selected message fixed.
    var fixedScroll = b.top - bounds.top;

    // Pick the first, but don't move the top of the selected message
    // much.
    var newScroll = clamp(fixedScroll - MAX_ARROW_SCROLL,
                          goalScroll,
                          fixedScroll + MAX_ARROW_SCROLL);
    this.messageView_.scrollToMessage(newMsg.id, {offset: newScroll});
  }
  // Whatever happens, make sure the message is visible.
  this.ensureSelectionVisible();
  return true;
};

SelectionTracker.prototype.isSelectionVisible = function() {
  var bounds = this.messageView_.viewportBounds();

  // We never saw the selection.
  if (this.selectedMessage_ == null)
    return false;

  var node = this.getSelectedNode_();
  if (node == null)
    return false;

  // Scroll the message into view if not there.
  var b = node.getBoundingClientRect();
  if (b.top < bounds.top) {
    return false;
  } else if (b.bottom > bounds.bottom) {
    return false;
  }
  return true;
};

SelectionTracker.prototype.ensureSelectionVisible = function() {
  var bounds = this.messageView_.viewportBounds();

  // We never saw the selection. Don't do anything.
  if (this.selectedMessage_ == null)
    return;

  var node = this.getSelectedNode_();
  if (node == null) {
    // We scrolled the selection off-screen. But we have seen it, so
    // scroll there.
    var alignWithTop = true;
    var firstMessage = this.messageView_.cachedMessage(0);
    if (firstMessage !== undefined) {
      alignWithTop =
        this.messageView_.model_.compareMessages(this.selectedMessage_,
                                                 firstMessage) < 0;
    }
    this.messageView_.scrollToMessage(this.selectedMessage_.id, {
      bootstrap: this.selectedMessage_,
      alignWithTop: alignWithTop
    });
    return;
  }

  // Scroll the message into view if not there.
  var b = node.getBoundingClientRect();
  if (b.top < bounds.top) {
    this.messageView_.scrollToMessage(this.selectedMessage_.id, {
      bootstrap: this.selectedMessage_,
      alignWithTop: true
    });
  } else if (b.bottom > bounds.bottom) {
    this.messageView_.scrollToMessage(this.selectedMessage_.id, {
      bootstrap: this.selectedMessage_,
      alignWithTop: false
    });
  }
};

SelectionTracker.prototype.onKeydown_ = function(ev) {
  if (ev.target !== document.body)
    return;

  function smartNarrow(msg, withInstance, related) {
    var opts = { };
    if (!msg.isPersonal || msg.classKey !== "message") {
      opts.recipient = msg.recipient;
      if (related) {
        opts.class_key_base = msg.classKeyBase;
      } else {
        opts.class_key = msg.classKey;
      }
    } else {
      opts.conversation = msg.conversation;
    }

    if (withInstance) {
      if (related) {
        opts.instance_key_base = msg.instanceKeyBase;
      } else {
        opts.instance_key = msg.instanceKey;
      }
    }

    return new Filter(opts);
  }

  if (matchKey(ev, 40 /* DOWN */) || matchKey(ev, 74 /* j */)) {
    if (this.adjustSelection_(1, ev.keyCode == 40))
      ev.preventDefault();
  } else if (matchKey(ev, 38 /* UP */) || matchKey(ev, 75 /* k */)) {
    if (this.adjustSelection_(-1, ev.keyCode == 38))
      ev.preventDefault();
  } else if (matchKey(ev, 78 /* n */, {altKey:true})) {
    if (this.selectedMessage_) {
      ev.preventDefault();
      this.ensureSelectionVisible();
      this.messageView_.changeFilter(
        smartNarrow(this.selectedMessage_, false, true),
        this.selectedMessage_.id);
      this.messageView_.scope_.$apply();  // Bah.
    }
  } else if (matchKey(ev, 78 /* n */, {altKey:true, shiftKey:true})) {
    if (this.selectedMessage_) {
      ev.preventDefault();
      this.ensureSelectionVisible();
      this.messageView_.changeFilter(
        smartNarrow(this.selectedMessage_, true, true),
        this.selectedMessage_.id);
      this.messageView_.scope_.$apply();  // Bah.
    }
  } else if (matchKey(ev, 77 /* m */, {altKey:true})) {
    if (this.selectedMessage_) {
      ev.preventDefault();
      this.ensureSelectionVisible();
      this.messageView_.changeFilter(
        smartNarrow(this.selectedMessage_, false, false),
        this.selectedMessage_.id);
      this.messageView_.scope_.$apply();  // Bah.
    }
  } else if (matchKey(ev, 77 /* m */, {altKey:true, shiftKey:true})) {
    if (this.selectedMessage_) {
      ev.preventDefault();
      this.ensureSelectionVisible();
      this.messageView_.changeFilter(
        smartNarrow(this.selectedMessage_, true, false),
        this.selectedMessage_.id);
      this.messageView_.scope_.$apply();  // Bah.
    }
  } else if (matchKey(ev, 80 /* p */, {altKey:true})) {
    ev.preventDefault();
    this.messageView_.changeFilter(
      new Filter({is_personal: true}),
      this.isSelectionVisible() ? this.selectedMessage_.id : null);
    this.messageView_.scope_.$apply();  // Bah.
  } else if (matchKey(ev, 86 /* v */, {shiftKey:true})) {
    ev.preventDefault();
    this.messageView_.changeFilter(
      new Filter({}),
      this.isSelectionVisible() ? this.selectedMessage_.id : null);
    this.messageView_.scope_.$apply();  // Bah.
  }
};

SelectionTracker.prototype.onCacheChanged_ = function() {
  if (this.selected_ != null) {
    // Updated the cached selected message if needbe.
    if (this.selectedMessage_ == null) {
      this.selectedMessage_ = this.messageView_.getMessage(this.selected_);
      this.dispatchEvent({type: "seenselection"});
    }
  }
};
