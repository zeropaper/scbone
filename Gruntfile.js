/* jshint node: true */
'use strict';
var _ = require('underscore');
var fs = require('fs');
var path = require('path');


// var bower = require('bower');

// bower.commands
// .install(['jquery'], { save: true }, {})
// .on('end', function (installed) {
//     console.log(installed);
// });

module.exports = function(grunt) {
  var pkg = grunt.file.readJSON('package.json');

  var setup = pkg.setup || {};

  var componentScripts = [];
  var rjsConfig = {paths: {}, shim: {}};

  _.each(setup.components || {}, function(component, name) {
    
    if (_.isString(component)) {
      componentScripts.push({expand: true, flatten: true, src: ['bower_components/'+ name +'/'+ name +'.js'], dest: setup.builddir +'/'+ setup.scriptsdir +'/'});
      rjsConfig.paths[name] = setup.scriptsdir +'/'+ name;
    }
    else {
      var def = {};
      def[name +'.js'] = setup.scriptsdir +'/';
      _.each(component.files || def, function(dst, src) {
        componentScripts.push({expand: true, flatten: true, src: ['bower_components/'+ name +'/'+ src], dest: setup.builddir +'/'+ dst});
      });
      component.requirejs = component.requirejs || {};
      var paths = component.requirejs.paths || {};
      paths[name] = paths[name] || name;
      _.each(paths, function(val, key) {
        paths[key] = setup.scriptsdir +'/'+ val;
      });
      _.extend(rjsConfig.paths, paths);
      _.extend(rjsConfig.shim, component.requirejs.shim || {});
    }
  });

  grunt.registerMultiTask('requirejsconf', 'Create a requirejs configuration file for the client.', function() {
    // Force task into async mode and grab a handle to the "done" function.
    var done = this.async();

    var conf = _.extend({}, rjsConfig, {
      baseUrl: (setup.relativescripts ? '' : '/') + setup.scriptsdir
    });

    var inScripts = new RegExp('^'+ setup.scriptsdir +'/');
    _.each(conf.paths, function(val, key) {
      conf.paths[key] = inScripts.test(val) ? val.substr(setup.scriptsdir.length + 1) : val;
    });
    
    var tmpl = _.template([
      'define(function() {return <%= json %>;});'
    ].join(''));

    fs.writeFile(path.join(setup.builddir, setup.scriptsdir, 'config.js'), tmpl({json: JSON.stringify(conf, null, 2)}), function(err) {
      done(err ? false : true);
    });
    // Run some sync stuff.
    // grunt.log.writeln('Processing task...');
    // And some async stuff.
    // setTimeout(function() {
    //   grunt.log.writeln('All done!');
    //   done();
    // }, 1000);
  });

  var optimize = 'none';
  var sourceMaps = false;
  sourceMaps = optimize === 'uglify2' ? sourceMaps : false;
  // Project configuration.
  grunt.initConfig({
    setup      : setup,

    requirejs: {
      compile: {
        options: {
          keepBuildDir: true,
          dir: setup.builddir,
          appDir: './',
          baseUrl: './',
          paths: rjsConfig.paths,
          shim: rjsConfig.shim,
          optimizeCss: 'none',
          optimize: optimize,
          preserveLicenseComments: !sourceMaps,
          generateSourceMaps: sourceMaps,
          modules: [
            {
              name: setup.scriptsdir +'/main',
              include: [
                setup.scriptsdir +'/config',
                'backbone'
              ]
            }
          ]
        }
      }
    },

    requirejsconf: {
      compile: {}
    },

    compass: {
      compile: {
        options: {
          sassDir: 'scss',
          cssDir: setup.builddir +'/styles',
          // imagesDir: 'images',
          // javascriptsDir: setup.scriptsdir +'',
          // fontsDir: 'fonts',
          importPath: [
            'bower_components/foundation/scss'
          ],
          relativeAssets: true,
          outputStyle: 'nested',
        }
      }
    },

    // Build HTML from templates and data
    assemble: {
      options: {
        flatten: true,
        assets: setup.builddir +'/assets',
        partials: ['templates/includes/*.hbs'],
        helpers: ['templates/helpers/helper-*.js'],
        layout: 'default.hbs',
        layoutdir: 'templates/layouts',
        data: ['templates/data/*.{json,yml}']
      },
      default_language: {
        src: 'templates/pages/*.hbs',
        dest: setup.builddir +'/'
      },
      german: {
        src: 'templates/pages/de/*.hbs',
        dest: setup.builddir +'/de/'
      },
      french: {
        src: 'templates/pages/fr/*.hbs',
        dest: setup.builddir +'/fr/'
      }
    },

    clean: [setup.builddir],

    copy: {
      scripts: {
        files: [
          {expand: true, flatten: false, src: [setup.scriptsdir +'/**'], dest: setup.builddir +'/'}
        ]
      },
      components: {
        files: componentScripts
      },
      
      images: {
        files: [
          {expand: true, flatten: true, src: ['images/**/*.{jpg,png,gif,ico}'], dest: setup.builddir +'/images/'}
        ]
      },
      
      fonts: {
        files: [
          {expand: true, flatten: true, src: ['fonts/**/*.{eot,svg,ttf,woff}'], dest: setup.builddir +'/fonts/'}
        ]
      }
    },

    jshint: {
      scripts: [
        setup.scriptsdir +'/**/*.js'
      ]
    },

    connect: {
      server: {
        options: {
          hostname: '*',
          port: '8000',
          base: setup.builddir
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
          'jshint:scripts',
          'copy:scripts',
          'requirejsconf'
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

      templates: {
        files: [
          'templates/**/*.{hbs,yml,json,js}'
        ],
        tasks: [
          'assemble'
        ]
      },

      static: {
        files: [
          // setup.builddir +'/**/*.{jpg,png,js,css,html}'
          setup.builddir +'/**'
        ],
        tasks: [],
        options: {
          livereload: true
        }
      }
    }
  });

  // load all grunt tasks
  require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

  // Load npm plugins to provide necessary tasks.
  grunt.loadNpmTasks('assemble');

  grunt.registerTask('build', [
    'clean',
    'copy',
    'compass',
    'assemble',
    'requirejsconf'
  ]);

  // Default tasks to be run.
  grunt.registerTask('dev', [
    'build',
    'connect',
    'watch'
  ]);

  // Optimizations for production version.
  grunt.registerTask('optimize', [
    'requirejs'
  ]);

  // Default tasks to be run.
  grunt.registerTask('default', [
    'build',
    'optimize',
    'connect:server:keepalive'
  ]);
};