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
      require('./templates/user'),
      require('./templates/tracks')
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
      './views/user',
      './views/tracks'
    ], factory);
  }
  // Browser
  else if (typeof _ !== 'undefined' && typeof Backbone !== 'undefined') {
    window.SCBone = factory(_, Backbone);
  }
}(function(_, Backbone, __sc__, templates, SCUsers, SCTracks, LocalPlaylist, SCProfile, SCPlayer, SCUserView, SCTracksView) {
  var connected;
  var $ = Backbone.$;
  var SCUser = SCUsers.prototype.model;
  var SCTrack = SCTracks.prototype.model;

  function scAccessToken(value) {
    if (value) {
      localStorage.setItem('scbone-access-token', value);
    }
    var val = localStorage.getItem('scbone-access-token');
    return val;
  }

  var _scope = 'host-tracks';
  var _scopes = 'guest-tracks guest-users host-tracks host-users';

  var SCBone = Backbone.Router.extend({
    routePrefix: 'step/sounds',

    routes: {
      '':                               'appStart',
      'users/:id(/:subresource)':       'usersAction',
      'host/:subresource':              'hostAction',
      'tracks/:id':                     'playTrack',
      'connect':                        'scConnect'
    },

    appStart: function() {},

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
      this.host.once('change:'+ subresource, function() {
        var scope = 'host-tracks';
        if (subresource === 'followings' || subresource === 'followers') {
          scope = 'host-users';
          // this.users.collection.reset(this.host[subresource].toJSON());
        }
        else {
          this.tracks.collection.reset(this.host[subresource].toJSON());
        }

        this.scope(scope);
      }, this);

      this.host.fetch({
        subresource: subresource
      });
    },
    
    usersAction: function(id, subresource) {
      var user = this.guest;

      if (subresource) {
        user.once('change:'+ subresource, function() {
          var scope = 'guest-tracks';
          if (subresource === 'followings' || subresource === 'followers') {
            scope = 'guest-users';
            // this.users.collection.reset(user[subresource].toJSON());
          }
          else {
            this.tracks.collection.reset(user[subresource].toJSON());
          }

          this.scope(scope);
        }, this);
      }

      if (user.id !== id) {
        user.attributes = {};
        // user.set('id', id);
        user.attributes[user.idAttribute] = id;
        user.id = id;

        user.fetch({
          success: function() {
            if (subresource) {
              user.fetch({
                subresource: subresource
              });
            }
          }
        });
      }
      else if (subresource) {
        user.fetch({
          subresource: subresource
        });
      }
    },

    scConnect: function() {
      var router = this;
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
      return !!SC.accessToken();
    },

    scope: function(scope) {
      // scope = scope || 'host';
      if (scope && _scope !== scope) {
        _scope = scope;
        this.$el.removeClass(_scopes);
        if (scope) {
          this.$el.addClass(scope);
        }
      }
      return _scope;
    },

    initialize: function(options) {
      var router = this;
      router.el = options.el;
      router.$el = $(router.el);
      router.routePrefix = options.routePrefix || '';

      router.$el.addClass(_scope);

      if (!options.hostpermalink) {
        throw new Error('A `hostpermalink` option must be set.');
      }

      if (!options.el) {
        throw new Error('A `el` (DOM element) option must be set.');
      }

      if (!options.clientid) {
        throw new Error('A `clientid` option must be set.');
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

      SC.initialize({
        client_id:    options.clientid,
        redirect_uri: options.callbackurl
      });

      router.localPlaylist = new LocalPlaylist([], {
      });
      
      router.host = new SCUser({
        permalink: options.hostpermalink
      });
      router.guest = new SCUser({});


      $(router.el).html(templates['SCBone/app'], {
        routePrefix: router.routePrefix
      });
      router.profile = new SCProfile({
        model:      router.host,
        el:         $('.host', options.el)[0],
        router:     router
      });
      router.profile.render();

      router.player = new SCPlayer({
        el:         $('.player', options.el)[0],
        collection: router.localPlaylist,
        router:     router
      });

      router.tracks = new SCTracksView({
        el: $('.scope.tracks')[0],
        collection: new SCTracks(),
        playlist: router.localPlaylist
      });
      // router.users = new SCUserView();


      router.user = new SCUserView({
        el:         $('.user', options.el)[0],
        model:      router.guest,
        router:     router
      });
      router.user.render();

      // this.on('all', function() {
      //   console.info('SC router event', arguments);
      // });
      // this.localPlaylist.on('all', function() {
      //   console.info('SC router.localPlaylist event', arguments);
      // });
      // this.host.on('all', function() {
      //   console.info('SC router.host event', arguments);
      // });
      // this.guest.on('all', function() {
      //   console.info('SC router.guest event', arguments);
      // });


      router.host.fetch({});
      
      if (!router.localPlaylist.load().length) {
        router.host.once('change:favorites', function(host, info) {
          router.localPlaylist.reset(host.favorites.toJSON(), {
            silent: true
          });
          router.localPlaylist.save();
          router.player.render();
        });
        
        router.host.fetch({
          subresource: 'favorites'
        });
      }
      else {
        router.player.render();
      }
    }
  });

  return SCBone;
}));