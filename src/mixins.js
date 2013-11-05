(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone'
    ], factory);
  }
}(function(_, Backbone, scMixins) {




  function fetch(options) {
    options       = options || {};
    var instance  = this;
    var success   = options.success || function() {};
    var error     = options.error || function() {};

    var apiPath = '/'+ _.result(this, 'url') +'/'+ (instance.get('username') || instance.id);
    if (!options.subresource) {
      SC.get(apiPath, function(data, info) {
        instance.set(data);
      });
      return;
    }

    apiPath = apiPath +'/'+ options.subresource;

    var subresources = instance.constructor.subresources;
    var subresource = subresources[options.subresource];
    if (!subresource) {
      throw new Error('No subresource found for'+ options.subresource);
    }

    require([subresource], function(_Class) {
      var subinstance = instance[options.subresource];

      if (!subinstance) {
        subinstance = instance[options.subresource] = new _Class();

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
      });
    }, error);
  }

  var mixins = {
    fetch: fetch
  };
  return mixins;
}));
    