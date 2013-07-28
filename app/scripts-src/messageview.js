"use strict";

// If the number of messages outside the scroll goes outside
// [MIN_BUFFER, MAX_BUFFER], request/retire messages to reach
// TARGET_BUFFER. That there is a buffer between TARGET_BUFFER and our
// endpoints ensures that spurious scrolling will not repeatedly
// request and retire the same message. Also that we do our requests
// in large-ish batches.
var MIN_BUFFER = 50;
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

function matchKey(ev, keyCode, mods) {
  if (ev.keyCode != keyCode)
    return false;
  mods = mods || { };
  var modifiers = ["altKey", "altGraphKey", "ctrlKey", "metaKey", "shiftKey"];
  for (var i = 0; i < modifiers.length; i++) {
    if (Boolean(ev[modifiers[i]]) != Boolean(mods[modifiers[i]]))
      return false;
  }
  return true;
}

var MESSAGE_VIEW_SCROLL_TOP = 0;
var MESSAGE_VIEW_SCROLL_BOTTOM = 1;


function MessageView(model, container) {
  RoostEventTarget.call(this);

  this.model_ = model;
  this.container_ = container;
  // Make this element focusable. This is needed so that you can
  // direct pageup/down and friends to it. Clicking in it mostly works
  // but we cannot control that programmatically. Moreover, it exposes
  // a quirk in WebKit and Blink; they track the most recently clicked
  // DOM node and use it to determine scroll when there is no focus
  // node. This breaks when we delete that node.
  this.container_.tabIndex = 0;

  this.loadingAbove_ = document.createElement("div");
  this.loadingAbove_.classList.add("msgview-loading-above");
  var orly = document.createElement("pre");
  orly.classList.add("msgview-loading-above-text");
  orly.textContent = "^ ^\n      \u02d8v\u02d8 . z Z\n(^^^)\n-m-m-";
  this.loadingAbove_.appendChild(orly);

  this.loadingBelow_ = document.createElement("div");
  this.loadingBelow_.classList.add("msgview-loading-below");
  var yarly = document.createElement("pre");
  yarly.classList.add("msgview-loading-below-text");
  yarly.textContent = "^ ^\n      \u02d8v\u02d8 . z Z\n(^^^)\n-m-m-";
  this.loadingBelow_.appendChild(yarly);

  setInterval(function() {
    var text = orly.textContent;
    text = text.replace(". z Z", " wat ");
    text = text.replace(". z  ", ". z Z");
    text = text.replace(".    ", ". z  ");
    text = text.replace(" wat ", ".    ");
    orly.textContent = text;
    yarly.textContent = text;
  }, 1000);

  this.messagesDiv_ = document.createElement("div");

  this.topMarker_ = document.createElement("div");
  this.topMarker_.classList.add("msgview-top-marker");

  this.container_.appendChild(this.topMarker_);
  this.container_.appendChild(this.loadingAbove_);
  this.container_.appendChild(this.messagesDiv_);
  this.container_.appendChild(this.loadingBelow_);

  this.tailBelow_ = null;
  this.tailBelowOffset_ = 0;  // The global index of the tail reference.

  this.tailAbove_ = null;
  this.tailAboveOffset_ = 0;  // The global index of the tail reference.

  this.filter_ = new Filter({});

  // True if we have a pending checkBuffers_ call.
  this.checkBuffersPending_ = false;

  this.reset_();

  this.container_.addEventListener("scroll", this.checkBuffers_.bind(this));
  this.container_.addEventListener("keydown", this.onKeydown_.bind(this));
  this.container_.addEventListener("scroll", this.snapView_.bind(this));
}
MessageView.prototype = Object.create(RoostEventTarget.prototype);

MessageView.prototype.snapView_ = function() {
  var top = document.elementFromPoint(0, 0);
  if (top.tagName.toLowerCase() == 'pre') {
    this.container_.scrollTop = top.offsetTop;
  }
};

MessageView.prototype.container = function() {
  return this.container_;
};

MessageView.prototype.cachedMessages = function() {
  return this.messages_;
};

MessageView.prototype.cachedNodes = function() {
  return this.nodes_;
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
  return this.nodes_[idx];
};

MessageView.prototype.getMessage = function(id) {
  var idx = this.getCacheIndex(id);
  if (idx == null)
    return null;
  return this.messages_[idx];
};

