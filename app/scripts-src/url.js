"use strict";

// This regex is very much a heuristic, but there are a few edge cases
// that would be good to catch:
//
// Go to http://example.com/index.html.
//   should NOT catch the trailing .
// (The URL is http://example.com/index.html)
//   should NOT catch the trailing )
// https://en.wikipedia.org/wiki/Owl_(disambiguation)
//   SHOULD catch the trailing )
// (This URL is https://en.wikipedia.org/wiki/Owl_(disambiguation))
//   should catch EXACTLY ONE trailing ).
//
// So stop URLs at punctuation, while still allowing the . in
// index.html. Also only take ) if paired with a (. Allowing nesting
// is not regular but not very interesting.
//
// Based on this regex, and the URL parser, to be a bit more strict
// about parsing. Also don't allow username/passwords in the URLs, I
// guess?
//
//   http://daringfireball.net/2010/07/improved_regex_for_matching_urls
//   http://url.spec.whatwg.org/
var URL_REGEX = new RegExp(
  "\\b(?:https|http):\\/\\/" +
  "(?:" +
    "\\[" +
    "(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)?" +
    "(?:::(?:[0-9a-f]{1,4}(?::[0-9a-f]{1,4})*)?)?" +
    "(?::[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3})?" +
    "\\]" +
  "|" +
    // Unclear what characters to actually include here. Going by some
    // combination of RFC3987 and what browsers actually do. Really,
    // guys? It is true that a IETF-style grammar is more useful for
    // this very heuristic-y use case than a WHATWG-style parsing
    // algorithm, but at least the WHATWG folks make an attempt to
    // match reality. It's not actually useful if I have to check your
    // work.
    "[-a-zA-Z0-9_\\u00a0-\\uefffd]+(?:\\.[-a-zA-Z0-9_\\u00a0-\\uefffd]+)*" +
  ")" +
  "(?:/" +
    "(?:" +
      "(?:" +                       // Zero or more:
        "[^\\s()<>]+" +             // Run of non-space, non-()<>
      "|" +                         // or
        "\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\)" +  // balanced parens, up to 2 levels
      ")*" +
      "(?:" +                       // End with:
        "\\(([^\\s()<>]+|(\\([^\\s()<>]+\\)))*\\)" +  // balanced parens, up to 2 levels
      "|" +                         // or
        "[^\\s`!()\\[\\]{};:'\".,<>?«»“”‘’]" +  // not a space or one of these punct chars
      ")" +
    ")?" +
  ")?",
  "g");

function findUrls(str, urlCb, textCb) {
  var m, idx = 0;
  URL_REGEX.lastIndex = 0;
  while ((m = URL_REGEX.exec(str))) {
    var nextIdx = URL_REGEX.lastIndex - m[0].length;
    if (idx < nextIdx)
      textCb(str.substring(idx, nextIdx));
    urlCb(m[0]);
    idx = URL_REGEX.lastIndex;
  }
  if (idx < str.length)
    textCb(str.substring(idx));
}
