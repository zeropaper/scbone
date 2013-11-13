define([
  'backbone',
  'collections/local-playlist'
], function(Backbone, LocalPlaylist) {
  describe('the local playlist', function() {
    var playlist;

    beforeEach(function() {
      localStorage.clear();
    });
    
    it('initializes', function() {
      expect(function() {
        playlist = new LocalPlaylist();
      }).not.to.throwError(function(err) {
        // console.info('exception', err.stack);
      });
    });
  });
});