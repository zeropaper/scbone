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
  var User = BaseModel.extend({
    url: 'users'
  }, {
    subresources: {
      comments:   'collections/comments',
      favorites:  'collections/tracks',
      tracks:     'collections/tracks',
      followings: 'collections/users',
      followers:  'collections/users'
    }
  });

  return User;
}));