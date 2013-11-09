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
  var Group = BaseModel.extend({
    url: 'groups'
  }, {
    subresources: {
      users:          'collections/users',
      moderators:     'collections/users',
      members:        'collections/users',
      contributors:   'collections/users',
      tracks:         'collections/tracks'
    }
  });

  return Group;
}));