TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a'

Handlebars.registerHelper('ztext', (text) ->
  # ztextToDOM returns a fragment and we need to get it as a string to avoid
  # Handlebars escaping it for us.
  div = document.createElement('div')
  div.appendChild(com.roost.ztext.ztextToDOM(com.roost.ztext.parseZtext(text)))
  return new Handlebars.SafeString(div.innerHTML))

# A painful function.
Handlebars.registerHelper('filterHeader', (filters) ->
  if filters == {}
    header = 'All Messages'
  else if filters.is_personal
    header = 'Personal Messages'
  else if filters.conversation?
    header = "Chat with #{shortZuser(filters.conversation)}"
    if filters.instance_key_base != 'personal'
      header = header + " [#{filters.instance_key_base}]"
  else
    if filters.class_key_base
      header = "<div class='msg-class'>#{filters.class_key_base}</div>"
      if filters.instance_key_base
        header = header + "<div class='divider'></div><div class='msg-instance'>#{filters.instance_key_base}</div>"
    else if filters.instance_key_base
      header = "<div class='msg-instance'>#{filters.instance_key_base}</div>"
    else
      header = 'All Messages'
  return new Handlebars.SafeString(header)
)

# Proper instance if not personal message
Handlebars.registerHelper('messageConvoHeader', (convo, instance) ->
  header = "Chat with #{shortZuser(convo)}"
  if instance != 'personal'
    header = header + " [#{instance}]"
  return new Handlebars.SafeString(header)
)

Handlebars.registerHelper('shortZuser', (user) ->
  return shortZuser(user)
)

Handlebars.registerHelper('absoluteTime', (time) ->
  return time.format(TIME_FORMAT)
)

Handlebars.registerHelper('gravatar', (user) ->
  name = shortZuser(user)
  realm = zuserRealm(user)
  return getGravatarFromName(name, realm, 80)
)

Handlebars.registerHelper('gravatarNameRealm', (name, realm) ->
  return getGravatarFromName(name, realm, 80)
)

# These helpers may cause problems when we start adding settings,
# unless you pass the settings for colors into them.
Handlebars.registerHelper('classColor', (classKeyBase) ->
  return shadeColor(stringToColor(classKeyBase), 0.5)
)

Handlebars.registerHelper('lightClassColor', (classKeyBase) ->
  return shadeColor(shadeColor(stringToColor(classKeyBase), 0.5), 0.4)
)