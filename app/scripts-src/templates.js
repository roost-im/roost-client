this["com"] = this["com"] || {};
this["com"]["roost"] = this["com"]["roost"] || {};
this["com"]["roost"]["templates"] = this["com"]["roost"]["templates"] || {};

this["com"]["roost"]["templates"]["ComposeBar"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <div class=\"top-bar\">\n    <div class=\"title\">\n      Compose Message\n    </div>\n    <div class=\"close\">&times;</div>\n  </div>\n  <div class=\"composer\">\n    <input class=\"class-input\" type=\"text\" placeholder=\"Class\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.composeFields)),stack1 == null || stack1 === false ? stack1 : stack1['class'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n    <input class=\"instance-input\" type=\"text\" placeholder=\"Instance\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.composeFields)),stack1 == null || stack1 === false ? stack1 : stack1.instance)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n    <input class=\"recipient-input\" type=\"text\" placeholder=\"Recipient\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.composeFields)),stack1 == null || stack1 === false ? stack1 : stack1.recipient)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n    <textarea class=\"content-input\" rows=\"6\" placeholder=\"Type your message here\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.composeFields)),stack1 == null || stack1 === false ? stack1 : stack1.content)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</textarea>\n    <button class=\"btn send\">Send</button>\n  </div>\n";
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "\n  <div class=\"single-bar\">\n    <div class=\"compose\">\n      <i class=\"fa fa-send\"></i>&nbsp;&nbsp;Compose Message\n    </div>\n    <div class=\"to-bottom\">\n      <i class=\"fa fa-chevron-down\"></i>&nbsp;&nbsp;Bottom\n    </div>\n  </div>\n";
  }

  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showCompose), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { return stack1; }
  else { return ''; }
  });

this["com"]["roost"]["templates"]["FilterBar"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      Chat with "
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.conversation)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n    ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n      ";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.instance_key), {hash:{},inverse:self.program(6, program6, data),fn:self.program(4, program4, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    ";
  return buffer;
  }
function program4(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        <div class=\"msg-class\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.class_key)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n        <div class=\"divider\"></div>\n        <div class=\"msg-instance\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.instance_key)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</div>\n      ";
  return buffer;
  }

function program6(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n        ";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.class_key), {hash:{},inverse:self.program(9, program9, data),fn:self.program(7, program7, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n      ";
  return buffer;
  }
function program7(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n          "
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.class_key)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\n        ";
  return buffer;
  }

function program9(depth0,data) {
  
  
  return "\n          All Messages\n        ";
  }

function program11(depth0,data) {
  
  
  return "\n      <i class=\"fa fa-filter\"></i>&nbsp;&nbsp;Hide Filters\n    ";
  }

function program13(depth0,data) {
  
  
  return "\n      <i class=\"fa fa-filter\"></i>&nbsp;&nbsp;Show Filters\n    ";
  }

function program15(depth0,data) {
  
  
  return "\n    <div class=\"clear-filters\">\n      <i class=\"fa fa-ban\"></i>&nbsp;&nbsp;Clear\n    </div>\n  ";
  }

function program17(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "\n  <div class=\"filter-editor\">\n    <input class=\"class-input\" type=\"text\" placeholder=\"Class\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.class_key)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n    <input class=\"instance-input\" type=\"text\" placeholder=\"Instance\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.instance_key)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n    <input class=\"recipient-input\" type=\"text\" placeholder=\"Recipient\" value=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.recipient)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></input>\n    <button class=\"btn set-filters\">Set Filters</button>\n  </div>\n";
  return buffer;
  }

  buffer += "<div class=\"top-bar\">\n  <div class=\"title\">\n    \n    ";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.conversation), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n  <div class=\"remove\">&times;</div>\n  <div class=\"filters\">\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showFilters), {hash:{},inverse:self.program(13, program13, data),fn:self.program(11, program11, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </div>\n  ";
  stack1 = helpers['if'].call(depth0, ((stack1 = (depth0 && depth0.filters)),stack1 == null || stack1 === false ? stack1 : stack1.class_key), {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showFilters), {hash:{},inverse:self.noop,fn:self.program(17, program17, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  });

this["com"]["roost"]["templates"]["HotkeyHelp"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  


  return "<div class=\"modal-overlay\"/>\n<div class=\"modal\">\n  <div class=\"header\">\n    <div class=\"title\">\n      Roost Hotkeys\n    </div>\n    <div class=\"close-help\">\n      &times;\n    </div>\n  </div>\n  <table class=\"content\" cellspacing=\"0\">\n    <tr>\n      <th> Hotkey </th>\n      <th> Function </th>\n    </tr>\n    <tr>\n      <td> Alt+h </td>\n      <td> Toggle top bar </td>\n    </tr>\n    <tr>\n      <td> Alt+s </td>\n      <td> Toggle subscription panel </td>\n    </tr>\n    <tr>\n      <td> Alt+n </td>\n      <td> Open new pane </td>\n    </tr>\n    <tr>\n      <td> Alt+p </td>\n      <td> Open PM pane </td>\n    </tr>\n    <tr>\n      <td> Alt+x </td>\n      <td> Close selected pane </td>\n    </tr>\n    <tr>\n      <td> Left/Right </td>\n      <td> Move pane selection </td>\n    </tr>\n    <tr>\n      <td> &gt; </td>\n      <td> Go to bottom </td>\n    </tr>\n    <tr>\n      <td> &lt; </td>\n      <td> Go to top </td>\n    </tr>\n    <tr>\n      <td> Shift+v </td>\n      <td> Clear filters </td>\n    </tr>\n    <tr>\n      <td> Shift+f </td>\n      <td> Show fitlers </td>\n    </tr>\n    <tr>\n      <td> z </td>\n      <td> Show composer </td>\n    </tr>\n    <tr>\n      <td> Up/Down </td>\n      <td> Move message selection </td>\n    </tr>\n    <tr>\n      <td> r </td>\n      <td> Reply to selected message </td>\n    </tr>\n    <tr>\n      <td> q </td>\n      <td> Quote selected message </td>\n    </tr>\n    <tr>\n      <td> p </td>\n      <td> PM selected message sender </td>\n    </tr>\n    <tr>\n      <td> ? </td>\n      <td> Show this box </td>\n    </tr>\n    <tr>\n      <td> Esc </td>\n      <td> Hide this box </td>\n    </tr>\n  </table>\n</div>";
  });

