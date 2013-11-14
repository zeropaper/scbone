define([
  'backbone',
  'scbone'
], function(Backbone, SCBone) {
  var app;
  var $ = Backbone.$;
  var el = $('<div></div>')[0];
  
  var clientid = 'db557c505e52fcf89ac1da4a1a3a2642';
  var hostpermalink = 'zeropaper';

  var SCUserModel = require('models/user');
  var SCPlayerView = require('views/player');
  var SCProfileView = require('views/profile');
  var SCtracksView = require('views/tracks');
  
  // $('body').prepend(el);

  describe('the application router', function() {

    it('loads its dependencies', function() {
      expect(function() {
        require('models/user');
        require('views/player');
      }).not.to.throwError();
    });

    it('throws an error when no hostpermalink is passed in the options', function() {
      expect(function() {
        app = new SCBone({
          el: el
        });
      }).to.throwError();
    });

    it('throws an error when no element is passed in the options', function() {
      expect(function() {
        app = new SCBone({
          hostpermalink: 'zeropaper'
        });
      }).to.throwError();
    });

    it('throws an error when no clientid is passed in the options', function() {
      expect(function() {
        app = new SCBone({
          hostpermalink: 'zeropaper',
          el: el
        });
      }).to.throwError();
    });
    
    it('initializes', function() {
      expect(function() {
        app = new SCBone({
          el:             el,
          hostpermalink:  hostpermalink,
          clientid:       clientid
        });
      }).not.to.throwError();
    });

    describe('the host user instance', function() {
      it('is an instance of the User model', function() {
        expect(app.host).to.be.ok();
        expect(app.host).to.be.a(SCUserModel);
      });
    });

    describe('the guest user instance', function() {
      it('is an instance of the User model', function() {
        expect(app.guest).to.be.ok();
        expect(app.guest).to.be.a(SCUserModel);
      });
    });

    describe('the player view instance', function() {
      it('is an instance of the Player view', function() {
        expect(app.player).to.be.a(SCPlayerView);
      });
    });

    describe('the connection mechanisms', function() {
      it('is not connected by default', function() {
        expect(app.scIsConnected()).not.to.be.ok();
      });

      xit('connects', function() {
        expect(function() {
          app.scConnect();
        }).not.to.throwError(function(err) {
          console.info(err.stack || ''+ err);
        });
      });

      xit('loads the connected user profile information', function(done) {

      });
    });

    describe('the application scope', function() {
      // var view;
      // beforeEach(function() {
      //   view = new PlayerView({});
      // });
      it('has a scope method', function() {
        expect(app.scope).to.be.a(Function);

        var scope = app.scope();
        expect(scope).to.be.eql('host-tracks');

        expect(app.$el.hasClass(scope)).to.be.ok();
      });

      it('changes its element classes depending on its scope', function(){
        var newScope = 'random';

        expect(function() {
          app.scope(newScope);
        }).not.to.throwError(function(err) {
          console.info(err.stack)
        });

        expect(app.scope()).to.be.eql(newScope);
        var scope = app.scope();
        expect(scope).to.be.eql(newScope);

        expect(app.$el.hasClass(newScope)).to.be.ok();
      });
    });
  });

});