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

    it('stores its keys', function() {
      expect(localStorage.length).to.be(0);

      playlist.add([
        {id: 10},
        {id: 20},
        {id: 30}
      ]);


      expect(localStorage.getItem('local-playlist:10')).to.be.ok();

      expect(localStorage.getItem('local-playlist:keys')).to.be('10,20,30');
    });

    it('stores models passed to its reset method', function() {
      expect(localStorage.length).to.be(0);

      playlist.reset([
        {id: 10},
        {id: 20},
        {id: 30}
      ]);

      expect(localStorage.getItem('local-playlist:10')).to.be.ok();
    });

    it('stores its keys when its reset method is called', function() {
      expect(localStorage.length).to.be(0);

      playlist.reset([
        {id: 10},
        {id: 30},
        {id: 20}
      ]);

      expect(localStorage.getItem('local-playlist:keys')).to.be.eql('10,30,20');
    });
  });
});