MessageView.prototype.findTopMessage = function() {
  var bounds = this.container().getBoundingClientRect();
  var nodes = this.cachedNodes();
  if (nodes.length == 0)
    return null;
  var lo = 0;
  var hi = nodes.length - 1;
  while (lo < hi) {
    var mid = ((lo + hi) / 2) | 0;
    var b = nodes[mid].getBoundingClientRect();
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
      nodes[lo].getBoundingClientRect().top >=
      (bounds.top + bounds.height/2)) {
    lo--;
  }
  return lo;
};

MessageView.prototype.findBottomMessage = function() {
  var bounds = this.container().getBoundingClientRect();
  var nodes = this.cachedNodes();
  if (nodes.length == 0)
    return null;
  var lo = 0;
  var hi = nodes.length - 1;
  while (lo < hi) {
    var mid = ((lo + hi + 1) / 2) | 0;
    var b = nodes[mid].getBoundingClientRect();
    // Find the first message which ends at or before the bounds.
    if (b.bottom < bounds.bottom) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  // It's possible the message we found ends very early, if the
  // next is long. In that case, prefer the next one.
  if (lo < nodes.length - 2 &&
      nodes[lo].getBoundingClientRect().bottom <=
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

  this.listOffset_ = 0;  // The global index to the top of the list.
  this.messages_ = [];
  this.nodes_ = [];

  this.messageToIndex_ = {};  // Map id to global index.

  this.messagesDiv_.textContent = "";

  // Default to something. Only in the case if this.messages_ is
  // empty, this is the bootstrap cutoff between the two tails. It is
  // either a message id (string) or a one of two magic values for top and bottom.
  this.pendingCenter_ = MESSAGE_VIEW_SCROLL_TOP;

  // FIXME: This shows two loading bars. But we can't actually lie
  // about one side because atTop_ and atBottom_ are needed to
  // implement home/end behavior.
  this.setAtTop_(false);
  this.setAtBottom_(false);
  this.loadingBelow_.scrollIntoView();
};

MessageView.prototype.changeFilter = function(filter, anchor) {
  // First: if there is no anchor, set the anchor to be the top
  // message, arbitrarily.
  if (anchor == null) {
    // TODO(davidben): Look for a message on-screen that matches. If
    // there is one, use it instead.
    var topIdx = this.findTopMessage();
    anchor = topIdx == null ? null : this.messages_[topIdx].id;
  }

  // Next: Save all information about the anchor.
  var containerTop = this.container_.getBoundingClientRect().top;
  var anchorTop, anchorIdx;
  if (anchor == null) {
    // If the anchor is still null, we have no cached messages and need
    // to use pendingCenter_. Scroll position is the space in-between.
    anchorTop = this.loadingBelow_.getBoundingClientRect().top;
    anchorIdx = null;
    // Anchor at pendingCenter.
    anchor = this.pendingCenter_;
  } else {
    var anchorNode = this.getNode(anchor);
    if (anchorNode == null) {
      // User was crazy and supplied an anchor that wasn't even
      // on-screen. Screw it, we're putting it on top.
      anchorTop = containerTop;
    } else {
      anchorTop = anchorNode.getBoundingClientRect().top;
    }
    anchorIdx = this.getCacheIndex(anchor);
  }

  var bootstrapBefore = [], bootstrapAfter = [];
  if (anchorIdx != null) {
    if (filter.isStricterThan(this.filter_)) {
      // If we are stricter than the current filter, we can keep the
      // whole cache.
      for (var i = 0; i < anchorIdx; i++) {
        if (filter.matchesMessage(this.messages_[i]))
          bootstrapBefore.push(this.messages_[i]);
      }
      for (var i = anchorIdx; i < this.messages_.length; i++) {
        if (filter.matchesMessage(this.messages_[i]))
          bootstrapAfter.push(this.messages_[i]);
      }
    } else {
      // Otherwise, we only keep the anchor message.
      if (filter.matchesMessage(this.messages_[anchorIdx]))
        bootstrapAfter.push(this.messages_[anchorIdx]);
    }
  }

  // Now we are ready to blow everything away.
  this.reset_();
  this.pendingCenter_ = anchor;

  // TODO(davidben): Silliness with top/bottom. Make this state also
  // more rederivable or something.
  if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_TOP) {
    this.setAtTop_(true);
    this.setAtBottom_(false);
  } else if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_BOTTOM) {
    this.setAtTop_(false);
    this.setAtBottom_(true);
  }

  // Scroll so that loadingBelow_ is where we want anchor to appear.
  this.container_.scrollTop =
    (this.loadingBelow_.getBoundingClientRect().top -
     this.topMarker_.getBoundingClientRect().top) -
    (anchorTop - containerTop);
  this.filter_ = filter;

  // Apply the bootstrap. That will trigger tails and everything else.
  if (bootstrapBefore.length)
    this.prependMessages_(bootstrapBefore, false);
  if (bootstrapAfter.length)
    this.appendMessages_(bootstrapAfter, false);
  this.checkBuffers_();
};

