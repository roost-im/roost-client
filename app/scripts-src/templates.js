this["com"] = this["com"] || {};
this["com"]["roost"] = this["com"]["roost"] || {};
this["com"]["roost"]["templates"] = this["com"]["roost"]["templates"] || {};

this["com"]["roost"]["templates"]["ComposeBar"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var stack1, self=this;

function program1(depth0,data) {
  
  
  return "\n  <div class=\"top-bar\">\n    <div class=\"title\">\n      Compose Message\n    </div>\n    <div class=\"close\">&times;</div>\n  </div>\n  <div class=\"composer\">\n  </div>\n";
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
  var buffer = "", stack1, self=this;

function program1(depth0,data) {
  
  
  return "\n  <div class=\"filter-editor\">\n  </div>\n";
  }

  buffer += "<div class=\"top-bar\">\n  <div class=\"title\">\n    \n    All Messages\n  </div>\n  <div class=\"remove\">&times;</div>\n  <div class=\"filters\">\n    <i class=\"fa fa-filter\"></i>&nbsp;&nbsp;Filters\n  </div>\n</div>\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.showFilters), {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  });

this["com"]["roost"]["templates"]["MessageView"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, helper, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n    <div class=\"msg-instance\">";
  if (helper = helpers.instance) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.instance); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n  ";
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "\n    <div class=\"msg-instance\">*</div>\n  ";
  }

  buffer += "<div class=\"header\">\n  <div class=\"msg-class\">";
  if (helper = helpers['class']) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0['class']); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n  ";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.instance), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n  <span class=\"time from-now\">";
  if (helper = helpers.prettyTime) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.prettyTime); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n  <span class=\"time absolute\">";
  if (helper = helpers.absoluteTime) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.absoluteTime); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</span>\n</div>\n<div class=\"content\">\n  <div class=\"sender\">\n    ";
  if (helper = helpers.sender) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.sender); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n  </div>\n  <div class=\"message-block\">\n    <div class=\"message\">\n      ";
  if (helper = helpers.message) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.message); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n    </div>\n    <div class=\"signature\">\n      ";
  if (helper = helpers.signature) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.signature); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\n    </div>\n  </div>\n</div>";
  return buffer;
  });

this["com"]["roost"]["templates"]["NavBar"] = Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [4,'>= 1.0.0'];
helpers = this.merge(helpers, Handlebars.helpers); data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1, helper;
  buffer += "\n  <div class=\"btn logout\">Logout</div>\n  <div class=\"user-info\">\n    <div class=\"username\">";
  if (helper = helpers.username) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.username); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "</div>\n    <img class=\"gravatar\" src=\"";
  if (helper = helpers.gravatar) { stack1 = helper.call(depth0, {hash:{},data:data}); }
  else { helper = (depth0 && depth0.gravatar); stack1 = typeof helper === functionType ? helper.call(depth0, {hash:{},data:data}) : helper; }
  buffer += escapeExpression(stack1)
    + "\">\n  </div>\n  <div class=\"add-pane\">\n    <i class=\"fa fa-plus\"></i>&nbsp;New Pane\n  </div>\n";
  return buffer;
  }

function program3(depth0,data) {
  
  
  return "\n  <div class=\"btn login\">Login</div>\n";
  }

  buffer += "<div class=\"title-logo\">\n  <img class=\"logo\" src=\"img/roost-logo_57x57.png\">\n  <div class=\"title\"> Roost </div>\n</div>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 && depth0.username), {hash:{},inverse:self.program(3, program3, data),fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  });