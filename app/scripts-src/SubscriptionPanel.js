(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.SubscriptionPanel = (function(_super) {
      __extends(SubscriptionPanel, _super);

      function SubscriptionPanel() {
        this._handleInputKey = __bind(this._handleInputKey, this);
        this._removeSubscription = __bind(this._removeSubscription, this);
        this._addSubscription = __bind(this._addSubscription, this);
        this._addClassPane = __bind(this._addClassPane, this);
        this._hide = __bind(this._hide, this);
        this._toggleDisplay = __bind(this._toggleDisplay, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return SubscriptionPanel.__super__.constructor.apply(this, arguments);
      }

      SubscriptionPanel.prototype.className = 'subscription-panel';

      SubscriptionPanel.prototype.events = function() {
        var eventsHash;
        eventsHash = {};
        eventsHash["" + com.roost.CLICK_EVENT + " .subscribe"] = '_addSubscription';
        eventsHash["" + com.roost.CLICK_EVENT + " .close-td"] = '_removeSubscription';
        eventsHash["" + com.roost.CLICK_EVENT + " .class-td"] = '_addClassPane';
        eventsHash["" + com.roost.CLICK_EVENT + " .remove"] = '_hide';
        eventsHash['keyup input'] = '_handleInputKey';
        return eventsHash;
      };

      SubscriptionPanel.prototype.initialize = function(options) {
        this.subscriptions = options.subscriptions;
        this.settings = options.settings;
        this.session = options.session;
        this.listenTo(this.subscriptions, 'add remove reset sort', this.render);
        this.listenTo(this.settings, 'change:showSubs', this._toggleDisplay);
        return this.listenTo(this.settings, 'change:showNavbar', this._hide);
      };

      SubscriptionPanel.prototype.render = function() {
        var template;
        this.$el.empty();
        template = com.roost.templates['SubscriptionPanel'];
        this.$el.append(template(this.subscriptions));
        return this._toggleDisplay();
      };

      SubscriptionPanel.prototype._toggleDisplay = function() {
        if (this.settings.get('showSubs')) {
          this.$el.addClass('expanded');
          return this.$('.class-input').focus();
        } else {
          this.$el.removeClass('expanded');
          this.$('.class-input').blur();
          this.$('.class-input').val('');
          this.$('.instance-input').val('*');
          return this.$('.recipient-input').val('');
        }
      };

      SubscriptionPanel.prototype._hide = function() {
        return this.settings.set('showSubs', false);
      };

      SubscriptionPanel.prototype._addClassPane = function(evt) {
        var klass, options;
        klass = $(evt.target).data()["class"];
        options = {
          filters: {
            class_key: klass.toLowerCase()
          }
        };
        return this.session.addPane(options);
      };

      SubscriptionPanel.prototype._addSubscription = function() {
        var opts, sub;
        opts = {
          "class": this.$('.class-input').val(),
          instance: this.$('.instance-input').val(),
          recipient: this.$('.recipient-input').val()
        };
        sub = {};
        if (opts["class"] !== '') {
          sub["class"] = opts["class"];
        }
        if (opts.instance !== '') {
          sub.instance = opts.instance;
        }
        if (opts.recipient !== '') {
          sub.recipient = opts.recipient;
        }
        this.subscriptions.add(sub);
        return console.log(this.subscriptions.models);
      };

      SubscriptionPanel.prototype._removeSubscription = function(evt) {
        return this.subscriptions.remove($(evt.target).data().cid);
      };

      SubscriptionPanel.prototype._handleInputKey = function(evt) {
        if (evt.keyCode === 13) {
          return this._addSubscription();
        } else if (evt.keyCode === 27) {
          return this.settings.set('showSubs', false);
        }
      };

      return SubscriptionPanel;

    })(Backbone.View);
  })();

}).call(this);
