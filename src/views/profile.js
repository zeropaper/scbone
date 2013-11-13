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
  var SCProfile = Backbone.View.extend({
    events: {
      'click .sc-connect': 'connect'
    },

    connect: function(ev) {
      this.router.scConnect();
      if (ev) {
        return false;
      }
    },

    initialize: function(options) {
      options = options || {};
      this.routePrefix = options.routePrefix || '';
      // this.router = options.router;
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      var data = {};
      data.host = this.model.toJSON();
      data.routePrefix = this.routePrefix;
      this.$el.html(templates['SCBone/profile'](data));
      return this;
    }
  });

  return SCProfile;
}));