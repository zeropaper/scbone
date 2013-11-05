(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../mixins'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../mixins'
    ], factory);
  }
}(function(_, Backbone, scMixins) {
  var User = Backbone.Model.extend({
    fetch: scMixins.fetch
  }, {
    subresources: {}
  });

  return User;
}));