MessageView.prototype.scrollToMessage = function(id, bootstrap, alignWithTop) {
  // TODO(davidben): This function is pretty wonky. Really it should
  // just be two functions.
  if (bootstrap == undefined || alignWithTop == undefined)
    alignWithTop = true;

  if (bootstrap && !(id in this.messageToIndex_)) {
    this.reset_();
    // appendMessages_ will trigger all the tails we need.
    this.appendMessages_([bootstrap], false);
  }

  if (id in this.messageToIndex_) {
    // Easy case: if the message is in our current view, we just jump
    // to it.
    var node = this.nodes_[this.messageToIndex_[id] - this.listOffset_];
    node.scrollIntoView(alignWithTop);
    if (!alignWithTop) {
      if (node.getBoundingClientRect().top <
          this.container_.getBoundingClientRect().top) {
        node.scrollIntoView(true);
      }
    }
  } else {
    // Otherwise, we reset the universe and use |id| as our new point of
    // reference.
    this.reset_();
    this.pendingCenter_ = id;
    this.checkBuffers_();
  }
};

MessageView.prototype.scrollToTop = function(id) {
  if (this.atTop_) {
    // Easy case: if the top is buffered, go there.
    this.container_.scrollTop = 0;
    return;
  }

  // Otherwise, we reset the universe and use |id| as our new point of
  // reference.
  this.reset_();
  this.pendingCenter_ = MESSAGE_VIEW_SCROLL_TOP;
  // Blegh. Cut out the "Loading..." text now.
  this.setAtTop_(true);
  this.setAtBottom_(false);
  this.container_.scrollTop = 0;
  this.checkBuffers_();
};

MessageView.prototype.scrollToBottom = function(id) {
  if (this.atBottom_) {
    // Easy case: if the bottom is buffered, go there.
    this.container_.scrollTop = this.container_.scrollHeight;
    return;
  }

  // Otherwise, we reset the universe and use |id| as our new point of
  // reference.
  this.reset_();
  this.pendingCenter_ = MESSAGE_VIEW_SCROLL_BOTTOM;
  // Blegh. Cut out the "Loading..." text now.
  this.setAtTop_(false);
  this.setAtBottom_(true);
  this.checkBuffers_();
};

MessageView.prototype.setAtTop_ = function(atTop) {
  if (this.atTop_ == atTop) return;
  this.atTop_ = atTop;
  if (this.atTop_)
    this.loadingAbove_.classList.add("msgview-loading-above-at-end");
  else
    this.loadingAbove_.classList.remove("msgview-loading-above-at-end");
};

MessageView.prototype.setAtBottom_ = function(atBottom) {
  this.atBottom_ = atBottom;
  if (this.atBottom_)
    this.loadingBelow_.classList.add("msgview-loading-below-at-end");
  else
    this.loadingBelow_.classList.remove("msgview-loading-below-at-end");
};

MessageView.prototype.saveBottomEdgeScroll_ = function() {
  var oldScrollTop = this.container_.scrollTop;
  var oldBottomOffset = (this.messagesDiv_.getBoundingClientRect().bottom -
                         this.topMarker_.getBoundingClientRect().top);
  return oldScrollTop - oldBottomOffset;
};

MessageView.prototype.restoreBottomEdgeScroll_ = function(save) {
  // Assumes that the bottom edge of messagesDiv_ hasn't changed since
  // the call to saveBottomEdgeScroll_.
  var newBottomOffset = (this.messagesDiv_.getBoundingClientRect().bottom -
                         this.topMarker_.getBoundingClientRect().top);
  this.container_.scrollTop = newBottomOffset + save;
};

