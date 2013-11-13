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
  var SCTracks = Backbone.View.extend({
    tagName: 'ol',
    className: 'tracks-list',
    
    events: {
      'click [data-action="remove"]': 'removeTrack',
      'click [data-action="add"]': 'addTrack'
    },

    initialize: function(options) {
      options = options || {};
      this.playlist = options.playlist || this.collection;
      this.routePrefix = options.routePrefix;
      this.listenTo(this.collection, 'change reset add remove', this.render);
    },

    removeTrack: function(ev) {
      var id = Backbone.$(ev.target).attr('data-id');
      var model = this.playlist.get(id);
      if (!!model) {
        this.playlist.remove(model);
      }
      return false;
    },

    addTrack: function(ev) {
      var id = Backbone.$(ev.target).attr('data-id');
      var model = this.collection.get(id);
      console.info('add track to playlist', id, model, this.playlist !== this.collection);
      if (!!model) {
        this.playlist.add(model.toJSON());
      }
      return false;
    },

    render: function(options) {
      options = options || {};
      var view = this;
      var collection = view.collection;
      var removeable = collection instanceof LocalPlaylist;

      var tracks = collection.map(function(track, t) {
        var data = track.toJSON();
        data.routePrefix = view.routePrefix;
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

  return SCTracks;
}));