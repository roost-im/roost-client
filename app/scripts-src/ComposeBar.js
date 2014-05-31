(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.ComposeBar = (function(_super) {
      __extends(ComposeBar, _super);

      function ComposeBar() {
        this._handleInputsKey = __bind(this._handleInputsKey, this);
        this._updateButton = __bind(this._updateButton, this);
        this._sendMessage = __bind(this._sendMessage, this);
        this._getDefaultFields = __bind(this._getDefaultFields, this);
        this._jumpToBottom = __bind(this._jumpToBottom, this);
        this._hideCompose = __bind(this._hideCompose, this);
        this._showCompose = __bind(this._showCompose, this);
        this._focusProperInitialField = __bind(this._focusProperInitialField, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return ComposeBar.__super__.constructor.apply(this, arguments);
      }

      ComposeBar.prototype.className = 'compose-bar';

      ComposeBar.prototype.events = function() {
        var eventsHash;
        eventsHash = {};
        eventsHash["" + com.roost.CLICK_EVENT + " .compose"] = '_showCompose';
        eventsHash["" + com.roost.CLICK_EVENT + " .close"] = '_hideCompose';
        eventsHash["" + com.roost.CLICK_EVENT + " .to-bottom"] = '_jumpToBottom';
        eventsHash["" + com.roost.CLICK_EVENT + " .send"] = '_sendMessage';
        eventsHash['keydown input'] = '_handleInputsKey';
        eventsHash['keydown textarea'] = '_handleInputsKey';
        return eventsHash;
      };

      ComposeBar.prototype.initialize = function(options) {
        this.paneModel = options.paneModel;
        this.settings = options.settings;
        this.listenTo(this.paneModel, 'change:showCompose change:composeFields change:selected change:filters', this.render);
        return this.listenTo(this.paneModel, 'change:sending', this._updateButton);
      };

      ComposeBar.prototype.render = function() {
        var composeFields, defaultFields, template;
        this.$el.empty();
        defaultFields = this._getDefaultFields();
        composeFields = _.defaults({}, this.paneModel.get('composeFields'), defaultFields);
        template = com.roost.templates['ComposeBar'];
        this.$el.append(template(_.defaults({
          composeFields: composeFields
        }, this.paneModel.attributes, this.settings.attributes)));
        if (this.paneModel.get('selected')) {
          this.$el.addClass('selected');
        } else {
          this.$el.removeClass('selected');
        }
        return this._focusProperInitialField(composeFields);
      };

      ComposeBar.prototype._focusProperInitialField = function(composeFields) {
        var oldVal;
        if (composeFields["class"] !== '' && composeFields.instance !== '' && composeFields.recipient !== '') {
          oldVal = this.$('.content-input').val();
          return this.$('.content-input').focus().val("").val(oldVal);
        } else if (this.paneModel.get('filters').is_personal && composeFields.recipient === '') {
          return this.$('.recipient-input').focus();
        } else if (composeFields["class"] !== '' && composeFields.instance !== '') {
          oldVal = this.$('.content-input').val();
          return this.$('.content-input').focus().val("").val(oldVal);
        } else if (composeFields["class"] !== '' && composeFields.instance === '') {
          return this.$('.instance-input').focus();
        } else {
          return this.$('.class-input').focus();
        }
      };

      ComposeBar.prototype._showCompose = function() {
        this.paneModel.set('showCompose', true);
        if (this.settings.get('onMobile')) {
          return this.settings.set('showNavbar', false);
        }
      };

      ComposeBar.prototype._hideCompose = function() {
        this.paneModel.set({
          showCompose: false,
          composeFields: {}
        });
        return this.settings.set('showNavbar', true);
      };

      ComposeBar.prototype._jumpToBottom = function() {
        this.paneModel.set({
          position: null
        });
        return this.paneModel.trigger('reload');
      };

      ComposeBar.prototype._getDefaultFields = function() {
        var filteredFields, filters;
        filteredFields = {
          "class": '',
          instance: '',
          recipient: '',
          content: ''
        };
        filters = this.paneModel.get('filters');
        if (filters.is_personal) {
          filteredFields["class"] = 'message';
          filteredFields.instance = 'personal';
        } else if (filters.class_key_base) {
          filteredFields["class"] = filters.class_key_base;
          if (filters.instance_key_base != null) {
            filteredFields.instance = filters.instance_key_base;
          }
        }
        return filteredFields;
      };

      ComposeBar.prototype._sendMessage = function() {
        if (!this.paneModel.get('sending')) {
          this.paneModel.set('composeFields', {
            "class": this.$('.class-input').val(),
            instance: this.$('.instance-input').val(),
            recipient: this.$('.recipient-input').val(),
            content: wrapText(this.$('.content-input').val())
          });
          this.paneModel.set('sending', true);
          return this.paneModel.trigger('sendMessage');
        }
      };

      ComposeBar.prototype._updateButton = function() {
        if (this.paneModel.get('sending')) {
          return this.$('.send').addClass('disabled').text('Sending...');
        } else {
          return this.$('.send').removeClass('disabled').text('Send');
        }
      };

      ComposeBar.prototype._handleInputsKey = function(evt) {
        if (evt.keyCode === 27) {
          return this._hideCompose();
        }
      };

      return ComposeBar;

    })(Backbone.View);
  })();

}).call(this);