this["com"]["roost"]["templates"]["MessageView"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n    <div class=\"chat-header\">Chat with ";
  if (helper = helpers.convoPartner) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.convoPartner); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n  ";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n    <div class=\"msg-class\">";
  if (helper = helpers['class']) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0['class']); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n    <div class=\"divider\"></div>\n    <div class=\"msg-instance\">";
  if (helper = helpers.instance) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.instance); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n  ";
  return buffer;
  }

function program5(depth0,data) {
  
  
  return "outgoing";
  }

  buffer += "<div class=\"header\">\n  ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isPersonal), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  <span class=\"time from-now\">";
  if (helper = helpers.prettyTime) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.prettyTime); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n  <span class=\"time absolute\">";
  if (helper = helpers.absoluteTime) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.absoluteTime); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n</div>\n<div class=\"content ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.isSentByUser), {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">\n  <div class=\"sender\">\n    <img class=\"gravatar\" src=\"";
  if (helper = helpers.gravatar) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.gravatar); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\"><br>\n    ";
  if (helper = helpers.shortSender) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.shortSender); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n  </div>\n  <div class=\"message-block\">\n    <pre class=\"message\">\n      ";
  if (helper = helpers.message) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.message); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n    </pre>\n    <div class=\"bottom-row\">\n      <div class=\"signature\">\n        ";
  if (helper = helpers.signature) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.signature); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n      </div>\n      <div class=\"controls\">\n        <i class=\"fa fa-quote-right quote\"></i>\n        <i class=\"fa fa-reply reply\"></i>\n        <i class=\"fa fa-envelope pm\"></i>\n      </div>\n    </div>\n  </div>\n</div>";
  return buffer;
  });

this["com"]["roost"]["templates"]["NavBar"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n  <div class=\"btn logout\">Logout</div>\n  <div class=\"user-info\">\n      <span>";
  if (helper = helpers.username) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.username); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span> <img class=\"gravatar\" src=\"";
  if (helper = helpers.gravatar) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.gravatar); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n  </div>\n  <div class=\"add-pane\">\n    <i class=\"fa fa-plus\"></i><span>&nbsp;&nbsp;New Pane</span>\n  </div>\n  <div class=\"personal-message\">\n    <i class=\"fa fa-envelope-o\"></i><span>&nbsp;&nbsp;Personal Messages</span>\n  </div>\n  <div class=\"toggle-keyboard\">\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.keyboard), {hash:{},inverse:self.program(4, program4, data),fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    &nbsp;&nbsp;Keyboard\n  </div>\n  <div class=\"toggle-panes\">\n    ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.panes), {hash:{},inverse:self.program(4, program4, data),fn:self.program(2, program2, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n    &nbsp;&nbsp;Panes\n  </div>\n";
  return buffer;
  }
function program2(depth0,data) {
  
  
  return "\n      <i class=\"fa fa-check-square-o\"></i>\n    ";
  }

function program4(depth0,data) {
  
  
  return "\n      <i class=\"fa fa-square-o\"></i>\n    ";
  }

function program6(depth0,data) {
  
  
  return "\n  <div class=\"btn login\">Login</div>\n";
  }

  buffer += "<div class=\"title-logo\">\n  <img class=\"logo\" src=\"img/roost-logo_57x57.png\">\n  <div class=\"title\"> Roost </div>\n</div>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.username), {hash:{},inverse:self.program(6, program6, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  });

this["com"]["roost"]["templates"]["SubscriptionPanel"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n      <tr>\n        <td class=\"class-td\" data-class=\""
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.attributes)),stack1 == null || stack1 === false ? stack1 : stack1['class'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\">"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.attributes)),stack1 == null || stack1 === false ? stack1 : stack1['class'])),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td>\n        <td>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.attributes)),stack1 == null || stack1 === false ? stack1 : stack1.instance)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td>\n        <td>"
    + escapeExpression(((stack1 = ((stack1 = (depth0 && depth0.attributes)),stack1 == null || stack1 === false ? stack1 : stack1.recipient)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "</td>\n        <td class=\"close-td\" data-cid=\"";
  if (helper = helpers.cid) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.cid); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">&times;</td>\n      </tr>\n    ";
  return buffer;
  }

  buffer += "<div class=\"header\">\n  Manage Subscriptions\n  <div class=\"remove\">&times;</div>\n</div>\n<div class=\"sub-form\">\n  <input class=\"class-input\" type=\"text\" placeholder=\"Class\"></input>\n  <input class=\"instance-input\" type=\"text\" placeholder=\"Instance\" value=\"*\"></input>\n  <input class=\"recipient-input\" type=\"text\" placeholder=\"Recipient\"></input>\n  <br>\n  <button class=\"btn subscribe\">Subscribe</button>\n</div>\n<div class=\"subs-label\">\n  Current Subscriptions\n</div>\n<div class=\"table-container\">\n  <table cellspacing=\"0\" class=\"subs-table\">\n    ";
  stack1 = helpers.each.call(depth0, (depth0 && depth0.models), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  </table>\n</div>";
  return buffer;
  });