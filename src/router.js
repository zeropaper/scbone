(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(
      require('underscore'),
      require('backbone'),
      null,
      require('./templates'),
      require('./collections/users'),
      require('./collections/tracks'),
      require('./views/profile'),
      require('./templates/player')
    );
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      '//connect.soundcloud.com/sdk.js',
      './templates',
      './collections/users',
      './collections/tracks',
      './views/profile',
      './views/player'
    ], factory);
  }
}(function(_, Backbone, __sc__, templates, SCUsers, SCTracks, SCProfile, SCPlayer) {
  var connected;
  var $ = Backbone.$;
  var SCUser = SCUsers.prototype.model;
  var SCTrack = SCTracks.prototype.model;

  var SCBone = Backbone.Router.extend({
    routePrefix: 'step/sounds',

    routes: {
      '':                               'appStart',
      'user/:username(/:subresource)':  'guestAction',
      'host/:subresource':              'hostAction',
      'track/:id':                      'playTrack'
    },

    appStart: function() {
      // console.info('appStart');
    },

    playTrack: function(id) {
      id = parseInt(id, 10);
      var router = this;
      var collection = this.player.collection;

      if (!collection.get(id)) {
        SC.get('/tracks/'+ id, function(track) {
          collection.add(track);
          router.playTrack(id);
          router.player.playPause();
        });
      }
      else {
        this.player.setCurrentById(id);
      }
    },

    hostAction: function(subresource) {
      // console.info('SC router host', this.host.get('username'), subresource);
      this.host.fetch({subresource: subresource});
    },
    
    guestAction: function(username, subresource) {
      // console.info('SC router guest', username, subresource);
      if (this.guest) {
        this.guest.fetch({subresource: subresource});
      }
    },

    scConnect: function() {
      var router = this;
      // console.info('connecting to SoundCloud', !!connected);
      if (connected) {
        return;
      }
      connected = true;

      SC.connect(function() {
        SC.get('/me', function(info) {
          // console.info('connected', info.username);
          router.guest.set(router.host.toJSON());
          router.host.set(info);

          router.host.once('change:favorites', function() {
            router.player.collection.set(router.host.favorites.toJSON());
            router.player.collection.setCurrent(0);
            router.player.renderTracks();
          });

          router.host.fetch({
            subresource: 'favorites'
          });

          router.player.render();
        });
      });
    },

    initialize: function(options) {
      var router = this;
      router.el = options.el;
      router.routePrefix = options.routePrefix;

      var linksSelector = '[href^="/"]';
      if (options.routePrefix) {
        linksSelector = '[href^="'+ options.routePrefix +'"],'+
                        '[href^="/'+ options.routePrefix +'"],'+
                        '[href^="#'+ options.routePrefix +'"]';
      }

      $(document).delegate(linksSelector, 'click', function() {
        var href = $(this).attr('href');
        var _f = href.substr(0, 1);
        href = _f === '/' || _f === '#' ? href.substr(1) : href;

        router.navigate(href, {
          trigger: true
        });
        return false;
      });

      // this.on('all', function() {
      //   // console.info('SC router event', arguments);
      // });

      SC.initialize({
        client_id:    options.clientid,
        redirect_uri: options.callbackurl,
      });
      
      router.host = new SCUser({
        username: options.hostusername
      });


      $(router.el).html(templates['SCBone/app'], {
        routePrefix: router.routePrefix
      });
      router.profile = new SCProfile({
        model:  router.host,
        el:     $('.host-sc-profile', options.el)[0],
        router: router
      });
      router.profile.render();

      router.player = new SCPlayer({
        el:         $('.player', options.el)[0],
        collection: new SCTracks([], {
          parentresource: router.host
        }),
        router: router
      });
      router.player.render();

      router.host.on('change', function(inst, info) {
        if (info.subresource && router.host[info.subresource]) {
          console.info('SC host model "'+ info.subresource +'" subresource changed');
          if (info.subresource === 'favorites' || info.subresource === 'tracks') {
            console.info('render tracks');
            router.player.collection.set(router.host[info.subresource].toJSON());
            router.player.render().renderTracks();
          }
        }
      });

      router.host.fetch({});

      router.guest = new SCUser({});
    }
  },
  {
    Models: {
      User:     SCUser,
      Track:    SCTrack
    },
    Collections: {
      User:     SCUsers,
      Track:    SCTracks
    },
    Views: {
      // Track:    SCTracks.Views.Track,
      // Tracks:   SCTracks,
      Profile:  SCProfile
    }
  });

  return SCBone;
}));