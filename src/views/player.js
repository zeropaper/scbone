(function(factory) {
  'use strict';
  /* global define: true, module: true */
  // CommonJS
  if(typeof exports === 'object') {
    module.exports = factory(require('underscore'), require('backbone'), require('./../templates'), require('moment'));
  }
  // AMD
  else if(typeof define === 'function' && define.amd) {
    define([
      'underscore',
      'backbone',
      './../templates',
      'moment'
    ], factory);
  }
}(function(_, Backbone, templates) {
  'use strict';
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