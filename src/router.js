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
      require('./templates/player'),
      require('./templates/user')
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
      './collections/local-playlist',
      './views/profile',
      './views/player',
      './views/user'
    ], factory);
  }
  // Browser
  else if (typeof _ !== 'undefined' && typeof Backbone !== 'undefined') {
    window.SCBone = factory(_, Backbone);
  }
}(function(_, Backbone, __sc__, templates, SCUsers, SCTracks, LocalPlaylist, SCProfile, SCPlayer, SCUserView) {
  var connected;
  var $ = Backbone.$;
  var SCUser = SCUsers.prototype.model;
  var SCTrack = SCTracks.prototype.model;

  function scAccessToken(value) {
    if (value) {
      localStorage.setItem('scbone-access-token', value);
    }
    var val = localStorage.getItem('scbone-access-token');
    console.info('scAccessToken', value, val);
    return val;
  }

  var scopes = 'track user comment group followers followings tracks users comments groups host-tracks host-users';

  var SCBone = Backbone.Router.extend({
    routePrefix: 'step/sounds',

    routes: {
      '':                               'appStart',
      'users/:id(/:subresource)':       'usersAction',
      'host/:subresource':              'hostAction',
      'tracks/:id':                     'playTrack',
      'connect':                        'scConnect'
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
      console.info('SC router host', this.host.get('username'), subresource);
      if (subresource === 'favorites' || subresource === 'tracks') {

      }
      this.host.fetch({
        subresource: subresource
      });
    },
    
    usersAction: function(id, subresource) {
      console.info('SC router guest', id, subresource);
      var user = this.guest;
      this.setScope('user');

      if (user.id !== id) {
        user.attributes = {};
        // user.set('id', id);
        user.attributes[user.idAttribute] = id;
        user.id = id;

        user.fetch({
          success: function() {
            console.info('guest user loaded', user);
            if (subresource) {
              user.fetch({
                subresource: subresource
              });
            }
          }
        });
      }
      else if(subresource) {
        user.fetch({
          subresource: subresource
        });
      }

    },

    scConnect: function() {
      var router = this;
      console.info('connecting to SoundCloud', !!connected);
      if (connected) {
        return;
      }
      connected = true;

      var accessToken = scAccessToken();
      if (accessToken) {
        SC.accessToken(accessToken);
        router.scConnected();
      }
      else {
        SC.connect(function() {
          scAccessToken(SC.accessToken());
          router.scConnected();
        });
      }
    },

    scConnected: function() {
      var router = this;

      SC.get('/me', function(info) {
        console.info('connected', info.username);

        router.guest.set(router.host.toJSON());
        router.host.set(info);

        router.host.once('change:favorites', function() {
          router.player.collection.set(router.host.favorites.toJSON());
          router.player.collection.setCurrent(0);
          router.player.tracksRender();
        });

        router.host.fetch({
          subresource: 'favorites'
        });

        router.player.render();
      });
    },

    scIsConnected: function() {
      return !!scAccessToken();
    },

    setScope: function(scope) {
      this.$el.removeClass(scopes);
      if (scope) {
        this.$el.addClass(scope);
      }
      return this;
    },

    initialize: function(options) {
      var router = this;
      router.el = options.el;
      router.$el = $(router.el);
      router.routePrefix = options.routePrefix || '';

      if (!options.hostpermalink) {
        throw new Error('A `hostpermalink` option must be set.');
      }

      if (!options.el) {
        throw new Error('A `el` (DOM element) option must be set.');
      }

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

      router.localPlaylist = new LocalPlaylist([], {
      });
      
      router.host = new SCUser({
        permalink: options.hostpermalink
      });


      $(router.el).html(templates['SCBone/app'], {
        routePrefix: router.routePrefix
      });
      router.profile = new SCProfile({
        model:      router.host,
        el:         $('.host-sc-profile', options.el)[0],
        router:     router
      });
      router.profile.render();

      router.player = new SCPlayer({
        el:         $('.player', options.el)[0],
        collection: router.localPlaylist,
        router:     router
      });
      router.player.render();

      router.localPlaylist.on('change', function(inst, info) {
        router
          .player
            .render();
      });
      router.localPlaylist.fetch();

      router.host.fetch({});
      // router.host.fetch({subresource: 'favorites'});

      router.guest = new SCUser({});

      router.user = new SCUserView({
        el:         $('.user', options.el)[0],
        model:      router.guest,
        router:     router
      });
      router.user.render();
    }
  },
  {
    Models: {
      User:           SCUser,
      Track:          SCTrack
    },
    Collections: {
      User:           SCUsers,
      Track:          SCTracks,
      LocalPlaylist:  LocalPlaylist
    },
    Views: {
      Profile:        SCProfile
    }
  });

  return SCBone;
}));