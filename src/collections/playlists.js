(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../models/playlist'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../models/playlist'
    ], factory);
  }
}(function(_, Backbone, PlaylistModel) {
  var Playlists = Backbone.Collection.extend({
    model: PlaylistModel
  });
  return Playlists;
}));