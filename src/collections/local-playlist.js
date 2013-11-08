(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./tracks'), require('./../models/track'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './tracks',
      './../models/track',
      './../mixins'
    ], factory);
  }
}(function(_, Backbone, TracksCollection, TrackModel, mixins) {
  var noop = function() {};
  
  var LocalTrackModel = TrackModel.extend({
    initialize: function() {
      this.fetch();
    },
    fetch: Backbone.Model.prototype.fetch,
    sync: mixins ? mixins.localSync('local-playlist') : noop
  });

  var LocalPlaylist = TracksCollection.extend({
    model: LocalTrackModel,
    saveOrder: function() {
      if (mixins) {
        localStorage.setItem('local-playlist-sorting', this.pluck('id').join());
      }
      return this;
    },
    loadOrder: function() {
      if (mixins) {
        localStorage.getItem('local-playlist-sorting').split(',');
      }
      return this;
    },
    initialize: function() {
      // this.on('add remove', this.saveOrder);
      this.on('all', function(evName) {
        console.info('evName on local playlist', evName);
      });

      this.on('sort', function() {
        
      });
    }
  });
  return LocalPlaylist;
}));