MessageView.prototype.appendMessages_ = function(msgs, isDone) {
  for (var i = 0; i < msgs.length; i++) {
    var idx = this.messages_.length + this.listOffset_;
    this.messageToIndex_[msgs[i].id] = idx;

    var node = this.formatMessage_(idx, msgs[i]);
    this.nodes_.push(node);
    this.messages_.push(msgs[i]);

    this.messagesDiv_.appendChild(node);
  }
  this.setAtBottom_(isDone);
  // If we were waiting to select a message that hadn't arrived yet,
  // refresh that.
  this.dispatchEvent({type: "cachechanged"});
  this.checkBuffers_();
};

MessageView.prototype.prependMessages_ = function(msgs, isDone) {
  // TODO(davidben): This triggers layout a bunch. Optimize this if needbe.
  var nodes = [];
  var insertReference = this.messagesDiv_.firstChild;
  var save = this.saveBottomEdgeScroll_();
  for (var i = 0; i < msgs.length; i++) {
    var idx = this.listOffset_ - msgs.length + i;
    this.messageToIndex_[msgs[i].id] = idx;

    var node = this.formatMessage_(idx, msgs[i]);
    nodes.push(node);

    this.messagesDiv_.insertBefore(node, insertReference);
  }
  this.setAtTop_(isDone);
  this.restoreBottomEdgeScroll_(save);

  this.messages_.unshift.apply(this.messages_, msgs);
  this.nodes_.unshift.apply(this.nodes_, nodes);
  this.listOffset_ -= msgs.length;

  // If we were waiting to select a message that hadn't arrived yet,
  // refresh that.
  this.dispatchEvent({type: "cachechanged"});
  this.checkBuffers_();
};

var COLORS = ["white", "yellow", "red",
              "orange", "fuchsia", "lightgreen", "skyblue"];
MessageView.prototype.formatMessage_ = function(idx, msg) {
  var pre = document.createElement("pre");
  var indented = "   " +
    msg.message.replace(/\s+$/, '').split("\n").join("\n   ");

  var a = document.createElement("a");
  a.href = "#msg-" + msg.id;
  a.textContent = "[LINK]";

  var number = msg.number;
  if (number == undefined) {
    // Hash the class + instance, I guess...
    number = 0;
    var s = msg.classKey + "|" + msg.instanceKey;
    for (var i = 0; i < s.length; i++) {
      // Dunno, borrowed from some random thing on the Internet that
      // claims to be Java's.
      number = ((number << 5) - number + s.charCodeAt(i)) | 0;
    }
  }

  // Save for closure.
  var id = msg.id;
  var classKeyBase = msg.classKeyBase, instanceKeyBase = msg.instanceKeyBase;

  pre.appendChild(a);
  pre.appendChild(document.createTextNode(" "));

  if (msg.isPersonal && msg.classKey == "message") {
    if (msg.isOutgoing) {
      pre.appendChild(document.createTextNode("Zephyr to "));
      a = document.createElement("a");
      a.textContent = msg.recipient;
      a.addEventListener("click", function(ev) {
        ev.preventDefault();
        this.changeFilter(new Filter({conversation: msg.recipient}), id);
      }.bind(this));
      pre.appendChild(a);

      pre.appendChild(document.createTextNode(" / "));
      a = document.createElement("a");
      a.textContent = msg.instance;
      a.addEventListener("click", function(ev) {
        ev.preventDefault();
        this.changeFilter(new Filter({
          conversation: msg.recipient,
          instance_key_base: instanceKeyBase
        }), id);
      }.bind(this));
      pre.appendChild(a);

      pre.appendChild(document.createTextNode(
        "  " + new Date(msg.time).toString() + "\n"));
    } else {
      pre.appendChild(document.createTextNode("Zephyr from "));
      a = document.createElement("a");
      a.textContent = msg.sender;
      a.addEventListener("click", function(ev) {
        ev.preventDefault();
        this.changeFilter(new Filter({conversation: msg.sender}), id);
      }.bind(this));
      pre.appendChild(a);

      pre.appendChild(document.createTextNode(" / "));
      a = document.createElement("a");
      a.textContent = msg.instance;
      a.addEventListener("click", function(ev) {
        ev.preventDefault();
        this.changeFilter(new Filter({
          conversation: msg.sender,
          instance_key_base: instanceKeyBase
        }), id);
      }.bind(this));
      pre.appendChild(a);

      pre.appendChild(document.createTextNode(
        "  " + new Date(msg.time).toString() + "\n"));
    }
  } else {
    a = document.createElement("a");
    a.textContent = msg.class;
    a.addEventListener("click", function(ev) {
      ev.preventDefault();
      this.changeFilter(new Filter({class_key_base: classKeyBase}), id);
    }.bind(this));
    pre.appendChild(a);

    pre.appendChild(document.createTextNode(" / "));
    a = document.createElement("a");
    a.textContent = msg.instance;
    a.addEventListener("click", function(ev) {
      ev.preventDefault();
      this.changeFilter(new Filter({
        class_key_base: classKeyBase,
        instance_key_base: instanceKeyBase
      }), id);
    }.bind(this));
    pre.appendChild(a);

    pre.appendChild(document.createTextNode(
      " / " + msg.sender + "  " +
        new Date(msg.time).toString() + "\n"));
  }

  pre.appendChild(ztextToDOM(parseZtext(indented)));

  pre.className = "message";
  pre.style.color = COLORS[((number % COLORS.length) + COLORS.length) % COLORS.length];

  pre.addEventListener("click",
                       this.onClickMessage_.bind(this, idx));
  return pre;
};

