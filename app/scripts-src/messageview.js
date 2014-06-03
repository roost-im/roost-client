(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    var QUOTE_LINE_PREFIX;
    QUOTE_LINE_PREFIX = '> ';
    return com.roost.MessageView = (function(_super) {
      __extends(MessageView, _super);

      function MessageView() {
        this._filterConversation = __bind(this._filterConversation, this);
        this._filterInstance = __bind(this._filterInstance, this);
        this._filterClass = __bind(this._filterClass, this);
        this._applyFilter = __bind(this._applyFilter, this);
        this.openQuoteBox = __bind(this.openQuoteBox, this);
        this.openMessageBox = __bind(this.openMessageBox, this);
        this.openReplyBox = __bind(this.openReplyBox, this);
        this.remove = __bind(this.remove, this);
        this.updateTime = __bind(this.updateTime, this);
        this.updatePosition = __bind(this.updatePosition, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return MessageView.__super__.constructor.apply(this, arguments);
      }

      MessageView.prototype.className = 'message-view';

      MessageView.prototype.events = function() {
        var eventsHash;
        eventsHash = {};
        eventsHash["" + com.roost.CLICK_EVENT + " .reply"] = 'openReplyBox';
        eventsHash["" + com.roost.CLICK_EVENT + " .pm"] = 'openMessageBox';
        eventsHash["" + com.roost.CLICK_EVENT + " .quote"] = 'openQuoteBox';
        eventsHash["" + com.roost.CLICK_EVENT + " .msg-class"] = '_filterClass';
        eventsHash["" + com.roost.CLICK_EVENT + " .msg-instance"] = '_filterInstance';
        eventsHash["" + com.roost.CLICK_EVENT + " .chat-header"] = '_filterConversation';
        return eventsHash;
      };

      MessageView.prototype.initialize = function(options) {
        this.message = options.message;
        this.paneModel = options.paneModel;
        return this.session = options.session;
      };

      MessageView.prototype.render = function() {
        var isSentByUser, signature, template;
        this.$el.empty();
        template = com.roost.templates['MessageView'];
        isSentByUser = this.message.get('sender') === this.session.userInfo.get('username') + '@' + this.session.userInfo.get('realm');
        isSentByUser = this.message.get('isOutgoing') || isSentByUser;
        signature = this.message.get('signature');
        if (/^[^(]*\).*\([^)]*$/.test(signature)) {
          signature = "(" + signature + ")";
        }
        this.$el.append(template(_.defaults({
          signature: signature
        }, this.message.attributes, {
          isSentByUser: isSentByUser
        })));
        this.$('.message').linkify();
        this.$('a').attr({
          target: '_blank',
          tabindex: -1
        });
        this.updatePosition();
        return this.updateTime();
      };

      MessageView.prototype.updatePosition = function() {
        if (this.paneModel.get('position') === this.message.get('id')) {
          return this.$el.addClass('positioned');
        } else {
          return this.$el.removeClass('positioned');
        }
      };

      MessageView.prototype.updateTime = function() {
        return this.$('.time.from-now').text(this.message.get('time').fromNow());
      };

      MessageView.prototype.remove = function() {
        this.undelegateEvents();
        this.stopListening();
        this.$el.removeData().unbind();
        MessageView.__super__.remove.apply(this, arguments);
        delete this.$el;
        return delete this.el;
      };

      MessageView.prototype.openReplyBox = function() {
        var recip;
        recip = this.message.get('isPersonal') ? this.message.get('conversation') : '';
        this.paneModel.set({
          composeFields: {
            "class": this.message.get('class'),
            instance: this.message.get('instance'),
            recipient: recip,
            content: ''
          },
          showCompose: true
        });
        if (com.roost.ON_MOBILE) {
          return this.session.settingsModel.set('showNavbar', false);
        }
      };

      MessageView.prototype.openMessageBox = function() {
        var recip;
        recip = this.message.get('isPersonal') ? this.message.get('conversation') : this.message.get('sender');
        this.paneModel.set({
          composeFields: {
            "class": 'message',
            instance: 'personal',
            recipient: recip,
            content: ''
          },
          showCompose: true
        });
        if (com.roost.ON_MOBILE) {
          return this.session.settingsModel.set('showNavbar', false);
        }
      };

      MessageView.prototype.openQuoteBox = function() {
        var quoted;
        quoted = QUOTE_LINE_PREFIX + this.message.get('message').replace(/\n/g, "\n" + QUOTE_LINE_PREFIX) + '\n\n';
        this.paneModel.set({
          composeFields: {
            "class": this.message.get('class'),
            instance: this.message.get('instance'),
            recipient: '',
            content: quoted
          },
          showCompose: true
        });
        if (com.roost.ON_MOBILE) {
          return this.session.settingsModel.set('showNavbar', false);
        }
      };

      MessageView.prototype._applyFilter = function(evt, options) {
        if (evt.altKey && !this.session.settingsModel.get('limitReached')) {
          this.session.addPane(options);
          evt.preventDefault();
          return evt.stopPropagation();
        } else {
          return this.paneModel.set(options);
        }
      };

      MessageView.prototype._filterClass = function(evt) {
        var options;
        options = {
          filters: {
            class_key_base: this.message.get('classKeyBase')
          },
          position: this.message.get('id'),
          posScroll: this.$el.offset().top
        };
        return this._applyFilter(evt, options);
      };

      MessageView.prototype._filterInstance = function(evt) {
        var options;
        options = {
          filters: {
            class_key_base: this.message.get('classKeyBase'),
            instance_key_base: this.message.get('instanceKeyBase')
          },
          position: this.message.get('id'),
          posScroll: this.$el.offset().top
        };
        return this._applyFilter(evt, options);
      };

      MessageView.prototype._filterConversation = function(evt) {
        var options;
        options = {
          filters: {
            class_key_base: this.message.get('classKeyBase'),
            instance_key_base: this.message.get('instanceKeyBase'),
            conversation: this.message.get('conversation')
          },
          position: this.message.get('id'),
          posScroll: this.$el.offset().top
        };
        return this._applyFilter(evt, options);
      };

      return MessageView;

    })(Backbone.View);
  })();

}).call(this);
