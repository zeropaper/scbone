(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../models/track'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../models/track'
    ], factory);
  }
}(function(_, Backbone, TrackModel) {
  var Tracks = Backbone.Collection.extend({
    model: TrackModel,

    initialize: function(models, options) {
      options = options || {};
      this.current = false;// = parseInt(options.current || 0, 10);
    },
    
    setCurrent: function(index) {
      index = parseInt(index || 0, 10);
      
      if (this.current === index && index !== false) {
        return this;
      }
      this.current = index;

      var trackId;
      this.each(function(track, i) {
        var trackState = track.get('current');
        if (trackState && i !== index) {
          track.set('current', false);
        }
        else if (!trackState && i === index) {
          track.set('current', true);
        }
        if (i === index) {
          trackId = track.id;
        }
      });

      this.trigger('current-track', this, index, trackId);
      return this;
    },

    setCurrentById: function(id) {
      return this.setCurrent(this.indexById(id));
    },

    indexById: function(id) {
      var index = false;
      this.each(function(m, i) {
        if (index === false && m.id === id) {
          index = i;
        }
      });
      return index;
    },

    getCurrent: function() {
      return this.at(this.current);
    },

    previous: function() {
      if (this.current > 0) {
        return this.setCurrent(this.current - 1);
      }
      return this.setCurrent(this.length - 1);
    },

    next: function() {
      if (this.current >= this.length - 1) {
        return this.setCurrent(0);
      }
      return this.setCurrent(this.current + 1);
    }
  });
  return Tracks;
}));