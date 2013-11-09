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
  else if(typeof _ !== 'function') {
    window.JST = factory(_);
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
    