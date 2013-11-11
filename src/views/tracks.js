(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../templates'
    ], factory);
  }
}(function(_, Backbone, templates) {
  'use strict';

  // var $ = Backbone.$;
  var SCUser = Backbone.View.extend({
    tagName: 'ul',
    className: 'tracks-list',
    
    events: {
    },

    initialize: function(options) {
      this.router = options.router;
      this.listenTo(this.collection, 'change', this.render);
    },

    render: function(options) {
      options = options || {};
      var view = this;
      
      var collection = options.collection || view.collection;
      var tracks = collection.map(function(track, t) {
        var data = track.toJSON();
        data.routePrefix = view.router.routePrefix;
        return templates['SCBone/trackItem'](data);
      });
      view.$el.html(tracks.join(''));

      return view;
    }
  });

  return SCUser;
}));