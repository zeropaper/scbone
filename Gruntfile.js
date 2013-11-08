/* jshint node: true */
'use strict';

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  var setup = pkg.setup || {
    scriptsdir: 'src'
  };

  var srcFiles = [
    'src/templates.js',
    'src/mixins.js',
    'src/router.js',
    'src/models/*.js',
    'src/collections/*.js',
    'src/views/*.js'
  ];

  var depsFiles = [
    'bower_components/requirejs/require.js',
    'bower_components/underscore/underscore.js',
    'bower_components/jquery/jquery.js',
    'bower_components/jquery.scrollTo/jquery.scrollTo.js',
    'bower_components/backbone/backbone.js',
    'bower_components/moment/moment.js'
  ];

  
  // Project configuration.
  grunt.initConfig({
    pkg         : pkg,
    setup       : setup,

    jshint: {
      scripts: [
        setup.scriptsdir +'/**/*.js'
      ]
    },

    uglify: {
      options: {
        mangle: {
          except: [
            'jQuery',
            'Backbone',
            '_',
            'moment'
          ]
        },
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> */\n'
      },
      dist: {
        sourceMap: 'scbone.min.map.js',
        files: {
          'scbone.min.js': srcFiles,
          'scbone-dependencies.min.js': depsFiles
        }
      },
      dev: {
        options: {
          compress: false,
          preserveComments: true,
          beautify: {
            beautify: true,
            indent_level: 2,
            comments: true
          },
          mangle: false
        },

        files: {
          'scbone.js': srcFiles,
          'scbone-dependencies.js': depsFiles
        }
      }
    },

    watch: {
      package: {
        files: ['package.json'],
        tasks: ['build']
      },

      scripts: {
        files: [
          setup.scriptsdir +'/**/*.js'
        ],
        tasks: [
          'build'
        ]
      }
    }
  });

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Load npm plugins to provide necessary tasks.
  grunt.loadNpmTasks('assemble');

  grunt.registerTask('build', [
    'jshint:scripts',
    'uglify'
  ]);

  // Default tasks to be run.
  grunt.registerTask('dev', [
    'build',
    'watch'
  ]);

  grunt.registerTask('default', [
    'build'
  ]);
};