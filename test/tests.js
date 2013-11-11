define('tests', function() {
  require.config({
    paths: {
      mocha: 'testem/mocha'
    },
    shim: {
      mocha: {
        deps: ['expect'],
        exports: 'mocha'
      },

      moment: {
        exports: 'moment'
      },
      underscore: {
        exports: '_'
      },
      jquery: {
        exports: 'jQuery'
      },
      'jquery.scrollto': {
        deps: ['jquery'],
        exports: 'jQuery.fn.scrollTo'
      },
      'backbone': {
        deps: ['jquery', 'underscore'],
        exports: 'Backbone'
      },
      'scbone': {
        deps: ['jquery.scrollto', 'moment', 'backbone']
      }
    }
  });

  require([
    'testem',
    'mocha'
  ], function() {
    mocha.setup('bdd');

    require([
      'spec/router',
      'spec/player',
      'spec/host',
      'spec/user'
    ], function() {

      mocha.run();
    });

  });
});