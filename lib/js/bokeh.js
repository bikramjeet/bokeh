(function() {
  var Bokeh, BokehView, Collections, Component, DiscreteColorMapper, HasParent, HasProperties, HasReference, LinearMapper, LinearMappers, Mapper, ObjectArrayDataSource, ObjectArrayDataSources, Plot, PlotView, Plots, Range1d, Range1ds, Renderer, ScatterRenderer, ScatterRendererView, ScatterRenderers,
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  if (this.Bokeh) {
    Bokeh = this.Bokeh;
  } else {
    Bokeh = {};
    this.Bokeh = Bokeh;
  }

  Collections = {};

  Bokeh.register_collection = function(key, value) {
    Collections[key] = value;
    return value.bokeh_key = key;
  };

  BokehView = (function(_super) {

    __extends(BokehView, _super);

    function BokehView() {
      BokehView.__super__.constructor.apply(this, arguments);
    }

    BokehView.prototype.initialize = function(options) {
      if (!_.has(options, 'id')) return this.id = _.uniqueId('BokehView');
    };

    BokehView.prototype.tag_id = function(tag, id) {
      if (!id) id = this.id;
      return tag + "-" + id;
    };

    BokehView.prototype.tag_el = function(tag, id) {
      return this.$el.find("#" + this.tag_id(tag, id));
    };

    BokehView.prototype.tag_d3 = function(tag, id) {
      var val;
      val = d3.select(this.el).select("#" + this.tag_id(tag, id));
      if (val[0][0] === null) {
        return null;
      } else {
        return val;
      }
    };

    BokehView.prototype.mget = function(fld) {
      return this.model.get(fld);
    };

    BokehView.prototype.mget_ref = function(fld) {
      return this.model.get_ref(fld);
    };

    return BokehView;

  })(Backbone.View);

  HasProperties = (function(_super) {

    __extends(HasProperties, _super);

    function HasProperties() {
      HasProperties.__super__.constructor.apply(this, arguments);
    }

    HasProperties.prototype.initialize = function(attrs, options) {
      HasProperties.__super__.initialize.call(this, attrs, options);
      this.properties = {};
      this.dependencies = new buckets.MultiDictionary;
      return this.property_cache = {};
    };

    HasProperties.prototype.register_property = function(prop_name, dependencies, property, use_cache) {
      var dep, prop_spec, _i, _len, _results,
        _this = this;
      if (_.has(this.properties, prop_name)) this.remove_property(prop_name);
      prop_spec = {
        'property': property,
        'dependencies': dependencies,
        'use_cache': use_cache,
        'invalidate_cache_callback': function() {
          return _this.clear_cache(prop_name);
        }
      };
      this.properties[prop_name] = prop_spec;
      _results = [];
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        this.dependencies.set(dep, prop_name);
        if (prop_spec.use_cache) {
          _results.push(this.on("change:" + dep, this.properties[prop_name].invalidate_cache_callback));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    HasProperties.prototype.remove_property = function(prop_name) {
      var dep, dependencies, prop_spec, _i, _len;
      prop_spec = this.properties[prop_name];
      dependencies = prop_spec.dependencies;
      for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
        dep = dependencies[_i];
        this.dependencies.remove(dep, prop_name);
        if (prop_spec.use_cache) {
          this.off("change:" + dep, prop_spec['invalidate_cache_callback']);
        }
      }
      delete this.properties[prop_name];
      if (prop_spec.use_cache) return this.clear_cache(prop_name);
    };

    HasProperties.prototype.has_cache = function(prop_name) {
      return _.has(this.property_cache, prop_name);
    };

    HasProperties.prototype.add_cache = function(prop_name, val) {
      return this.property_cache[prop_name] = val;
    };

    HasProperties.prototype.clear_cache = function(prop_name, val) {
      return delete this.property_cache[prop_name];
    };

    HasProperties.prototype.get_cache = function(prop_name) {
      return this.property_cache[prop_name];
    };

    HasProperties.prototype.get = function(prop_name) {
      var computed, dependencies, prop_spec, property, x;
      if (_.has(this.properties, prop_name)) {
        prop_spec = this.properties[prop_name];
        if (prop_spec.use_cache && this.has_cache(prop_name)) {
          return this.property_cache[prop_name];
        } else {
          dependencies = prop_spec.dependencies;
          property = prop_spec.property;
          dependencies = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = dependencies.length; _i < _len; _i++) {
              x = dependencies[_i];
              _results.push(this.get(x));
            }
            return _results;
          }).call(this);
          computed = property.apply(this, dependencies);
          if (this.properties[prop_name].use_cache) {
            this.add_cache(prop_name, computed);
          }
          return computed;
        }
      } else {
        return HasProperties.__super__.get.call(this, prop_name);
      }
    };

    return HasProperties;

  })(Backbone.Model);

  HasReference = (function(_super) {

    __extends(HasReference, _super);

    function HasReference() {
      HasReference.__super__.constructor.apply(this, arguments);
    }

    HasReference.prototype.type = null;

    HasReference.prototype.initialize = function(attrs, options) {
      HasReference.__super__.initialize.call(this, attrs, options);
      if (!_.has(attrs, 'id')) {
        this.id = _.uniqueId(this.type);
        return this.attributes['id'] = this.id;
      }
    };

    HasReference.prototype.ref = function() {
      return {
        'type': this.type,
        'id': this.id
      };
    };

    HasReference.prototype.resolve_ref = function(ref) {
      return Collections[ref['type']].get(ref['id']);
    };

    HasReference.prototype.get_ref = function(ref_name) {
      var ref;
      ref = this.get(ref_name);
      if (ref) return this.resolve_ref(ref);
    };

    return HasReference;

  })(HasProperties);

  HasParent = (function(_super) {

    __extends(HasParent, _super);

    function HasParent() {
      HasParent.__super__.constructor.apply(this, arguments);
    }

    HasParent.prototype.get_fallback = function(attr) {
      if (this.get_ref('parent') && _.indexOf(this.get_ref('parent').parent_properties, attr) >= 0 && !_.isUndefined(this.get_ref('parent').get(attr))) {
        return this.get_ref('parent').get(attr);
      } else {
        return this.display_defaults[attr];
      }
    };

    HasParent.prototype.get = function(attr) {
      if (!_.isUndefined(HasParent.__super__.get.call(this, attr))) {
        return HasParent.__super__.get.call(this, attr);
      } else if (!(attr === 'parent')) {
        return this.get_fallback(attr);
      }
    };

    HasParent.prototype.display_defaults = {};

    return HasParent;

  })(HasReference);

  Component = (function(_super) {

    __extends(Component, _super);

    function Component() {
      Component.__super__.constructor.apply(this, arguments);
    }

    Component.prototype.defaults = {
      parent: null
    };

    Component.prototype.display_defaults = {
      width: 200,
      height: 200,
      position: 0
    };

    Component.prototype.default_view = null;

    return Component;

  })(HasParent);

  Plot = (function(_super) {

    __extends(Plot, _super);

    function Plot() {
      Plot.__super__.constructor.apply(this, arguments);
    }

    Plot.prototype.type = Plot;

    Plot.prototype.initialize = function(attrs, options) {
      var _this = this;
      Plot.__super__.initialize.call(this, attrs, options);
      this.register_property('outerwidth', ['width', 'border_space'], function(width, border_space) {
        return width + 2 * border_space;
      }, false);
      this.register_property('outerheight', ['height', 'border_space'], function(height, border_space) {
        return height + 2 * border_space;
      }, false);
      this.xrange = Collections['Range1d'].create({
        'start': 0,
        'end': this.get('height')
      });
      this.yrange = Collections['Range1d'].create({
        'start': 0,
        'end': this.get('width')
      });
      this.on('change:width', function() {
        return _this.xrange.set('end', _this.get('width'));
      });
      return this.on('change:height', function() {
        return _this.yrange.set('end', _this.get('height'));
      });
    };

    return Plot;

  })(Component);

  _.extend(Plot.prototype.defaults, {
    'data_sources': {},
    'renderers': [],
    'legends': [],
    'tools': [],
    'overlays': [],
    'border_space': 30
  });

  _.extend(Plot.prototype.display_defaults, {
    'background-color': "#fff",
    'foreground-color': "#333"
  });

  PlotView = (function(_super) {

    __extends(PlotView, _super);

    function PlotView() {
      PlotView.__super__.constructor.apply(this, arguments);
    }

    PlotView.prototype.initialize = function(options) {
      PlotView.__super__.initialize.call(this, options);
      this.renderers = {};
      this.get_renderers();
      this.model.on('change:renderers', this.get_renderers, this);
      return this.model.on('change', this.render, this);
    };

    PlotView.prototype.remove = function() {
      return this.model.off(null, null, this);
    };

    PlotView.prototype.get_renderers = function() {
      var key, model, options, spec, value, view, _i, _len, _len2, _ref, _ref2, _renderers;
      _renderers = {};
      _ref = this.model.get('renderers');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        spec = _ref[_i];
        model = Collections[spec.type].get(spec.id);
        if (this.renderers[model.id]) {
          _renderers[model.id] = this.renderers[model.id];
          continue;
        }
        options = _.extend({}, spec.options, {
          'el': this.el,
          'model': model,
          'plot_id': this.id
        });
        view = new model.default_view(options);
        _renderers[model.id] = view;
      }
      _ref2 = this.renderers;
      for (value = 0, _len2 = _ref2.length; value < _len2; value++) {
        key = _ref2[value];
        if (!_.has(renderers, key)) value.remove();
      }
      return this.renderers = _renderers;
    };

    PlotView.prototype.render_mainsvg = function() {
      var node;
      node = this.tag_d3('mainsvg');
      if (node === null) {
        node = d3.select(this.el).append('svg').attr('id', this.tag_id('mainsvg'));
        node.append('g').attr('id', this.tag_id('flipY')).append('g').attr('id', this.tag_id('plotcontent'));
      }
      node.attr('width', this.mget('outerwidth')).attr("height", this.mget('outerheight'));
      this.tag_d3('flipY').attr('transform', _.template('translate(0, {{h}} scale(1, -1)', {
        'h': this.mget('outerheight')
      }));
      return this.tag_d3('plotcontent').attr('transform', _.template('translate({{s}}, {{s}})', {
        's': this.mget('border_space')
      }));
    };

    PlotView.prototype.render_frames = function() {
      var innernode, outernode;
      innernode = this.tag_d3('innerbox');
      outernode = this.tag_d3('outerbox');
      if (innernode === null) {
        innernode = this.tag_d3('plotcontent').append('rect').attr('id', this.tag_id('innerbox'));
        outernode = this.tag_d3('flipY').append('rect').attr('id', this.tag_id('outerbox'));
      }
      outernode.attr('fill', 'none').attr('stroke', this.model.get('foreground-color')).attr('width', this.mget('outerwidth')).attr("height", this.mget('outerheight'));
      return innernode.attr('fill', 'none').attr('stroke', this.model.get('foreground-color')).attr('width', this.mget('width')).attr("height", this.mget('height'));
    };

    PlotView.prototype.render = function() {
      var key, view, _ref;
      this.render_mainsvg();
      this.render_frames();
      _ref = this.renderers;
      for (key in _ref) {
        if (!__hasProp.call(_ref, key)) continue;
        view = _ref[key];
        view.render();
      }
      if (!this.model.get_ref('parent')) return this.$el.dialog();
    };

    return PlotView;

  })(BokehView);

  DiscreteColorMapper = (function(_super) {

    __extends(DiscreteColorMapper, _super);

    function DiscreteColorMapper() {
      DiscreteColorMapper.__super__.constructor.apply(this, arguments);
    }

    DiscreteColorMapper.prototype.defaults = {
      colors: ["#1f77b4", "#aec7e8", "#ff7f0e", "#ffbb78", "#2ca02c", "#98df8a", "#d62728", "#ff9896", "#9467bd", "#c5b0d5", "#8c564b", "#c49c94", "#e377c2", "#f7b6d2", "#7f7f7f", "#c7c7c7", "#bcbd22", "#dbdb8d", "#17becf", "#9edae5"],
      range: []
    };

    DiscreteColorMapper.prototype.initialize = function() {};

    DiscreteColorMapper.prototype.map_screen = function(data) {};

    return DiscreteColorMapper;

  })(HasReference);

  Range1d = (function(_super) {

    __extends(Range1d, _super);

    function Range1d() {
      Range1d.__super__.constructor.apply(this, arguments);
    }

    Range1d.prototype.type = 'Range1d';

    Range1d.prototype.defaults = {
      start: 0,
      end: 1
    };

    return Range1d;

  })(HasReference);

  Mapper = (function(_super) {

    __extends(Mapper, _super);

    function Mapper() {
      Mapper.__super__.constructor.apply(this, arguments);
    }

    Mapper.prototype.defaults = {};

    Mapper.prototype.display_defaults = {};

    Mapper.prototype.map_screen = function(data) {};

    return Mapper;

  })(HasReference);

  LinearMapper = (function(_super) {

    __extends(LinearMapper, _super);

    function LinearMapper() {
      LinearMapper.__super__.constructor.apply(this, arguments);
    }

    LinearMapper.prototype.type = 'LinearMapper';

    LinearMapper.prototype.defaults = {
      data_range: null,
      screen_range: null
    };

    LinearMapper.prototype.calc_scale = function() {
      var domain, range;
      domain = [this.get_ref('data_range').get('start'), this.get_ref('data_range').get('end')];
      range = [this.get_ref('screen_range').get('start'), this.get_ref('screen_range').get('end')];
      console.log([domain, range]);
      return this.scale = d3.scale.linear().domain(domain).range(range);
    };

    LinearMapper.prototype.initialize = function(attrs, options) {
      LinearMapper.__super__.initialize.call(this, attrs, options);
      this.calc_scale();
      this.get_ref('data_range').on('change', this.calc_scale, this);
      return this.get_ref('screen_range').on('change', this.calc_scale, this);
    };

    LinearMapper.prototype.map_screen = function(data) {
      return this.scale(data);
    };

    return LinearMapper;

  })(Mapper);

  Renderer = (function(_super) {

    __extends(Renderer, _super);

    function Renderer() {
      Renderer.__super__.constructor.apply(this, arguments);
    }

    Renderer.prototype.initialize = function(options) {
      this.plot_id = options['plot_id'];
      return Renderer.__super__.initialize.call(this, options);
    };

    return Renderer;

  })(BokehView);

  ScatterRendererView = (function(_super) {

    __extends(ScatterRendererView, _super);

    function ScatterRendererView() {
      ScatterRendererView.__super__.constructor.apply(this, arguments);
    }

    ScatterRendererView.prototype.render = function() {
      var circles, node, plotcontent,
        _this = this;
      plotcontent = this.tag_d3('plotcontent', this.plot_id);
      node = this.tag_d3('scatter');
      if (!node) node = plotcontent.append('g').attr('id', this.tag_id('scatter'));
      circles = node.selectAll(this.model.get('mark')).data(this.model.get_ref('data_source').get('data'), (function(d) {
        return d[_this.model.get('xfield')];
      })).attr('cx', function(d) {
        return _this.model.get_ref('xmapper').map_screen(d[_this.model.get('xfield')]);
      }).attr('cy', function(d) {
        return _this.model.get_ref('ymapper').map_screen(d[_this.model.get('yfield')]);
      }).attr('r', this.model.get('radius')).attr('fill', this.model.get('foreground-color'));
      circles.enter().append(this.model.get('mark')).attr('cx', function(d) {
        return _this.model.get_ref('xmapper').map_screen(d[_this.model.get('xfield')]);
      }).attr('cy', function(d) {
        return _this.model.get_ref('ymapper').map_screen(d[_this.model.get('yfield')]);
      }).attr('r', this.model.get('radius')).attr('fill', this.model.get('foreground-color'));
      return circles.exit().remove();
    };

    return ScatterRendererView;

  })(Renderer);

  ScatterRenderer = (function(_super) {

    __extends(ScatterRenderer, _super);

    function ScatterRenderer() {
      ScatterRenderer.__super__.constructor.apply(this, arguments);
    }

    ScatterRenderer.prototype.type = 'ScatterRenderer';

    ScatterRenderer.prototype.default_view = ScatterRendererView;

    return ScatterRenderer;

  })(Component);

  _.extend(ScatterRenderer.prototype.defaults, {
    data_source: null,
    xmapper: null,
    ymapper: null,
    xfield: '',
    yfield: '',
    mark: 'circle'
  });

  _.extend(ScatterRenderer.prototype.display_defaults, {
    radius: 3
  });

  ObjectArrayDataSource = (function(_super) {

    __extends(ObjectArrayDataSource, _super);

    function ObjectArrayDataSource() {
      ObjectArrayDataSource.__super__.constructor.apply(this, arguments);
    }

    ObjectArrayDataSource.prototype.type = 'ObjectArrayDataSource';

    ObjectArrayDataSource.prototype.defaults = {
      data: [{}]
    };

    ObjectArrayDataSource.prototype.initialize = function(attrs, options) {
      ObjectArrayDataSource.__super__.initialize.call(this, attrs, options);
      return this.ranges = {};
    };

    ObjectArrayDataSource.prototype.compute_range = function(field) {
      var max, min, x;
      max = _.max((function() {
        var _i, _len, _ref, _results;
        _ref = this.get('data');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x[field]);
        }
        return _results;
      }).call(this));
      min = _.min((function() {
        var _i, _len, _ref, _results;
        _ref = this.get('data');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          x = _ref[_i];
          _results.push(x[field]);
        }
        return _results;
      }).call(this));
      return [min, max];
    };

    ObjectArrayDataSource.prototype.get_range = function(field) {
      var max, min, _ref,
        _this = this;
      if (!_.has(this.ranges, field)) {
        _ref = this.compute_range(field), max = _ref[0], min = _ref[1];
        this.ranges[field] = Collections['Range1d'].create({
          'start': min,
          'end': max
        });
        this.on('change:data', function() {
          var _ref2;
          _ref2 = _this.compute_range(field), max = _ref2[0], min = _ref2[1];
          _this.ranges[field].set('start', min);
          return _this.ranges[field].set('end', max);
        });
      }
      return this.ranges[field];
    };

    return ObjectArrayDataSource;

  })(HasReference);

  Plots = (function(_super) {

    __extends(Plots, _super);

    function Plots() {
      Plots.__super__.constructor.apply(this, arguments);
    }

    Plots.prototype.model = Plot;

    Plots.prototype.url = "/";

    return Plots;

  })(Backbone.Collection);

  ScatterRenderers = (function(_super) {

    __extends(ScatterRenderers, _super);

    function ScatterRenderers() {
      ScatterRenderers.__super__.constructor.apply(this, arguments);
    }

    ScatterRenderers.prototype.model = ScatterRenderer;

    return ScatterRenderers;

  })(Backbone.Collection);

  ObjectArrayDataSources = (function(_super) {

    __extends(ObjectArrayDataSources, _super);

    function ObjectArrayDataSources() {
      ObjectArrayDataSources.__super__.constructor.apply(this, arguments);
    }

    ObjectArrayDataSources.prototype.model = ObjectArrayDataSource;

    return ObjectArrayDataSources;

  })(Backbone.Collection);

  Range1ds = (function(_super) {

    __extends(Range1ds, _super);

    function Range1ds() {
      Range1ds.__super__.constructor.apply(this, arguments);
    }

    Range1ds.prototype.model = Range1d;

    return Range1ds;

  })(Backbone.Collection);

  LinearMappers = (function(_super) {

    __extends(LinearMappers, _super);

    function LinearMappers() {
      LinearMappers.__super__.constructor.apply(this, arguments);
    }

    LinearMappers.prototype.model = LinearMapper;

    return LinearMappers;

  })(Backbone.Collection);

  Bokeh.register_collection('Plot', new Plots);

  Bokeh.register_collection('ScatterRenderer', new ScatterRenderers);

  Bokeh.register_collection('ObjectArrayDataSource', new ObjectArrayDataSources);

  Bokeh.register_collection('Range1d', new Range1ds);

  Bokeh.register_collection('LinearMapper', new LinearMappers);

  Bokeh.Collections = Collections;

  Bokeh.HasReference = HasReference;

  Bokeh.HasParent = HasParent;

  Bokeh.ObjectArrayDataSource = ObjectArrayDataSource;

  Bokeh.Plot = Plot;

  Bokeh.Component = Component;

  Bokeh.ScatterRenderer = ScatterRenderer;

  Bokeh.BokehView = BokehView;

  Bokeh.PlotView = PlotView;

  Bokeh.ScatterRendererView = ScatterRendererView;

  Bokeh.HasProperties = HasProperties;

}).call(this);