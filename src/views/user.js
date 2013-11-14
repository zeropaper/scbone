(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../templates'
    ], factory);
  }
}(function(_, Backbone, templates) {
  'use strict';

  // var $ = Backbone.$;
  var SCUser = Backbone.View.extend({
    events: {
    },

    initialize: function(options) {
      options = options || {};
      this.routePrefix = options.routePrefix || {};
      this.isConnected = options.isConnected || false;
      // this.router = options.router;
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      var html = '';
      // only render if we have a loaded resource
      if (this.model.id) {
        var data = this.model.toJSON();
        data.routePrefix = this.routePrefix;
        html = templates['SCBone/user'](data);
      }
      this.$el.html(html);
      return this;
    }
  });

  return SCUser;
}));