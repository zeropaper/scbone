define([
  'backbone',
  'views/player',
  'collections/local-playlist'
], function(Backbone, PlayerView, LocalPlaylist) {
  // var LocalPlaylist = require('collections/local-playlist');
  // var PlayerView = require('views/player');

  var clientid = 'db557c505e52fcf89ac1da4a1a3a2642';
  var hostpermalink = 'zeropaper';
  var routePrefix = '';

  describe('the player view', function() {
    var view;
    // var $ = Backbone.$;
    // var el = $('<div></div>')[0];
    // $('body').prepend(el);

    beforeEach(function() {
      localStorage.clear();
    });

    it('throws an error when no collection is passed in the options', function() {
      expect(function() {
        view = new PlayerView({});
      }).to.throwError(function(err) {
        // console.info('exception', err.stack);
      });
    });
    
    it('initializes when collection option is passed.', function() {
      expect(function() {
        view = new PlayerView({
          collection: new LocalPlaylist()
        });
      }).not.to.throwError(function(err) {
        // console.info('exception', err.stack);
      });

      // is a User model instance
      expect(view.collection).to.be.a(LocalPlaylist);
    });

    // describe('the application scope', function() {
    //   // var view;
    //   // beforeEach(function() {
    //   //   view = new PlayerView({});
    //   // });
    //   it('has a property scope', function() {
    //     expect(view.scope).to.be.a(String);
    //   });
    // });
  });
});