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

function zuserRealm(user) {
  var idx = user.indexOf("@");
  if (idx < 0 || idx == user.length - 1)
    return CONFIG.realm;
  return user.substring(idx + 1);
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

var getGravatarFromName = (function() {
  var cache = { };
  return function(name, realm, size) {
    size = Number(size);
    var hash = cache[name + "@" + realm];
    if (hash === undefined) {
      var email = name + "@" + realm;

      if (realm == "ATHENA.MIT.EDU") {
        email = name + "@mit.edu";
      }

      // 1. Trim leading and trailing whitespace from an email address.
      email = email.replace(/^\s+/, '');
      email = email.replace(/\s+$/, '');
      // 2. Force all characters to lower-case.
      email = email.toLowerCase();
      // 3. md5 hash the final string.
      hash = CryptoJS.enc.Hex.stringify(
        CryptoJS.MD5(CryptoJS.enc.Utf8.parse(email)));
      cache[name + "@" + realm] = hash;
    }
    var ret = "https://secure.gravatar.com/avatar/" + hash + "?d=identicon";
    if (size)
      ret += "&s=" + size;
    return ret;
  };
})();
