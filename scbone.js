
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('templates',[
      'underscore'
    ], factory);
  }
  else if(typeof _ !== 'function') {
    window.JST = factory(_);
  }
}(function(_) {
  

  var templates = {};
  templates['SCBone/profile'] = _.template([
    '',
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    '<div class="block-h">',

      '<a href="<%- prefix %>host" class="picture">',
        '<img src="<%- host.avatar_url %>" alt="<%- host.username %>" />',
      '</a>',

      '<div class="info">',
        '<a href="<%- prefix %>host" class="username"><%- host.username %></a>',
        '<span class="full-name"><%- host.full_name %></span>',
        
        '<span class="city"><%- host.city %></span><%= (host.country && host.city ? "," : "") %>',
        '<span class="country"><%- host.country %></span>',
      '</div>',

    '</div>',

    '<ul class="subresources">',

      '<li>',
        '<%= (host.public_favorites_count ? "<a href=\\""+ prefix +"host/favorites\\">" : "<div>") %>',
          '<i class="icon-heart"></i>',
          '<span><%- (host.public_favorites_count || "") %></span>',
          'Likes',
        '<%= (host.public_favorites_count ? "</a>" : "</div>") %>',
      '</li>',
  
      '<li>',
        '<%= (host.track_count ? "<a href=\\""+ prefix +"host/tracks\\">" : "<div>") %>',
          '<i class="icon-mic"></i>',
          '<span><%- (host.track_count || 0) %></span>',
          'Tracks',
        '<%= (host.track_count ? "</a>" : "</div>") %>',
      '</li>',
  
      '<li>',
        '<%= (host.followings_count ? "<a href=\\""+ prefix +"host/followings\\">" : "<div>") %>',
          '<i class="icon-angle-left"></i>',
          '<span><%- (host.followings_count || 0) %></span>',
          'Followings',
        '<%= (host.followings_count ? "</a>" : "</div>") %>',
      '</li>',

      '<li>',
        '<%= (host.followers_count ? "<a href=\\""+ prefix +"host/followers\\">" : "<div>") %>',
          '<i class="icon-angle-right"></i>',
          '<span><%- (host.followers_count || 0) %></span>',
          'Followers',
        '<%= (host.followers_count ? "</a>" : "</div>") %>',
      '</li>',

      // '<li>',
      //   '<a href="<%- prefix %>host/comments">',
      //     '<i class="icon-comment"></i>',
      //     '<span><%- (host.comments_count || 0) %></span>',
      //     'Comments',
      //   '</a>',
      // '</li>',

      // '<li>',
      //   '<a href="<%- prefix %>host/groups">',
      //     '<i class="icon-users"></i>',
      //     '<span><%- (host.groups_count || 0) %></span>',
      //     'Groups',
      //   '</a>',
      // '</li>',

    '</ul>',

    '<div class="description"><%- host.description %></div>',
    ''
  ].join('\n'));

  templates['SCBone/app'] = _.template([
    '',
    '<div class="host-sc-profile host"></div>',
    '<div class="player"></div>',
    ''
  ].join('\n'));

  templates['SCBone/player'] = _.template([
    '',
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    // '<section class="details"></section>',
   
    '<div class="progress"></div>',
    
    '<div class="controls"></div>',

    '<div class="logos">',
      '<a class="soundcloud" href="http://soundcloud.com" title="powered by Soundcloud">powered by Soundcloud</a>',
    '</div>',
    
    // '<section class="list users"><ul></ul></section>',
    // '<section class="list comments"><ul></ul></section>',
    // '<section class="list groups"><ul></ul></section>',
    '<section class="list tracks"><ul></ul></section>',
    ''
  ].join('\n'));

  templates['SCBone/controls'] = _.template([
    '',
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    '<div class="playback">',
      '<button class="prev icon-prev"><i class="icon-angle-double-left"></i></button>',
      '<button class="next icon-next"><i class="icon-angle-double-right"></i></button>',
    '</div>',
    ''
  ].join('\n'));

  templates['SCBone/trackItem'] = _.template([
    '',
    '<%',
    'var prefix = "#"+ (routePrefix ? routePrefix +"/" : "");',
    'var likes = (typeof favoritings_count !== "undefined" ? favoritings_count : 0);',
    'var user_liked = (typeof user_favorite !== "undefined" && user_favorite);',
    '%>',

    '<li<%= (artwork_url ? "" : " class=\\"no-artwork\\"") %>>',
      '<% if(artwork_url) { %>',
      '<img class="artwork" src="<%- artwork_url %>">',
      '<% } %>',

      '<div class="track-info <%- sharing %>">',
        '<div class="title">',
          '<a href="<%- prefix %>tracks/<%- id %>"><%- title %></a>',
        '</div>',
        
        '<span class="duration">',
          '<i class="icon-clock"></i>',
          '<%- moment(duration).format("m:s") %>',
        '</span>',

        
        '<span class="likes"',
        '<%= (user_liked ? " title=\\"You liked it.\\"" : "") %>',
        '>',
          '<i class="icon-heart<%- (user_liked ? "" : "-empty") %>"></i>',
          '<%- likes %>',
        '</span>',

        '<a href="<%- prefix %>users/<%- user.permalink %>" class="username">',
        '<%- user.username %>',
        '</a>',

        '<% if (sharing === "private") { %>',
        '<% } %>',
        // '<span class="user">',
        //   '<span class="full-name"><%- user.full_name %></span>',
        // '</span>',
      '</div>',

    '</li>',
    ''
  ].join('\n'));

  templates['SCBone/userItem'] = _.template([
    '',
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    '<li<%= (artwork_url ? "" : " class=\\"no-artwork\\"") %>>',
      '<% if(artwork_url) { %>',
      '<img class="artwork" src="<%- artwork_url %>">',
      '<% } %>',

      '<div class="track-info">',
        '<div class="title">',
          '<a href="<%- prefix %>tracks/<%- id %>"><%- title %></a>',
        '</div>',
        
        '<span class="duration">',
          '<i class="icon-clock"></i>',
          '<%- moment(duration).format("m:s") %>',
        '</span>',

        '<% if(typeof favoritings_count !== "undefined") { %>',
        '<span class="favorited"><%- favoritings_count %></span>',
        '<% } %>',

        '<a href="<%- prefix %>users/<%- user.permalink %>" class="username">',
        '<%- user.username %>',
        '</a>',
        // '<span class="user">',
        //   '<span class="full-name"><%- user.full_name %></span>',
        // '</span>',
      '</div>',
    '</li>',
    ''
  ].join('\n'));

  templates['SCBone/track'] = _.template([
    '',
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    // '<section>',
      '<header>',
        '<a href="<%- prefix %>tracks/<%- id %>" class="title"><%- title %></a>',
        
        '<span class="duration"><i class="icon-clock"></i><%- moment(duration).format("m:s") %></span>',
        
        '<span class="likes"><i class="icon-heart"></i><%- favoritings_count %></span>',
        
        '<span class="user">',
          '<a href="<%- prefix %>users/<%- user.permalink %>" class="username"><%- user.username %></a>',
          '<span class="full-name"><%- user.full_name %></span>',
        '</span>',
        
        '<% if (typeof label !== "undefined") { %>',
        '<span class="label">',
          '<a href="<%- prefix %>users/<%- label.permalink %>" class="username"><%- label.username %></a>',
          '<span class="full-name"><%- label.full_name %></span>',
        '</span>',
        '<% } %>',

      '</header>',
      '<div class="description"><%= description %></div>',
      '<footer>',
      '</footer>',
    // '</section>',
    ''
  ].join('\n'));

  if (typeof window !== 'undefined' && window.JST) {
    _.defaults(window.JST, templates);
  }

  return templates;
}));
    
