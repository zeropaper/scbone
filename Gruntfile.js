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


  // Project configuration.
  grunt.initConfig({
    pkg         : pkg,
    setup       : setup,

    jshint: {
      scripts: [
        setup.scriptsdir +'/**/*.js'
      ]
    },

    compass: {
      compile: {
        options: {
          sassDir: 'scss',
          cssDir: '.',
          imagesDir: 'images',
          // javascriptsDir: '',
          fontsDir: 'fonts',
          importPath: [
            'bower_components/foundation/scss'
          ],
          relativeAssets: true,
          outputStyle: 'nested',
        }
      }
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
        files: {
          'scbone-dependencies.min.js': ['scbone-dependencies.js'],
          'scbone-almond.min.js': ['scbone-almond.js'],
          'scbone.min.js': ['scbone.js']
        }
      }
    },

    requirejs: {
      options: {
        baseUrl: 'src',
        optimize: 'none',

        paths: {
          'underscore':      './../bower_components/underscore/underscore',
          'backbone':        './../bower_components/backbone/backbone',
          'moment':          './../bower_components/moment/moment',
          'zepto':           './../bower_components/zepto/zepto',
          'jquery':          './../bower_components/jquery/jquery',
          'jquery.scrollto': './../bower_components/jquery.scrollTo/jquery.scrollTo',

          'scbone':          'router'
        },

        shim: {
          underscore: {
            exports: ['_']
          },
          moment: {
            exports: ['moment']
          },
          zepto: {
            exports: ['Zepto']
          },
          jquery: {
            exports: ['jQuery']
          },
          'jquery.scrollTo': {
            exports: ['$.fn.scrollTo'],
            deps: ['jquery']
          },
          backbone: {
            exports: ['Backbone'],
            deps: ['jquery', 'underscore']
          },

          scbone: {
            exports: ['SCBone'],
            deps: [
              'backbone',
              'jquery.scrollto',
              'moment'
            ]
          }
        }
      },
      deps: {
        options: {
          out: 'scbone-dependencies.js',
          name: '../bower_components/requirejs/require',
          wrap: true,
          include: [
            'jquery',
            'jquery.scrollto',
            'underscore',
            'backbone',
            'moment'
          ],
        }
      },
      lib: {
        options: {
          out: 'scbone.js',
          name: 'scbone',
          // wrap: true,
          exclude: [
            'backbone',
            'jquery',
            'jquery.scrollto',
            'underscore',
            'moment'
          ]
        }
      },
      almond: {
        options: {
          out: 'scbone-almond.js',
          name: '../bower_components/almond/almond',
          wrap: true,
          include: ['scbone'],
          exclude: [
            'backbone',
            'jquery',
            'jquery.scrollto',
            'underscore',
            'moment'
          ]
        }
      }
    },

    watch: {
      options: {
        livereload: false
      },

      scripts: {
        files: [
          setup.scriptsdir +'/**/*.js'
        ],
        tasks: [
          'build'
        ]
      },

      styles: {
        files: [
          'scss/**/*.scss'
        ],
        tasks: [
          'compass'
        ]
      },

      dev: {
        files: [
          '*.{css,js,html}'
        ],
        tasks: [],
        options: {
          livereload: 35728
        }
      }
    },

    connect: {
      dev: {
        options: {
          hostname: '*',
          port: '8001',
          base: __dirname,
          livereload: 35728
        }
      }
    }
  });

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Load npm plugins to provide necessary tasks.
  grunt.loadNpmTasks('assemble');

  grunt.registerTask('build', [
    'jshint',
    'requirejs',
    'compass'
  ]);

  // Default tasks to be run.
  grunt.registerTask('dev', [
    'build',
    'connect',
    'watch'
  ]);

  grunt.registerTask('default', [
    'build',
    'uglify'
  ]);
};