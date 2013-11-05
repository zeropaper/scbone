(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../models/comment'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../models/comment'
    ], factory);
  }
}(function(_, Backbone, CommentModel) {
  var Comments = Backbone.Collection.extend({
    model: CommentModel,
    initialize: function(models, options) {

    }
  });
  return Comments;
}));