(function() {
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  (function() {
    return com.roost.FilterBar = (function(_super) {
      __extends(FilterBar, _super);

      function FilterBar() {
        this._removePane = __bind(this._removePane, this);
        this._toggleFilters = __bind(this._toggleFilters, this);
        this.render = __bind(this.render, this);
        this.initialize = __bind(this.initialize, this);
        return FilterBar.__super__.constructor.apply(this, arguments);
      }

      FilterBar.prototype.className = 'filter-bar';

      FilterBar.prototype.events = {
        'click .filters': '_toggleFilters',
        'click .remove': '_removePane'
      };

      FilterBar.prototype.initialize = function(options) {
        this.paneModel = options.paneModel;
        this.session = options.session;
        return this.listenTo(this.paneModel, 'change:showFilters', this.render);
      };

      FilterBar.prototype.render = function() {
        var template;
        this.$el.empty();
        template = com.roost.templates['FilterBar'];
        return this.$el.append(template(this.paneModel.attributes));
      };

      FilterBar.prototype._toggleFilters = function() {
        return this.paneModel.set('showFilters', !this.paneModel.get('showFilters'));
      };

      FilterBar.prototype._removePane = function() {
        return this.session.removePane(this.paneModel.cid);
      };

      return FilterBar;

    })(Backbone.View);
  })();

}).call(this);