(function(factory) {
  
  /* global module: true, define: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory();
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('mixins',[], factory);
  }
}(function() {
  
  var noop = function(){};

  // provides a method to fetch a resource and its potential
  // subresources using the soundcloud javascript sdk.
  function fetch(options) {
    options       = options || {};
    /*jshint validthis:true */
    var instance  = this;
    var success   = options.success || noop;
    var error     = options.error || noop;
    // this allows fetch resources by their `permalink` property
    // especially usefuly for users
    var permalink = (instance.get('permalink') || instance.id);

    var apiPath   = '/'+ _.result(instance, 'url') +'/'+ permalink;
    // fetch the resource when no subresource is specified in the options
    if (!options.subresource) {
      SC.get(apiPath, function(data, info) {
        instance.set(data);
        success.call(instance, data, info);
      });
      return;
    }

    // alterate the URL to match the subresource endpoint
    apiPath = apiPath +'/'+ options.subresource;

    // determine the `require` path of the subresource class
    var subresources = instance.constructor.subresources;
    var subresource = subresources[options.subresource];
    if (!subresource) {
      throw new Error('No subresource found for'+ options.subresource);
    }

    // load the subresource class AMD module
    require([subresource], function(Klass) {
      var subinstance = instance[options.subresource];

      // initialize the subresource instance if needed
      if (!subinstance) {
        subinstance = instance[options.subresource] = new Klass();

        // forward subresource change events to the resource instance
        instance.listenTo(subinstance, 'change', function() {
          instance.trigger('change:'+ options.subresource, instance, {
            subresource: options.subresource
          });
          instance.trigger('change', instance, {
            subresource: options.subresource
          });
        });
      }

      // fetch the data with the SC SDK
      SC.get(apiPath, function(data, info) {
        // if the subresource is a collection, we use `reset`
        var method = _.isUndefined(instance.length) ? 'set' : 'reset';
        subinstance[method](data, {
          silent: true
        });
        subinstance.trigger('change', subinstance, {});

        success.call(instance, data, info);
      });
    }, error);
  }

  // very naive `Backbone.sync` helper to use localStorage
  // ```js
  // var Model = Bacbone.Model.extend({
  //   sync: mixins.localSync('something-meaningful')
  // });
  // ```
  function localSync(scope) {
    return function(method, model, options) {
      var success = options.success || noop;
      var error = options.error || noop;
      
      var id = scope +':';
      id = id + (model.id ? model.id : '#'+ model.cid);

      switch (method) {
        case 'create':
        case 'update':
        case 'patch':
          localStorage.setItem(id, JSON.stringify(model.toJSON()));
          break;
        case 'read':
          success(JSON.parse(localStorage.getItem(id)));
          break;
        case 'delete':

          break;
      }
    };
  }

  // export the callbacks as an object
  var mixins = {
    fetch: fetch,
    localSync: localSync
  };
  return mixins;
}));
    
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../mixins'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('models/base-model',[
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
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('./base-model'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('models/user',[
      './base-model'
    ], factory);
  }
}(function(BaseModel) {
  var User = BaseModel.extend({
    url: 'users'
  }, {
    subresources: {
      comments:   'collections/comments',
      favorites:  'collections/tracks',
      tracks:     'collections/tracks',
      followings: 'collections/users',
      followers:  'collections/users'
    }
  });

  return User;
}));
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../models/user'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('collections/users',[
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
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('./base-model'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('models/track',[
      './base-model'
    ], factory);
  }
}(function(BaseModel) {
  var Track = BaseModel.extend({
    url: 'tracks'
  }, {
    subresources: {
      user:       'models/user',
      favoriters: 'collections/users',
      comments:   'collections/comments'
    }
  });

  return Track;
}));
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../models/track'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('collections/tracks',[
      'underscore',
      'backbone',
      './../models/track'
    ], factory);
  }
}(function(_, Backbone, TrackModel) {
  var Tracks = Backbone.Collection.extend({
    model: TrackModel,

    initialize: function(models, options) {
      options = options || {};
      this.current = false;// = parseInt(options.current || 0, 10);
    },
    
    setCurrent: function(index) {
      index = parseInt(index || 0, 10);
      console.info('setCurrent index', index);
      
      if (this.current === index && index !== false) {
        return this;
      }
      this.current = index;

      var trackId;
      this.each(function(track, i) {
        var trackState = track.get('current');
        if (trackState && i !== index) {
          track.set('current', false);
        }
        else if (!trackState && i === index) {
          track.set('current', true);
        }
        if (i === index) {
          trackId = track.id;
        }
      });

      this.trigger('current-track', this, index, trackId);
      return this;
    },

    setCurrentById: function(id) {
      return this.setCurrent(this.indexById(id));
    },

    indexById: function(id) {
      var index = false;
      this.each(function(m, i) {
        if (index === false && m.id === id) {
          index = i;
        }
      });
      console.info('index for '+ id, index);
      return index;
    },

    getCurrent: function() {
      return this.at(this.current);
    },

    previous: function() {
      if (this.current > 0) {
        return this.setCurrent(this.current - 1);
      }
      return this.setCurrent(this.length - 1);
    },

    next: function() {
      if (this.current >= this.length - 1) {
        return this.setCurrent(0);
      }
      return this.setCurrent(this.current + 1);
    }
  });
  return Tracks;
}));
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./tracks'), require('./../models/track'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('collections/local-playlist',[
      'underscore',
      'backbone',
      './tracks',
      './../models/track',
      './../mixins'
    ], factory);
  }
}(function(_, Backbone, TracksCollection, TrackModel, mixins) {
  var noop = function() {};
  
  var LocalTrackModel = TrackModel.extend({
    initialize: function() {
      this.fetch();
    },
    fetch: Backbone.Model.prototype.fetch,
    sync: mixins ? mixins.localSync('local-playlist') : noop
  });

  var LocalPlaylist = TracksCollection.extend({
    model: LocalTrackModel,
    saveOrder: function() {
      if (mixins) {
        localStorage.setItem('local-playlist-sorting', this.pluck('id').join());
      }
      return this;
    },
    loadOrder: function() {
      if (mixins) {
        localStorage.getItem('local-playlist-sorting').split(',');
      }
      return this;
    },
    initialize: function() {
      // this.on('add remove', this.saveOrder);
      this.on('all', function(evName) {
        console.info('evName on local playlist', evName);
      });

      this.on('sort', function() {
        
      });
    }
  });
  return LocalPlaylist;
}));
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('views/profile',[
      'underscore',
      'backbone',
      './../templates'
    ], factory);
  }
}(function(_, Backbone, templates) {
  

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
      this.router = options.router;
      this.listenTo(this.model, 'change', this.render);
    },

    render: function() {
      var data = {};
      data.host = this.model.toJSON();
      data.routePrefix = this.router.routePrefix;
      this.$el.html(templates['SCBone/profile'](data));
      return this;
    }
  });

  return SCProfile;
}));
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'), require('moment'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('views/player',[
      'underscore',
      'backbone',
      './../templates',
      'moment'
    ], factory);
  }
}(function(_, Backbone, templates) {
  
  var $ = Backbone.$;

  var SCPlayer = Backbone.View.extend({
    events: {
      'click .progress':        'playPause',
      'click .prev':            'previousTrack',
      'click .next':            'nextTrack',
      'click .tracks .title':   'playTrack',
      'click .modal .underlay': 'modalClose',
      'click .tracks likes':    'like'
    },

    initialize: function(options) {
      var view = this;
      view.router = options.router;
      view.sound = null;
      view.trackId = null;

      view.listenTo(view.collection, 'change', view.render);
      view.listenTo(view.collection, 'current-track', function(collection, index, trackId) {
        console.info('current-track event on collection', trackId, index);

        if (view.trackId === trackId) {
          return;
        }

        view.trackId = trackId;
        
        if (trackId) {
          view
            .drawProgress()
            .trigger('current-track', trackId);
        }

        view.$('.tracks li')
          .removeClass('current')
          .eq(index)
          .addClass('current')
        ;

        // var localScrollY =  (Math.max(0, index - 1) * 68) +
        //                     (Math.max(0, index - 1) * 8);
        // view.$('.tracks').scrollTo(localScrollY);
      });

      view.on('current-track', function(trackId) {
        var currentTrack = view.collection.get(trackId);

        view.artwork = false;
        var artworkURL = currentTrack.get('artwork_url');
        if (artworkURL) {
          var artwork = new Image();
          artwork.onload = function() {
            view.artwork = artwork;
            view.drawProgress();
          };
          artwork.src = artworkURL;
        }

        SC.stream('/tracks/'+ trackId, function(sound) {
          if (view.sound) {
            view.sound.destruct();
          }
          view.sound = sound;
          sound.play({
            onfinish: function() {
              view.nextTrack();
            },
            whileplaying: function() {
              if (sound.playState) {
                view.drawProgress((sound.position / currentTrack.get('duration')) * 100);
              }
            }
          });
        });

        view
          // .renderTrack()
          .render();
      });

      view.$el.html(templates['SCBone/player']({
        currentTrack: {},
        routePrefix: this.router.routePrefix
      }));

      view.$canvas = $('<canvas />');
      view.$('.progress').append(view.$canvas);
      view.ctx = view.$canvas[0].getContext('2d');

      view.$tracks = this.$('.tracks ol');

      view.trackTemplate = view.$tracks.html();
      view.$tracks.empty();
    },

    playPause: function(ev) {
      var currentTrack = this.collection.getCurrent();
      var centered;
      if (ev && ev.offsetX && ev.offsetY) {
        var $canvas = this.$('canvas');
        if ($canvas.length) {
          var width = $canvas[0].width;
          var height = $canvas[0].height;
          centered = (
            ev.offsetX >= (width / 2) - 17 &&
            ev.offsetX <= (width / 2) + 17 &&
            ev.offsetY >= (height / 2) - 17 &&
            ev.offsetY <= (height / 2) + 17
          );
        }

      }

      if (this.sound) {
        if (centered) {
          var $progress = this.$('.progress');
          if (!this.sound.paused) {
            this.sound.pause();
            $progress.removeClass('playing');
          }
          else {
            this.sound.play();
            $progress.addClass('playing');
          }
        }
        else {

        }
      }
      else if (currentTrack) {
        this.trigger('current-track', currentTrack.id);
      }

      if (ev) {
        return false;
      }
      return this;
    },

    playTrack: function(ev) {
      if (ev) {
        var id = $(ev.target).attr('href').split('/').pop();
        id = parseInt(id, 10);
        this.setCurrentById(id);
        return false;
      }
    },

    getCurrent: function() {
      return this.collection.getCurrent();
    },

    setCurrent: function(index) {
      return this.collection.setCurrent(index);
    },

    setCurrentById: function(id) {
      return this.setCurrent(this.indexById(id));
    },

    indexById: function(id) {
      return this.collection.indexById(id);
    },
    
    previousTrack: function(ev) {
      this.collection.previous();
      if (ev) {
        return false;
      }
      return this;
    },
    
    nextTrack: function(ev) {
      this.collection.next();
      if (ev) {
        return false;
      }
      return this;
    },

    drawProgress: function(progress) {
      if (this.sound && !this.sound.playState) {
        return this;
      }
      progress = progress || 0;
      var prct = Math.round(progress * 100);
      progress = (360 / 100) * progress;

      var $canvas = this.$('canvas');
      if (!$canvas.length) {
        return this;
      }
      var $progress = this.$('.progress');
      var ctx = $canvas[0].getContext('2d');
      var width = $canvas[0].width = Math.min($progress.width(), 200);
      var height = $canvas[0].height = Math.min($progress.height(), 200);
      var padding = 0;
      var white = 'rgba(255, 255, 255, 0.4)';
      var black = 'rgba(0, 0, 0, 0.8)';

      if (this.artwork) {
        ctx.drawImage(
          this.artwork,
          padding,
          padding,
          width - (padding * 2),
          height - (padding * 2)
        );
      }
      

      function playSymbol() {
        var h = (height / 2);
        var w = (width / 2);

        ctx.fillStyle = black;
        ctx.beginPath();
        ctx.moveTo(w - 6, h - 12);
        ctx.lineTo(w + 8, h);
        ctx.lineTo(w - 6, h + 12);
        ctx.lineTo(w - 6, h - 12);
        ctx.closePath();
        ctx.fill();
      }

      function pauseSymbol() {
        var h = (height / 2);
        var w = (width / 2);

        ctx.fillStyle = black;
        ctx.fillRect(w - 9, h - 9, 6, 18);
        ctx.fillRect(w + 3, h - 9, 6, 18);
      }

      ctx.beginPath();
      ctx.lineWidth = 32;
      ctx.strokeStyle = white;
      ctx.arc(
        width * 0.5,
        height * 0.5,
        (Math.min(width, height) - 64) / 2,
        0,
        (Math.PI / 180) * 360
      );
      ctx.stroke();
      ctx.closePath();

      if (this.sound) {
        ctx.beginPath();
        ctx.lineWidth = 16;
        ctx.strokeStyle = black;
        ctx.arc(
          width * 0.5,
          height * 0.5,
          (Math.min(width, height) - 64) / 2,
          (Math.PI / 180) * (0 - 90),
          (Math.PI / 180) * (progress - 90)
        );
        ctx.stroke();
        ctx.closePath();
      }

      ctx.fillStyle = white;
      ctx.fillRect((width / 2) - 17, (height / 2) -17, 34, 34);
      if (!this.sound || this.sound.paused) {
        $progress.removeClass('playing');
        playSymbol();
      }
      else {
        $progress.addClass('playing');
        pauseSymbol();
      }





      return this;
    },

    render: function(options) {
      options = options || {};
      var model = this.getCurrent();

      this.$('.controls').html(templates['SCBone/controls']({
        currentTrack: model ? model.toJSON() : {},
        routePrefix: this.router.routePrefix
      }));
      this.drawProgress();

      if (options.scope && _.isFunction(this[options.scope +'Render'])) {
        // console.info('options.scope', options.scope);
        this[options.scope +'Render'](options);
      }
      
      return this;
    },

    tracksRender: function(options) {
      options = options || {};
      var view = this;
      
      var collection = options.collection || view.collection;
      var tracks = collection.map(function(track, t) {
        var data = track.toJSON();
        data.routePrefix = view.router.routePrefix;
        return templates['SCBone/trackItem'](data);
      });
      view.$('.tracks ul').html(tracks.join(''));

      return view;
    },

    usersRender: function(options) {
      options = options || {};
      var view = this;

      if (options.collection) {
        var users = options.collection.map(function(user, t) {
          var data = user.toJSON();
          data.routePrefix = view.router.routePrefix;
          return templates['SCBone/userItem'](data);
        });
        view.$('.users ul').html(users.join(''));
      }

      return view;
    },

    //  renderTrack: function() {
    //   var view = this;
    //   var track = view.getCurrent();
    //   var html = '';
    //   var data = {};
    //   if (track) {
    //     data = track.toJSON();
    //     data.routePrefix = view.router.routePrefix;
    //     html = templates['SCBone/track'](data);
    //   }
    //   view.$('.details').html(html);
    //   return view;
    // },

    modal: function(content) {
      this.$modal = this.$('.modal');
      if (!this.$modal.length) {
        this.$modal = $('<div class="modal"><div class="underlay"></div><div class="content"></div></div>');
        this.$el.append(this.$modal);
      }

      this.$modal.find('.content')
        .addClass('open')
        .empty()
        [_.isString(content) ? 'html' : 'append'](content);

      return this;
    },

    modalAsk: function(callback) {
      var $content = $();

      return this.modal($content);
    },

    modalClose: function() {
      this.$modal.removeClass('open');
      return this;
    }
  });

  return SCPlayer;
}));
(function(factory) {
  
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
    define('scbone',[
      'underscore',
      'backbone',
      '//connect.soundcloud.com/sdk.js',
      './templates',
      './collections/users',
      './collections/tracks',
      './collections/local-playlist',
      './views/profile',
      './views/player'
    ], factory);
  }
  // Browser
  else if (typeof _ !== 'undefined' && typeof Backbone !== 'undefined') {
    window.SCBone = factory(_, Backbone);
  }
}(function(_, Backbone, __sc__, templates, SCUsers, SCTracks, LocalPlaylist, SCProfile, SCPlayer) {
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

  var scopes = 'track user comment group followers followings tracks users comments groups';

  var SCBone = Backbone.Router.extend({
    routePrefix: 'step/sounds',

    routes: {
      '':                               'appStart',
      'users/:id(/:subresource)':       'guestAction',
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
    
    guestAction: function(id, subresource) {
      console.info('SC router guest', id, subresource);
      var user = this.guest;
    

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

      router.host.on('change', function(inst, info) {
        info = info || {};
        var scope;
        var name = info.subresource;
        if (
          name === 'favorites' ||
          name === 'tracks'
        ) {
          scope = 'tracks';
          
          router
            .player
              .collection
                .set(router.host[info.subresource].toJSON());
          
          router
            .player
              .render({
                scope: scope
              });
        }
        router.setScope(scope);


        // if (!name) {
        //   scope = false;
        // }
        // else if (
        //   name === 'favorites' ||
        //   name === 'tracks'
        // ) {
        //   scope = 'tracks';  
        // }
        // else if (
        //   name === 'followers' ||
        //   name === 'followings'
        // ) {
        //   scope = 'users';  
        // }
        // else {
        //   scope = name;
        // }

        // if (scope && router.host[name]) {
        //   console.info('SC host model "'+ name +'" ('+ scope +') subresource changed');
        //   if (scope === 'tracks') {
        //     router.player
        //       .collection.set(router.host[info.subresource].toJSON());
        //     router.player.render({
        //       scope: scope
        //     });
        //   }
        //   else {
        //     router.player.render({
        //       scope: scope,
        //       collection: 
        //     });
        //   }
        // }
      });

      router.host.fetch({});

      router.guest = new SCUser({});
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