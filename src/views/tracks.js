(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'), require('./../collection/local-playlist'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../templates',
      './../collections/local-playlist'
    ], factory);
  }
}(function(_, Backbone, templates, LocalPlaylist) {
  'use strict';

  // var $ = Backbone.$;
  var SCUser = Backbone.View.extend({
    tagName: 'ol',
    className: 'tracks-list',
    
    events: {

    },

    initialize: function(options) {
      this.router = options.router;
      this.listenTo(this.collection, 'change reset add remove', this.render);
    },

    render: function(options) {
      options = options || {};
      var view = this;
      var removeable = this.collection instanceof LocalPlaylist;
      // console.info('models are removeable', removeable);
      var collection = options.collection || view.collection;
      var tracks = collection.map(function(track, t) {
        var data = track.toJSON();
        data.routePrefix = view.router.routePrefix;
        data.removeable = removeable;
        return templates['SCBone/trackItem'](data);
      });

      view
        .undelegateEvents()
        .$el.html(tracks.join(''));
      view.delegateEvents();

      return view;
    }
  });

  return SCUser;
}));