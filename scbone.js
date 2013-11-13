
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

  templates['SCBone/user'] = _.template([
    '',
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    '<div class="block-h">',

      '<a href="<%- prefix %>users/<%- permalink %>" class="picture">',
        '<img src="<%- avatar_url %>" alt="<%- username %>" />',
      '</a>',

      '<div class="info">',
        '<a href="<%- prefix %>users/<%- permalink %>" class="username"><%- username %></a>',
        '<span class="full-name"><%- full_name %></span>',
        
        '<span class="city"><%- city %></span><%= (country && city ? "," : "") %>',
        '<span class="country"><%- country %></span>',
      '</div>',

    '</div>',

    '<ul class="subresources">',

      '<li>',
        '<%= (public_favorites_count ? "<a href=\\""+ prefix +"users/"+ permalink +"/favorites\\">" : "<div>") %>',
          '<i class="icon-heart"></i>',
          '<span><%- (public_favorites_count || "") %></span>',
          'Likes',
        '<%= (public_favorites_count ? "</a>" : "</div>") %>',
      '</li>',
  
      '<li>',
        '<%= (track_count ? "<a href=\\""+ prefix +"users/"+ permalink +"/tracks\\">" : "<div>") %>',
          '<i class="icon-mic"></i>',
          '<span><%- (track_count || 0) %></span>',
          'Tracks',
        '<%= (track_count ? "</a>" : "</div>") %>',
      '</li>',
  
      '<li>',
        '<%= (followings_count ? "<a href=\\""+ prefix +"users/"+ permalink +"/followings\\">" : "<div>") %>',
          '<i class="icon-angle-left"></i>',
          '<span><%- (followings_count || 0) %></span>',
          'Followings',
        '<%= (followings_count ? "</a>" : "</div>") %>',
      '</li>',

      '<li>',
        '<%= (followers_count ? "<a href=\\""+ prefix +"users/"+ permalink +"/followers\\">" : "<div>") %>',
          '<i class="icon-angle-right"></i>',
          '<span><%- (followers_count || 0) %></span>',
          'Followers',
        '<%= (followers_count ? "</a>" : "</div>") %>',
      '</li>',

    '</ul>',

    '<div class="description"><%- description %></div>',
    ''
  ].join('\n'));

  templates['SCBone/app'] = _.template([
    '',
    '<div class="host"></div>',
    '<div class="scope player"></div>',
    // '<div class="scope user"></div>',
    // '<div class="scope group"></div>',
    '<ol class="scope tracks"></ol>',
    '<ol class="scope users"></ol>',
    ''
  ].join('\n'));

  templates['SCBone/player'] = _.template([
    '',
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    // '<section class="details"></section>',
   
    '<div class="progress"></div>',
    
    '<div class="controls"></div>',

    '<div class="logos">',
      '<a class="soundcloud" href="http://soundcloud.com" title="powered by Soundcloud"><img src="images/logo_big_white.png" alt="powered by Soundcloud" /></a>',
    '</div>',
    
    // '<section class="list users"><ul></ul></section>',
    // '<section class="list comments"><ul></ul></section>',
    // '<section class="list groups"><ul></ul></section>',
    '<section class="list tracks"><ol></ol></section>',
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
    'var removeable = (typeof removeable !== "undefined" && removeable);',
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

        
        '<div class="actions"><% if (removeable) { %>',
        '<i class="icon-minus" data-action="remove" data-id="<%- id %>"></i>',
        '<% } else { %>',
        '<i class="icon-plus" data-action="add" data-id="<%- id %>"></i>',
        '<% } %></div>',
        
        '<span class="likes" data-action="like" data-id="<%- id %>"',
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
    module.exports = factory(require('backbone'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('mixins',['backbone'], factory);
  }
}(function(Backbone) {
  
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
    return function(method, instance, options) {
      options       = options || {};
      var success = options.success || noop;
      var error = options.error || noop;
      var isModel = instance instanceof Backbone.Model;
      var idAttribute = isModel ?
                        instance.idAttribute :
                        instance.model.prototype.idAttribute;
      var ids;
      var id = scope +':';
      id = id + (isModel ? (instance.id ? instance.id : '#'+ instance.cid) : 'keys');

      // console.info('localSync', method, id, isModel);

      switch (method) {
        case 'create':
        case 'update':
        case 'patch':
          if (isModel) {
            localStorage.setItem(id, JSON.stringify(instance.toJSON()));
          }
          else {
            ids = instance.pluck(idAttribute).join(',');
            localStorage.setItem(id, ids);

            instance.each(function(model) {
              model.sync('update', model, {});
            });
          }
          break;
        case 'read':
          if (isModel) {
            success(JSON.parse(localStorage.getItem(id)));
          }
          else {
            ids = (localStorage.getItem(id) || '').split(',');
            var models = _.compact(_.map(ids, function(mId) {
              // exclude models who have no ID
              if (mId && mId.substr(0, 1) !== 'c') {
                return JSON.parse(localStorage.getItem(scope +':'+ mId));
              }
            }));

            instance.reset(models, {silent: true});
            // instance.each(function(model) {
            //   model.set({});
            // });
            // success();
          }
          break;
        case 'delete':
          localStorage.removeItem(id);
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
    sync: mixins ? mixins.localSync('local-playlist') : noop,
    model: LocalTrackModel,

    initialize: function() {
      this.on('sort add remove reset', function() {
        this.save({
          silent: true
        });
      });

      this.load();
    },

    save: function(options) {
      this.sync('update', this, options);
      return this;
    },

    load: function(options) {
      this.sync('read', this, options);
      return this;
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
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'), require('./../collection/local-playlist'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('views/tracks',[
      'underscore',
      'backbone',
      './../templates',
      './../collections/local-playlist'
    ], factory);
  }
}(function(_, Backbone, templates, LocalPlaylist) {
  

  // var $ = Backbone.$;
  var SCTracks = Backbone.View.extend({
    tagName: 'ol',
    className: 'tracks-list',
    
    events: {
      'click [data-action="remove"]': 'removeTrack',
      'click [data-action="add"]': 'addTrack'
    },

    initialize: function(options) {
      options = options || {};
      this.playlist = options.playlist || this.collection;
      this.routePrefix = options.routePrefix;
      this.listenTo(this.collection, 'change reset add remove', this.render);
    },

    removeTrack: function(ev) {
      var id = Backbone.$(ev.target).attr('data-id');
      var model = this.playlist.get(id);
      if (!!model) {
        this.playlist.remove(model);
      }
      return false;
    },

    addTrack: function(ev) {
      var id = Backbone.$(ev.target).attr('data-id');
      var model = this.collection.get(id);
      console.info('add track to playlist', id, model, this.playlist !== this.collection);
      if (!!model) {
        this.playlist.add(model.toJSON());
      }
      return false;
    },

    render: function(options) {
      options = options || {};
      var view = this;
      var collection = view.collection;
      var removeable = collection instanceof LocalPlaylist;

      var tracks = collection.map(function(track, t) {
        var data = track.toJSON();
        data.routePrefix = view.routePrefix;
        data.removeable = removeable;
        return templates['SCBone/trackItem'](data);
      });

      view
        .undelegateEvents()
        .$el.html(tracks.join(''));
      view.delegateEvents();

      return view;
    }
  });

  return SCTracks;
}));
(function(factory) {
  
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'), require('./tracks'), require('moment'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('views/player',[
      'underscore',
      'backbone',
      './../templates',
      './tracks',
      'moment'
    ], factory);
  }
}(function(_, Backbone, templates, SCTracks) {
  
  var $ = Backbone.$;

  var SCPlayer = Backbone.View.extend({
    events: {
      'click .progress':        'playPause',
      'click .prev':            'previousTrack',
      'click .next':            'nextTrack',
      'click .tracks .title a': 'playTrack',
      'click .js-remove':       'removeTrack',
      'click .modal .underlay': 'modalClose',
      'click .tracks likes':    'like'
    },

    initialize: function(options) {
      var view = this;
      options = options || {};
      view.routePrefix = options.routePrefix || '';

      view.sound = null;
      view.trackId = null;

      view.listenTo(view.collection, 'current-track', function(collection, index, trackId) {
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

        var localScrollY =  (Math.max(0, index - 1) * 46) +
                            (Math.max(0, index - 1) * 8);
        if ($.fn.scrollTo) {
          view.$('.tracks').scrollTo(localScrollY);
        }
        else {
          view.$('.tracks')[0].scrollTop = localScrollY;
        }
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
        routePrefix: this.routePrefix
      }));

      view.$canvas = $('<canvas />');
      view.$('.progress').append(view.$canvas);
      view.ctx = view.$canvas[0].getContext('2d');

      view.tracks = new SCTracks({
        el: view.$('.tracks ol')[0],
        collection: view.collection,
        routePrefix: view.routePrefix
      });
      view.tracks.render();
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

    removeTrack: function(ev) {
      var id = $('a', ev.target.parentNode).attr('href').split('/').pop();
      id = parseInt(id, 10);
      var track = this.collection.get(id);
      this.collection.remove([track]);
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
      if (!width || !height) {
        return this;
      }
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
        routePrefix: this.routePrefix
      }));
      this.drawProgress();
      
      this.tracks.render();
      return this;
    },

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
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define('views/user',[
      'underscore',
      'backbone',
      './../templates'
    ], factory);
  }
}(function(_, Backbone, templates) {
  

  // var $ = Backbone.$;
  var SCUser = Backbone.View.extend({
    events: {
    },

    initialize: function(options) {
      options = options || {};
      this.routePrefix = options.routePrefix || {};
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
      require('./templates/player'),
      require('./templates/user'),
      require('./templates/tracks')
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