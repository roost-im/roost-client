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

      FilterBar.prototype.events = {
        'click .filters': '_toggleFilters',
        'click .clear-filters': '_removeFilters',
        'click .remove': '_removePane',
        'click .set-filters': '_setFilters',
        'keyup input': '_handleInputKey'
      };

      FilterBar.prototype.initialize = function(options) {
        this.paneModel = options.paneModel;
        this.session = options.session;
        return this.listenTo(this.paneModel, 'change:showFilters change:filters', this.render);
      };

      FilterBar.prototype.render = function() {
        var template;
        this.$el.empty();
        template = com.roost.templates['FilterBar'];
        this.$el.append(template(this.paneModel.attributes));
        this.$('.class-input').focus();
        if (this.paneModel.get('filters').class_key != null) {
          return this._updateColors();
        }
      };

      FilterBar.prototype._updateColors = function() {
        var color, lighterColor, string;
        string = this.paneModel.get('filters').class_key;
        color = shadeColor(stringToColor(string), 0.5);
        lighterColor = shadeColor(color, 0.4);
        if (this.paneModel.get('filters').instance_key) {
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
        return this.paneModel.set('showFilters', !this.paneModel.get('showFilters'));
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
          filters.class_key = opts.class_key;
        }
        if (opts.instance_key !== '') {
          filters.instance_key = opts.instance_key;
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
