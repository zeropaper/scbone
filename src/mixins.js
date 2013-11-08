(function(factory) {
  'use strict';
  /* global module: true, define: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory();
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([], factory);
  }
}(function() {
  'use strict';
  var noop = function(){};

  function localSync(scope) {
    return function(method, model, options) {
      var success = options.success || noop;
      var error = options.error || noop;
      
      var id = scope +':';
      id = id + (model.id ? model.id : '#'+ model.cid);

      switch (method) {
        case 'create':
        case 'update':
        case 'patch':
          localStorage.setItem(id, JSON.stringify(model.toJSON()));
          break;
        case 'read':
          success(JSON.parse(localStorage.getItem(id)));
          break;
        case 'delete':

          break;
      }
    };
  }


  function fetch(options) {
    options       = options || {};
    /*jshint validthis:true */
    var instance  = this;
    var success   = options.success || noop;
    var error     = options.error || noop;
    var permalink = (instance.get('permalink') || instance.id);
    console.info('permalink for fetching', permalink, instance.toJSON());

    var apiPath   = '/'+ _.result(instance, 'url') +'/'+ permalink;
    if (!options.subresource) {
      SC.get(apiPath, function(data, info) {
        instance.set(data);
        success.call(instance, data, info);
      });
      return;
    }

    apiPath = apiPath +'/'+ options.subresource;

    var subresources = instance.constructor.subresources;
    var subresource = subresources[options.subresource];
    if (!subresource) {
      throw new Error('No subresource found for'+ options.subresource);
    }

    require([subresource], function(Klass) {
      var subinstance = instance[options.subresource];

      if (!subinstance) {
        subinstance = instance[options.subresource] = new Klass();

        instance.listenTo(subinstance, 'change', function() {
          instance.trigger('change:'+ options.subresource, instance, {
            subresource: options.subresource
          });
          instance.trigger('change', instance, {
            subresource: options.subresource
          });
        });
      }

      SC.get(apiPath, function(data, info) {
        var method = _.isUndefined(instance.length) ? 'set' : 'reset';
        subinstance[method](data, {
          silent: true
        });
        subinstance.trigger('change', subinstance, {});

        success.call(instance, data, info);
      });
    }, error);
  }


  // function save(attributes, options) {
  //   options       = options || {};
  //   var instance  = this;
  //   var success   = options.success || noop;
  //   var error     = options.error || noop;

  //   var apiPath = '/'+ _.result(this, 'url') +'/'+ (this.get('username') || this.id);

  // }

  var mixins = {
    fetch: fetch,
    localSync: localSync
  };
  return mixins;
}));
    