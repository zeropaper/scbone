/**
 * for information about the karma - mocha - requirejs setup
 * read: http://karma-runner.github.io/0.10/plus/requirejs.html
 */


var tests = ['expect'];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/spec\/.*\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

require.config({
  baseUrl: '/base',
  paths: {
    'jquery.scrollto': 'bower_components/jquery.scrollTo/jquery.scrollTo',
    'underscore': 'bower_components/underscore/underscore',
    'backbone': 'bower_components/backbone/backbone',
    'jquery': 'bower_components/jquery/jquery',
    'moment': 'bower_components/moment/moment',
    'expect': 'node_modules/expect.js/expect',
    'models': 'src/models',
    'views': 'src/views',
    'collections': 'src/collections',
    'router': 'src/router',
    'mixins': 'src/mixins',
    'templates': 'src/templates'
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
  },

  // ask Require.js to load these files (all our tests)
  // deps: ['mocha'].concat(tests),
  deps: tests,

  // start test run, once Require.js is done
  callback: window.__karma__.start
});