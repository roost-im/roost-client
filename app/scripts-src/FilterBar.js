(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.FilterBar = (function(_super) {
      __extends(FilterBar, _super);

      function FilterBar() {
        this._handleInputKey = __bind(this._handleInputKey, this);
        this._setFilters = __bind(this._setFilters, this);
        this._removePane = __bind(this._removePane, this);
        this._removeFilters = __bind(this._removeFilters, this);
        this._toggleFilters = __bind(this._toggleFilters, this);
        this._updateColors = __bind(this._updateColors, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return FilterBar.__super__.constructor.apply(this, arguments);
      }

      FilterBar.prototype.className = 'filter-bar';

      FilterBar.prototype.events = function() {
        var eventsHash;
        eventsHash = {};
        eventsHash["" + com.roost.CLICK_EVENT + " .filters"] = '_toggleFilters';
        eventsHash["" + com.roost.CLICK_EVENT + " .clear-filters"] = '_removeFilters';
        eventsHash["" + com.roost.CLICK_EVENT + " .remove"] = '_removePane';
        eventsHash["" + com.roost.CLICK_EVENT + " .set-filters"] = '_setFilters';
        eventsHash['keydown input'] = '_handleInputKey';
        return eventsHash;
      };

      FilterBar.prototype.initialize = function(options) {
        this.paneModel = options.paneModel;
        this.session = options.session;
        return this.listenTo(this.paneModel, 'change:showFilters change:filters change:selected', this.render);
      };

      FilterBar.prototype.render = function() {
        var fclass, noClass, template;
        this.$el.empty();
        template = com.roost.templates['FilterBar'];
        fclass = this.paneModel.get('filters').class_key_base;
        if ((fclass == null) && this.paneModel.get('filters').instance_key_base) {
          noClass = true;
          fclass = this.paneModel.get('filters').instance_key_base;
        }
        this.$el.append(template(_.defaults({}, this.paneModel.attributes, {
          "class": fclass,
          noClass: noClass
        })));
        if (this.paneModel.get('selected')) {
          this.$el.addClass('selected');
        } else {
          this.$el.removeClass('selected');
        }
        this.$('.class-input').focus();
        if (fclass != null) {
          return this._updateColors(fclass);
        }
      };

      FilterBar.prototype._updateColors = function(string) {
        var color, lighterColor;
        color = shadeColor(stringToColor(string), 0.5);
        lighterColor = shadeColor(color, 0.4);
        if (this.paneModel.get('filters').instance_key_base) {
          this.$('.top-bar').css({
            color: 'black',
            background: lighterColor
          });
          this.$('.msg-class').css({
            background: color
          });
          return this.$('.divider').css("border-left", "5px solid " + color);
        } else {
          return this.$('.top-bar').css({
            color: 'black',
            background: color
          });
        }
      };

      FilterBar.prototype._toggleFilters = function() {
        this.paneModel.set('showFilters', !this.paneModel.get('showFilters'));
        if (this.session.settingsModel.get('onMobile') && this.paneModel.get('showFilters')) {
          return this.session.settingsModel.set('showNavbar', false);
        } else {
          return this.session.settingsModel.set('showNavbar', true);
        }
      };

      FilterBar.prototype._removeFilters = function() {
        return this.paneModel.set({
          filters: {},
          loaded: false,
          showFilters: false
        });
      };

      FilterBar.prototype._removePane = function() {
        return this.session.removePane(this.paneModel.cid);
      };

      FilterBar.prototype._setFilters = function() {
        var filters, opts;
        opts = {
          class_key: this.$('.class-input').val(),
          instance_key: this.$('.instance-input').val(),
          recipient: this.$('.recipient-input').val()
        };
        filters = {};
        if (opts.class_key !== '') {
          filters.class_key_base = opts.class_key;
        }
        if (opts.instance_key !== '') {
          filters.instance_key_base = opts.instance_key;
        }
        if (opts.recipient !== '') {
          filters.recipient = opts.recipient;
        }
        return this.paneModel.set({
          filters: filters,
          loaded: false,
          showFilters: false,
          position: null
        });
      };

      FilterBar.prototype._handleInputKey = function(evt) {
        if (evt.keyCode === 13) {
          return this._setFilters();
        } else if (evt.keyCode === 27) {
          return this._toggleFilters();
        }
      };

      return FilterBar;

    })(Backbone.View);
  })();

}).call(this);
