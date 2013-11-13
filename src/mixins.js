(function(factory) {
  'use strict';
  /* global module: true, define: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('backbone'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define(['backbone'], factory);
  }
}(function(Backbone) {
  'use strict';
  var noop = function(){};

  // provides a method to fetch a resource and its potential
  // subresources using the soundcloud javascript sdk.
  function fetch(options) {
    options       = options || {};
    /*jshint validthis:true */
    var instance  = this;
    var success   = options.success || noop;
    var error     = options.error || noop;
    // this allows fetch resources by their `permalink` property
    // especially usefuly for users
    var permalink = (instance.get('permalink') || instance.id);

    var apiPath   = '/'+ _.result(instance, 'url') +'/'+ permalink;
    // fetch the resource when no subresource is specified in the options
    if (!options.subresource) {
      SC.get(apiPath, function(data, info) {
        instance.set(data);
        success.call(instance, data, info);
      });
      return;
    }

    // alterate the URL to match the subresource endpoint
    apiPath = apiPath +'/'+ options.subresource;

    // determine the `require` path of the subresource class
    var subresources = instance.constructor.subresources;
    var subresource = subresources[options.subresource];
    if (!subresource) {
      throw new Error('No subresource found for'+ options.subresource);
    }

    // load the subresource class AMD module
    require([subresource], function(Klass) {
      var subinstance = instance[options.subresource];

      // initialize the subresource instance if needed
      if (!subinstance) {
        subinstance = instance[options.subresource] = new Klass();

        // forward subresource change events to the resource instance
        instance.listenTo(subinstance, 'change', function() {
          instance.trigger('change:'+ options.subresource, instance, {
            subresource: options.subresource
          });
          instance.trigger('change', instance, {
            subresource: options.subresource
          });
        });
      }

      // fetch the data with the SC SDK
      SC.get(apiPath, function(data, info) {
        // if the subresource is a collection, we use `reset`
        var method = _.isUndefined(instance.length) ? 'set' : 'reset';
        subinstance[method](data, {
          silent: true
        });
        subinstance.trigger('change', subinstance, {});

        success.call(instance, data, info);
      });
    }, error);
  }

  // very naive `Backbone.sync` helper to use localStorage
  // ```js
  // var Model = Bacbone.Model.extend({
  //   sync: mixins.localSync('something-meaningful')
  // });
  // ```
  function localSync(scope) {
    return function(method, instance, options) {
      options       = options || {};
      var success = options.success || noop;
      var error = options.error || noop;
      var isModel = instance instanceof Backbone.Model;
      var idAttribute = isModel ?
                        instance.idAttribute :
                        instance.model.prototype.idAttribute;
      var ids;
      var id = scope +':';
      id = id + (isModel ? (instance.id ? instance.id : '#'+ instance.cid) : 'keys');

      // console.info('localSync', method, id, isModel);

      switch (method) {
        case 'create':
        case 'update':
        case 'patch':
          if (isModel) {
            localStorage.setItem(id, JSON.stringify(instance.toJSON()));
          }
          else {
            ids = instance.pluck(idAttribute).join(',');
            localStorage.setItem(id, ids);

            instance.each(function(model) {
              model.sync('update', model, {});
            });
          }
          break;
        case 'read':
          if (isModel) {
            success(JSON.parse(localStorage.getItem(id)));
          }
          else {
            ids = (localStorage.getItem(id) || '').split(',');
            var models = _.compact(_.map(ids, function(mId) {
              // exclude models who have no ID
              if (mId && mId.substr(0, 1) !== 'c') {
                return JSON.parse(localStorage.getItem(scope +':'+ mId));
              }
            }));

            instance.reset(models, {silent: true});
            // instance.each(function(model) {
            //   model.set({});
            // });
            // success();
          }
          break;
        case 'delete':
          localStorage.removeItem(id);
          break;
      }
    };
  }

  // export the callbacks as an object
  var mixins = {
    fetch: fetch,
    localSync: localSync
  };
  return mixins;
}));
    