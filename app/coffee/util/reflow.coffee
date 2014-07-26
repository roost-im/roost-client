# 'Reflow' text by heuristically guessing which newlines are 'soft' newlines
# that were inserted for wrapping and which ones are 'hard' newlines that should
# be preserved.
com.roost.reflow = (message) ->
  lines = message.split(/\n/)
  reflowed = ""
  for line, index in lines
    nextLine = lines[index + 1]
    reflowed += line
    # Make sure there *is* a next line before appending a newline.
    if nextLine?
      reflowed += if newlineIsHard(line, lines[index + 1]) then "\n" else " "
  return reflowed

newlineIsHard = (line, nextLine) ->
  # An empty line always has a hard newline, since people use them for paragraph
  # separators.
  if line == ""
    return true
  # Lines starting with whitespace are hard-wrapped.
  if /^\s/.test(line)
    return true
  firstWord = nextLine.split(/\s+/)[0]
  # If the next word wouldn't make it violate the length limit, it's probably
  # hard.
  if (line + " " + firstWord).length < 68
    return true
  return false
