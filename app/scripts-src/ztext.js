"use strict";

function nextChar(str, startInd, re) {
  re.lastIndex = startInd;
  return re.test(str) ? re.lastIndex - 1 : -1;
}
function findTagName(str, startInd) {
  var re = /[a-zA-Z0-9_]*/g;
  re.lastIndex = startInd;
  return (re.exec(str)[0] || "");
}

var OTHERSIDE = {
  "{": ["}", /[@}]/g],
  "(": [")", /[@)]/g],
  "[": ["]", /[@\]]/g],
  "<": [">", /[@>]/g]
};

function ZtextNode(tag, open, close, children) {
  this.tag = tag;
  this.open = open;
  this.close = close;
  this.children = children;
}

var MAX_ZTEXT_DEPTH = 32;

function parseZtextHelper(str, startInd, stopRegex, maxDepth) {
  var ret = [ ];
  function pushText(t) {
    // Don't insert empty strings.
    if (t == "")
      return;
    if (ret.length && typeof ret[ret.length - 1] == "string") {
      ret[ret.length - 1] += t;
    } else {
      ret.push(t);
    }
  }
  while (startInd < str.length) {
    var index = nextChar(str, startInd, stopRegex);
    if (index < 0) {
      pushText(str.substring(startInd));
      startInd = str.length;
      continue;
    }
    pushText(str.substring(startInd, index));
    if (str[index] == "@") {
      if (str[index + 1] == "@") {
        pushText("@");
        startInd = index + 2;
        continue;
      }
      // Don't recurse too deep.
      if (maxDepth <= 0) {
        pushText("@");
        startInd++;
      }
      var tagName = findTagName(str, index + 1);
      var open = str[index + 1 + tagName.length];
      if (!(open in OTHERSIDE)) {
        pushText("@" + tagName);
        startInd = index + 1 + tagName.length;
        continue;
      }
      var close = OTHERSIDE[open][0], nextRegex = OTHERSIDE[open][1];
      var r = parseZtextHelper(
        str,
        index + 1 + tagName.length + 1,
        nextRegex,
        maxDepth - 1);
      ret.push(new ZtextNode(tagName, open, close, r.parsed));
      startInd = r.startInd;
    } else {
      // str[index] == stopChar
      startInd = index + 1;
      break;
    }
  }
  return {
    parsed: ret,
    startInd: startInd
  };
}
function parseZtext(str) {
  return parseZtextHelper(str, 0, /@/g, MAX_ZTEXT_DEPTH).parsed;
}

function ztextToDOM(ztext, parent) {
  if (parent == null)
    parent = document.createDocumentFragment();
  // Either the fragment or the currently active color <span>.
  var curParent = parent;
  for (var i = 0; i < ztext.length; i++) {
    var chunk = ztext[i];
    if (typeof chunk === "string") {
      // TODO(davidben): Newlines, etc. once we're no longer in a
      // <pre>. Or should I just keep it in a <pre>? I guess the
      // question is whether I want to maybe not display things in a
      // fixed-with font sometimes.
      findUrls(chunk, function(url) {
        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "nofollow";  // Eh.
        a.appendChild(document.createTextNode(url));
        curParent.appendChild(a);
      }, function(text) {
        curParent.appendChild(document.createTextNode(text));
      });
    } else {
      // TODO(davidben): Implement zwgc's tags like @small, @medium,
      // @large, @left, @center, @right. Maybe even @font. Not @beep
      // though.
      var tag = chunk.tag.toLowerCase();
      if (tag == "") {
        curParent.appendChild(ztextToDOM(chunk.children));
      } else if (tag == "b" || tag == "bold") {
        var elem = document.createElement("b");
        ztextToDOM(chunk.children, elem);
        curParent.appendChild(elem);
      } else if (tag == "i" || tag == "italic") {
        var elem = document.createElement("i");
        ztextToDOM(chunk.children, elem);
        curParent.appendChild(elem);
      } else if (tag == "color" &&
                 chunk.children.length == 1 &&
                 typeof chunk.children[0] == "string") {
        var color = chunk.children[0];
        if (color in COLOR_MAP)
          color = COLOR_MAP[color];
        var elem = document.createElement("span");
        // Sanitize colors, in case future CSS allows for more
        // interesting expressions or something? I doubt it, but I
        // suppose we may as well sanitize...
        if (/^(?:[a-zA-Z]+|#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})$/.test(color)) {
          elem.style.color = color;
        }
        // This one is weird and affects the current color.
        parent.appendChild(elem);
        curParent = elem;
      } else {
        // BarnOwl doesn't parse unknown tags and zwgc throws them
        // away. People are probably more accustomed to the former.
        curParent.appendChild(document.createTextNode(
          "@" + chunk.tag + chunk.open));
        ztextToDOM(chunk.children, curParent);
        curParent.appendChild(document.createTextNode(chunk.close));
      }
    }
  }
  return parent;
}
