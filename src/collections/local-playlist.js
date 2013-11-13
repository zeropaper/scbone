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
    sync: mixins ? mixins.localSync('local-playlist') : noop,
    model: LocalTrackModel,

    initialize: function() {
      this.on('sort add remove reset', function() {
        this.save({
          silent: true
        });
      });

      this.load();
    },

    save: function(options) {
      this.sync('update', this, options);
      return this;
    },

    load: function(options) {
      this.sync('read', this, options);
      return this;
    }
  });
  return LocalPlaylist;
}));