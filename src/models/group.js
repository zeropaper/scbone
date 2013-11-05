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
      users:          'apps/soundcloud/collections/users',
      moderators:     'apps/soundcloud/collections/users',
      members:        'apps/soundcloud/collections/users',
      contributors:   'apps/soundcloud/collections/users',
      tracks:         'apps/soundcloud/collections/tracks'
    }
  });

  return Group;
}));