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
      comments:   'apps/soundcloud/collections/comments',
      favorites:  'apps/soundcloud/collections/tracks',
      tracks:     'apps/soundcloud/collections/tracks',
      followings: 'apps/soundcloud/collections/users',
      followers:  'apps/soundcloud/collections/users'
    }
  });

  return User;
}));