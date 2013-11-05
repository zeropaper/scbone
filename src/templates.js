(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore'
    ], factory);
  }
}(function(_) {
  'use strict';

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
      '</div>',

      // '<div class="need-auth">',
      //   '<div class="unauth">',
      //     '<a class="sc-connect">Connect</a> with Soundcloud for more functionnalities.',
      //   '</div>',

      //   '<div class="actions auth">',
      //     '<div class="like"><i class="icon-heart<%- (false ? "" : "-empty") %>"></i></div>',
      //   '</div>',
      // '</div>',

    '</div>',

    '<ul class="subresources">',
    '<% _.each({',

      'favorites:   "Likes",',
      // 'playlists:   "Sets",',
      'tracks:      "Tracks",',
      'followers:   "Followers",',
      'followings:  "Followings",',
      'groups:      "Groups",',
      'comments:    "Comments"',

    '}, function(title, path) { %>',
      '<li><a href="<%- prefix %>host/<%- path %>"><%- title %></a></li>',
    '<% }); %>',
    '</ul>',

    '<div class="description"><%- host.description %></div>',
    ''
  ].join('\n'));

  templates['SCBone/app'] = _.template([
    '',
    '<div class="host-sc-profile"></div>',
    '<div class="player"></div>',
    ''
  ].join('\n'));

  templates['SCBone/player'] = _.template([
    '',
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    // '<section class="details"></section>',
   
    '<div class="progress"><canvas /></div>',
    
    '<div class="controls"></div>',

    '<div class="logos">',
      '<a class="soundcloud" href="http://soundcloud.com" title="powered by Soundcloud">powered by Soundcloud</a>',
    '</div>',
    
    '<section class="tracks"></section>',
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
    '<% var prefix = "#"+ (routePrefix ? routePrefix +"/" : ""); %>',

    '<li<%= (artwork_url ? "" : " class=\\"no-artwork\\"") %>>',
      '<% if(artwork_url) { %>',
      '<img class="artwork" src="<%- artwork_url %>">',
      '<% } %>',

      '<div class="track-info">',
        '<div class="title">',
          '<a href="<%- prefix %>track/<%- id %>"><%- title %></a>',
        '</div>',
        
        '<span class="duration">',
          '<i class="icon-clock"></i>',
          '<%- moment(duration).format("m:s") %>',
        '</span>',

        '<% if(typeof favoritings_count !== "undefined") { %>',
        '<span class="favorited"><%- favoritings_count %></span>',
        '<% } %>',

        '<a href="<%- prefix %>users/<%- user.id %>" class="username">',
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
        '<a href="<%- prefix %>track/<%- id %>" class="title"><%- title %></a>',
        
        '<span class="duration"><i class="icon-clock"></i><%- moment(duration).format("m:s") %></span>',
        
        '<span class="likes"><i class="icon-heart"></i><%- favoritings_count %></span>',
        
        '<span class="user">',
          '<a href="<%- prefix %>users/<%- user.id %>" class="username"><%- user.username %></a>',
          '<span class="full-name"><%- user.full_name %></span>',
        '</span>',
        
        '<% if (typeof label !== "undefined") { %>',
        '<span class="label">',
          '<a href="<%- prefix %>users/<%- label.id %>" class="username"><%- label.username %></a>',
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
    