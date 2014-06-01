'use strict'

OTHERSIDE =
  "{": ["}", /[@}]/g],
  "(": [")", /[@)]/g]
  "[": ["]", /[@\]]/g]
  "<": [">", /[@>]/g]

MAX_ZTEXT_DEPTH = 32

nextChar = (str, startInd, re) ->
  re.lastIndex = startInd
  return (if re.test(str) then re.lastIndex - 1 else -1)

findTagName = (str, startInd) ->
  re = /[a-zA-Z0-9_]*/g
  re.lastIndex = startInd
  return re.exec(str)[0] or ""

class ZtextNode
  constructor: (@tag, @open, @close, @children) ->

parseZtextHelper = (str, startInd, stopRegex, maxDepth) ->
  ret = []
  pushText = (t) ->
    if t == "" then return
    if (ret.length && typeof ret[ret.length - 1] == "string")
      ret[ret.length - 1] += t
    else
      ret.push(t)

  while startInd < str.length
    index = nextChar(str, startInd, stopRegex)
    if index < 0
      pushText(str.substring(startInd))
      startInd = str.length
      continue
    pushText(str.substring(startInd, index))

    if str[index] == "@"
      if str[index + 1] == "@"
        pushText("@")
        startInd = index + 2
        continue

      if maxDepth <= 0
        pushText("@")
        startInd++

      tagName = findTagName(str, index + 1)
      open = str[index + 1 + tagName.length]
      if open not of OTHERSIDE
        pushText("@" + tagName)
        startInd = index + 1 + tagName.length
        continue

      close = OTHERSIDE[open][0]
      nextRegex = OTHERSIDE[open][1]
      r = parseZtextHelper(
        str, index + 1 + tagName.length + 1, nextRegex, maxDepth + 1)
      ret.push(new ZtextNode(tagName, open, close, r.parsed))
      startInd = r.startInd
    else
      startInd = index + 1
      break

  return parsed: ret, startInd: startInd

parseZtext = (str) ->
  return parseZtextHelper(str, 0, /@/g, MAX_ZTEXT_DEPTH).parsed

ztextToDOM = (ztext, parent) ->
  if not parent
    parent = document.createDocumentFragment()

  curParent = parent
  for chunk in ztext
    if typeof chunk == "string"
      # TODO(davidben): Newlines, etc. once we're no longer in a
      # <pre>. Or should I just keep it in a <pre>? I guess the
      # question is whether I want to maybe not display things in a
      # fixed-width font sometimes.
      findUrls(chunk, ((url) ->
        a = document.createElement("a")
        a.href = url
        a.target = "_blank"
        a.rel = "nofollow" # Eh.
        a.appendChild(document.createTextNode(url))
        curParent.appendChild(a))
      , ((text) ->
        curParent.appendChild(document.createTextNode(text))
      ))
    else
      # TODO(davidben): Implement zwgc's tags like @small, @medium,
      # @large, @left, @center, @right. Maybe even @font. Not @beep
      # though.
      tag = chunk.tag.toLowerCase()
      switch tag
        when ""
          curParent.appendChild(ztextToDOM(chunk.children))
        when "b", "bold"
          elem = document.createElement("b")
          ztextToDOM(chunk.children, elem)
          curParent.appendChild(elem)
        when "i", "italic"
          elem = document.createElement("i")
          ztextToDOM(chunk.children, elem)
          curParent.appendChild(elem)
        when "color"
          if chunk.children.length == 1 && typeof chunk.children[0] == "string"
            color = chunk.children[0]
            if color in COLOR_MAP
              color = COLOR_MAP[color]
            elem = document.createElement("span")
            # Sanitize colors, in case future CSS allows for more
            # interesting expressions or something? I doubt it, but I
            # suppose we may as well sanitize...
            if /^(?:[a-zA-Z]+|#[0-9a-fA-F]{3}|#[0-9a-fA-F]{6})$/.test(color)
              elem.style.color = color;

            # This one is weird and affects the current color.
            parent.appendChild(elem)
            curParent = elem
        else
          # BarnOwl doesn't parse unknown tags and zwgc throws them
          # away. People are probably more accustomed to the former.
          curParent.appendChild(document.createTextNode(
            "@" + chunk.tag + chunk.open))
          ztextToDOM(chunk.children, curParent)
          curParent.appendChild(document.createTextNode(chunk.close))

  return parent

com.roost.ztext =
  parseZtext: parseZtext
  ZtextNode: ZtextNode # Only needed for tests.
  ztextToDOM: ztextToDOM
