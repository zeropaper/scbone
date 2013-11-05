(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../models/group'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../models/group'
    ], factory);
  }
}(function(_, Backbone, GroupModel) {
  var Groups = Backbone.Collection.extend({
    model: GroupModel
  });
  return Groups;
}));