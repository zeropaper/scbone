define([], function() {
  var paths = [
    'scbone',
    
    'scbone-dependencies',
    'jquery',
    'jquery.scrollto',
    'moment',
    'backbone',
    'underscore',
    'router',
    'mixins',
    'templates',

    'models/base-model',
    'models/comment',
    'models/group',
    'models/playlist',
    'models/track',
    'models/user',
    
    'collections/comments',
    'collections/groups',
    'collections/local-playlist',
    'collections/playlists',
    'collections/tracks',
    'collections/users',
    
    'views/player',
    'views/profile',
    'views/tracks',
    'views/user'
  ];

  function eachPaths(cb) {
    for (var p in paths) {
      cb(paths[p]);
    }
  }

  function deleteAll(){
    eachPaths(requirejs.undef);
    delete  window.Backbone,
            window._,
            window.jQuery,
            window.$,
            window.moment,
            window.SCBone;
  }

  function testDeletetion() {
    it('has no defined scripts', function() {
      expect(function() {
        require('router');
      }).to.throwError();

      expect(function() {
        require('backbone');
      }).to.throwError();
    });
  }

  describe('the require.js environement', function() {
    beforeEach(deleteAll);

    testDeletetion();

    describe('the uncompiled version', function() {
      testDeletetion();

      it('loads src/router.js', function(done) {
        expect(function() {
          require('backbone');
        }).to.throwError();

        expect(window.Backbone).not.to.be.ok();

        require(['router'], function(SCBone) {
          expect(function() {
            require('backbone');
            require('underscore');
            require('jquery');
          }).not.to.throwError(function(err) {
            console.info(err.stack);
          });


          done();
        }, function(err) {
          expect(function() {
            throw err;
          }).not.to.throwError();
          done();
        });
      });
    });

    describe('the AMD compiled version', function() {
      testDeletetion();

      it('loads scbone.js', function(done) {
        expect(function() {
          require('backbone');
        }).to.throwError();

        expect(window.Backbone).not.to.be.ok();

        require(['scbone'], function(SCBone) {
          expect(function() {
            require('backbone');
            require('underscore');
            require('jquery');
          }).not.to.throwError(function(err) {
            console.info(err.stack);
          });


          done();
        }, function(err) {
          expect(function() {
            throw err;
          }).not.to.throwError();
          done();
        });
      });
    });
  });
});