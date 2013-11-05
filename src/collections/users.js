(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../models/user'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../models/user'
    ], factory);
  }
}(function(_, Backbone, UserModel) {
  var Users = Backbone.Collection.extend({
    model: UserModel
  });
  return Users;
}));