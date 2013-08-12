"use strict";

function longZuser(user) {
  var idx = user.indexOf("@");
  if (idx < 0) {
    // Apparent @REALM, unless "".
    return user ? (user + "@" + CONFIG.realm) : "";
  } else if (idx == user.length - 1) {
    // Ends in @.
    return user + CONFIG.realm;
  } else {
    // Already has a realm.
    return user;
  }
}

function shortZuser(user) {
  var idx = user.indexOf("@");
  if (idx < 0) {
    return user;
  } else if (idx == user.length - 1 ||
             (user.substring(idx + 1).toLowerCase() ==
              CONFIG.realm.toLowerCase())) {
    return user.substring(0, idx);
  } else {
    return user;
  }
}

// Verify simple for now.
//
// TODO(davidben): Be more unicode-aware and markup-aware and all
// that. See editwin.c from BarnOwl. Also later experiment
// format=flowed and the like.
function wrapText(text, fillcol) {
  fillcol = fillcol || 70;
  var lines = text.split("\n");
  var chunks = [];
  for (var j = 0; j < lines.length; j++) {
    if (j > 0)
      chunks.push("\n");
    var last = 0, column = 0;
    var text = lines[j];
    for (var i = 0; i <= text.length; i++) {
      if (i == text.length || text[i] == " ") {
        // Can we add [last, i) to the next line?
        if (column != 0 &&
            (column + (i - last)) >= fillcol) {
          // Nope. Line-wrap.
          chunks.push("\n");
          column = 0;
          // Skip any spaces.
          while (last < text.length && text[last] == " ")
            last++;
          // This can happen if there are a lot of spaces.
          if (i < last)
            i = last;
        }
        if (last < i) {
          chunks.push(text.substring(last, i));
          column += i - last;
          last = i;
        }
      }
    }
  }
  return chunks.join("");
}
