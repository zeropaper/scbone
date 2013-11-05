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
  var Track = BaseModel.extend({
    url: 'tracks'
  }, {
    subresources: {
      user:       'apps/soundcloud/models/user',
      favoriters: 'apps/soundcloud/collections/users',
      comments:   'apps/soundcloud/collections/comments'
    }
  });

  return Track;
}));