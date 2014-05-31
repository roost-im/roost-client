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

var stringToColor = function(str) {
  // str to hash
  for (var i = 0, hash = 0; i < str.length; hash = str.charCodeAt(i++) + ((hash << 5) - hash));

  // int/hash to hex
  for (var i = 0, colour = "#"; i < 3; colour += ("00" + ((hash >> i++ * 8) & 0xFF).toString(16)).slice(-2));

  return colour;
}

var shadeColor = function(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
  return check; 
}
