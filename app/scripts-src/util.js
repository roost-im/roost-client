"use strict";

function longZuser(user) {
  var idx = user.indexOf("@");
  if (idx < 0) {
    return user + "@" + CONFIG.realm;
  } else if (idx == user.length - 1) {
    return user + CONFIG.realm;
  } else {
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