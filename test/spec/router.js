define([
  'backbone',
  'scbone'
], function(Backbone, SCBone) {
  describe('The app (router)', function() {
    var app;
    var el = Backbone.$('<div></div>')[0];

    it('throws an error when no hostpermalink is passed in the options', function() {
      expect(function() {
        try {
          app = new SCBone({
            el: el
          });
        }
        catch (err) {
          console.info(err.stack);
          throw err;
        }
      }).to.throwError();
    });

    it('throws an error when no element is passed in the options', function() {
      expect(function() {
        try {
          app = new SCBone({
            hostpermalink: 'zeropaper'
          });
        }
        catch (err) {
          console.info(err.stack);
          throw err;
        }
      }).to.throwError();
    });
    
    it('initializes', function() {
      expect(function() {
        app = new SCBone({
          el: el,
          hostpermalink: 'zeropaper'
        });
      }).not.to.throwError();
    });

  });
});