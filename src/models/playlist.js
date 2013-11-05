(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('./base-model'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      './base-model'
    ], factory);
  }
}(function(BaseModel) {
  var Playlist = BaseModel.extend({
    url: 'playlists'
  }, {
    subresources: {
    }
  });

  return Playlist;
}));