do ->
  TIME_FORMAT = 'MMMM Do YYYY, h:mm:ss a'

  darkerColor = (string) ->
    return shadeColor(stringToColor(string), 0.5)

  lighterColor = (string) ->
    return shadeColor(darkerColor(string), 0.4)

  messageFilterFancy = (string) ->
    color = darkerColor(string)
    div1 = $('<div class="fancy up">').css('border-left-color', color)
    div2 = $('<div class="fancy down">').css('border-left-color', color)
    return div1[0].outerHTML + div2[0].outerHTML

  Handlebars.registerHelper('ztext', (text) ->
    # ztextToDOM returns a fragment and we need to get it as a string to avoid
    # Handlebars escaping it for us.
    div = document.createElement('div')
    div.appendChild(com.roost.ztext.ztextToDOM(com.roost.ztext.parseZtext(text)))
    return new Handlebars.SafeString(div.innerHTML))

  Handlebars.registerHelper('filterHeader', (filters) ->
    if _.isEmpty(filters)
      header = 'All Messages'
    else if filters.is_personal
      header = messageFilterFancy('message') + 'Personal Messages'
    else if filters.conversation?
      header = messageFilterFancy(shortZuser(filters.conversation)) + "Chat with #{shortZuser(filters.conversation)}"
      if filters.instance_key_base != 'personal'
        header = header + " [#{filters.instance_key_base}]"
    else
      if filters.class_key_base
        header = $("<div class='msg-class'>#{filters.class_key_base}</div>").css(
                    background: darkerColor(filters.class_key_base)
                  )[0].outerHTML
        if filters.instance_key_base
          header = header + $("<div class='divider'></div>").css('border-left-color', darkerColor(filters.class_key_base))[0].outerHTML
          header = header + $("<div class='msg-instance'>#{filters.instance_key_base}</div>").css(
                    background: lighterColor(filters.class_key_base)
                  )[0].outerHTML
      else if filters.instance_key_base
        header = $("<div class='msg-instance'>#{filters.instance_key_base}</div>").css(
                    background: darkerColor(filters.instance_key_base)
                  )[0].outerHTML
      else
        header = 'All Messages'
    return new Handlebars.SafeString(header)
  )

  Handlebars.registerHelper('filterBarColor', (filters) ->
    # TODO: make this smarter with respect to what background the top bar gets
    if _.isEmpty(filters)
      return 'white'
    else
      return 'black'
  )

  Handlebars.registerHelper('filterBarBackgroundColor', (filters) ->
    if _.isEmpty(filters)
      return 'none'
    
    if filters.class_key_base?
      key = filters.class_key_base
      if filters.instance_key_base?
        return lighterColor(key)
      else
        return darkerColor(key)
    else if filters.instance_key_base?
      return darkerColor(filters.instance_key_base)
    else if filters.is_personal
      return lighterColor('message')
  )

  Handlebars.registerHelper('messageConvoHeader', (convo, instance) ->
    header = messageFilterFancy(shortZuser(convo)) + "Chat with #{shortZuser(convo)}"
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
    return darkerColor(classKeyBase)
  )

  Handlebars.registerHelper('lightClassColor', (classKeyBase) ->
    return lighterColor(classKeyBase)
  )

  # Helpful when checking filters
  Handlebars.registerHelper('ifNotEmpty', (arg, options) ->
    if !_.isEmpty(arg)
      return options.fn(this)

    return options.inverse(this)
  )