// Return 1 if we need to expand below, -1 if we need to contract, and
// 0 if neither.
MessageView.prototype.checkBelow_ = function(bounds) {
  // Do we need to expand?
  if (this.nodes_.length < MIN_BUFFER)
    return 1;
  var b = this.nodes_[this.nodes_.length - MIN_BUFFER].getBoundingClientRect();
  if (bounds.bottom > b.top)
    return 1;

  // Do we need to contract?
  if (this.nodes_.length < MAX_BUFFER)
    return 0;
  b = this.nodes_[this.nodes_.length - MAX_BUFFER].getBoundingClientRect();
  if (bounds.bottom < b.top)
    return -1;

  return 0;
};

MessageView.prototype.checkAbove_ = function(bounds) {
  // Do we need to expand?
  if (this.nodes_.length < MIN_BUFFER)
    return 1;
  var b = this.nodes_[MIN_BUFFER - 1].getBoundingClientRect();
  if (bounds.top < b.bottom)
    return 1;

  // Do we need to contract?
  if (this.nodes_.length < MAX_BUFFER)
    return 0;
  b = this.nodes_[MAX_BUFFER - 1].getBoundingClientRect();
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

  if (this.messages_.length) {
    this.tailAbove_ = this.model_.newReverseTail(
      this.messages_[0].id,
      this.filter_,
      this.prependMessages_.bind(this));
    this.tailAboveOffset_ = this.listOffset_;
  } else {
    // Bootstrap with the pending center.
    if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_TOP) {
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

  if (this.messages_.length) {
    this.tailBelow_ = this.model_.newTail(
      this.messages_[this.messages_.length - 1].id,
      this.filter_,
      this.appendMessages_.bind(this));
    this.tailBelowOffset_ = this.listOffset_ + this.messages_.length - 1;
  } else {
    // Bootstrap with the pending center.
    if (this.pendingCenter_ === MESSAGE_VIEW_SCROLL_TOP) {
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
    setTimeout(this.checkBuffersReal_.bind(this), 0);
    this.checkBuffersPending_ = true;
  }
};

MessageView.prototype.checkBuffersReal_ = function() {
  this.checkBuffersPending_ = false;
  var bounds = this.container_.getBoundingClientRect();

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
  if (below > 0) {
    this.ensureTailBelow_();
    if (this.tailBelow_) {
      this.tailBelow_.expandTo(
        this.listOffset_ + this.nodes_.length - 1 + (TARGET_BUFFER - MIN_BUFFER)
          - this.tailBelowOffset_);
    }
  } else if (below < 0) {
    // Close the current tail.
    if (this.tailBelow_) {
      this.tailBelow_.close();
      this.tailBelow_ = null;
    }

    var num = MAX_BUFFER - TARGET_BUFFER;
    for (var i = 0; i < num; i++) {
      var idx = this.nodes_.length - i - 1;
      this.messagesDiv_.removeChild(this.nodes_[idx]);
      delete this.messageToIndex_[this.messages_[idx].id];
    }
    this.nodes_.splice(this.nodes_.length - num, num);
    this.messages_.splice(this.messages_.length - num, num);

    this.setAtBottom_(false);
  }

  var above = this.checkAbove_(bounds);
  if (above > 0) {
    this.ensureTailAbove_();
    if (this.tailAbove_) {
      this.tailAbove_.expandTo(
        this.tailAboveOffset_ -
          (this.listOffset_ - (TARGET_BUFFER - MIN_BUFFER)));
    }
  } else if (above < 0) {
    // Close the current tail.
    if (this.tailAbove_) {
      this.tailAbove_.close();
      this.tailAbove_ = null;
    }

    var num = MAX_BUFFER - TARGET_BUFFER;
    var save = this.saveBottomEdgeScroll_();
    for (var i = 0; i < num; i++) {
      this.messagesDiv_.removeChild(this.nodes_[i]);
      delete this.messageToIndex_[this.messages_[i].id];
    }
    this.setAtTop_(false);
    this.restoreBottomEdgeScroll_(save);
    this.nodes_.splice(0, num);
    this.messages_.splice(0, num);
    this.listOffset_ += num;
  }
};

MessageView.prototype.onKeydown_ = function(ev) {
  // Handle home/end keys ourselves. Instead of going to the bounds of
  // the currently buffered view (totally meaningless), they go to the
  // top/bottom of the full message list.
  if (matchKey(ev, 36 /* HOME */) ||
      matchKey(ev, 188 /* < */, {shiftKey:1}) ||
      matchKey(ev, 32 /* UP */, {metaKey:1})) {
    ev.preventDefault();
    this.scrollToTop();
  } else if (matchKey(ev, 35 /* END */) ||
             matchKey(ev, 190 /* > */, {shiftKey:1}) ||
             matchKey(ev, 40 /* DOWN */, {metaKey:1})) {
    ev.preventDefault();
    this.scrollToBottom();
  }
};

MessageView.prototype.onClickMessage_ = function(idx, ev) {
  this.dispatchEvent({
    type: "messageclick",
    cacheIndex: idx - this.listOffset_
  });
};

// Split the selection logic out for sanity.
function SelectionTracker(messageView) {
  this.messageView_ = messageView;

  this.selected_ = null;  // The id of the selected message.
  this.selectedMessage_ = null;  // null if we never saw the message.

  this.messageView_.addEventListener("cachechanged",
                                     this.onCacheChanged_.bind(this));
  this.messageView_.container().addEventListener("keydown",
                                                 this.onKeydown_.bind(this));
};

SelectionTracker.prototype.getSelectedNode_ = function() {
  if (this.selected_ == null)
    return null;
  return this.messageView_.getNode(this.selected_);
};

SelectionTracker.prototype.selectMessage = function(id) {
  if (this.selected_ != null) {
    var oldNode = this.getSelectedNode_();
    if (oldNode)
      oldNode.classList.remove("message-selected");
  }
  if (this.selected_ != id)
    this.selectedMessage_ = null;
  this.selected_ = id;
  // Update the display and everything else.
  this.onCacheChanged_();
};

SelectionTracker.prototype.clampSelection_ = function(top) {
  // If there is an on-screen selection, don't do anything.
  if (this.selected_ != null) {
    var node = this.getSelectedNode_();
    if (node) {
      var bounds = this.messageView_.container().getBoundingClientRect();
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
  this.selectMessage(this.messageView_.cachedMessages()[newIdx].id);
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

  var bounds = this.messageView_.container().getBoundingClientRect();
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
  if (newIdx < 0 || newIdx >= this.messageView_.cachedNodes().length)
    return false;  // There isn't a message to select.

  // TODO(davidben): This grew organically out of a handful of
  // experiments before settling on something similar to what BarnOwl
  // does anyway. It can probably be simplified.
  this.selectMessage(this.messageView_.cachedMessages()[newIdx].id);
  var newNode = this.messageView_.cachedNodes()[newIdx];

  // What it would take to get the top of the new message at the top
  // of the screen.
  var topScroll =
    newNode.getBoundingClientRect().top -
    this.messageView_.topMarker_.getBoundingClientRect().top;
  // What it would take to get to the goal ratio.
  var goalScroll = topScroll - ((direction < 0) ?
                                (bounds.height * GOAL_RATIO_UP) :
                                (bounds.height * GOAL_RATIO_DOWN));
  if ((direction < 0 && this.messageView_.container().scrollTop > goalScroll) ||
      (direction > 0 && this.messageView_.container().scrollTop < goalScroll)) {
    // What it would take to keep the top of the selected message fixed.
    var fixedScroll = this.messageView_.container().scrollTop +
      direction * node.getBoundingClientRect().height;

    // Pick the first, but don't move the top of the selected message
    // much.
    var newScroll = clamp(fixedScroll - MAX_ARROW_SCROLL,
                          goalScroll,
                          fixedScroll + MAX_ARROW_SCROLL);
    this.messageView_.container().scrollTop = newScroll;
  }
  // Whatever happens, make sure the message is visible.
  this.ensureSelectionVisible_();
  return true;
};

SelectionTracker.prototype.isSelectionVisible = function() {
  var bounds = this.messageView_.container().getBoundingClientRect();

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

SelectionTracker.prototype.ensureSelectionVisible_ = function() {
  var bounds = this.messageView_.container().getBoundingClientRect();

  // We never saw the selection. Don't do anything.
  if (this.selectedMessage_ == null)
    return;

  var node = this.getSelectedNode_();
  if (node == null) {
    // We scrolled the selection off-screen. But we have seen it, so
    // scroll there.
    var alignWithTop = true;
    var firstMessage = this.messageView_.cachedMessages()[0];
    if (firstMessage !== undefined) {
      alignWithTop =
        this.messageView_.model_.compareMessages(this.selectedMessage_,
                                                 firstMessage) < 0;
    }
    this.messageView_.scrollToMessage(
      this.selectedMessage_.id, this.selectedMessage_, alignWithTop);
    return;
  }

  // Scroll the message into view if not there.
  var b = node.getBoundingClientRect();
  if (b.top < bounds.top) {
    this.messageView_.scrollToMessage(
      this.selectedMessage_.id, this.selectedMessage_, true);
  } else if (b.bottom > bounds.bottom) {
    this.messageView_.scrollToMessage(
      this.selectedMessage_.id, this.selectedMessage_, false);
  }
};

SelectionTracker.prototype.onKeydown_ = function(ev) {
  function smartNarrow(msg, withInstance, related) {
    var opts = { };
    if (msg.recipient == "" || msg.recipient[0] == "@") {
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
      this.ensureSelectionVisible_();
      this.messageView_.changeFilter(
        smartNarrow(this.selectedMessage_, false, true),
        this.selectedMessage_.id);
    }
  } else if (matchKey(ev, 78 /* n */, {altKey:true, shiftKey:true})) {
    if (this.selectedMessage_) {
      ev.preventDefault();
      this.ensureSelectionVisible_();
      this.messageView_.changeFilter(
        smartNarrow(this.selectedMessage_, true, true),
        this.selectedMessage_.id);
    }
  } else if (matchKey(ev, 77 /* m */, {altKey:true})) {
    if (this.selectedMessage_) {
      ev.preventDefault();
      this.ensureSelectionVisible_();
      this.messageView_.changeFilter(
        smartNarrow(this.selectedMessage_, false, false),
        this.selectedMessage_.id);
    }
  } else if (matchKey(ev, 77 /* m */, {altKey:true, shiftKey:true})) {
    if (this.selectedMessage_) {
      ev.preventDefault();
      this.ensureSelectionVisible_();
      this.messageView_.changeFilter(
        smartNarrow(this.selectedMessage_, true, false),
        this.selectedMessage_.id);
    }
  } else if (matchKey(ev, 80 /* p */, {altKey:true})) {
    ev.preventDefault();
    this.messageView_.changeFilter(
      new Filter({is_personal: true}),
      this.isSelectionVisible() ? this.selectedMessage_.id : null);
  } else if (matchKey(ev, 86 /* v */, {shiftKey:true})) {
    ev.preventDefault();
    this.messageView_.changeFilter(
      new Filter({}),
      this.isSelectionVisible() ? this.selectedMessage_.id : null);
  }
};

SelectionTracker.prototype.onCacheChanged_ = function() {
  if (this.selected_ != null) {
    // Updated the cached selected message if needbe.
    if (this.selectedMessage_ == null)
      this.selectedMessage_ = this.messageView_.getMessage(this.selected_);
    // Update the display. Node may have been destroyed or recreated.
    var node = this.getSelectedNode_();
    if (node)
      node.classList.add("message-selected");
  }
};
