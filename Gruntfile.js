module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    bower: {
      install: {
        options:{
          install        : true,
          copy           : false,
          cleanTargetDir : false,
          cleanBowerDir  : false
        }
      }
    },

    clean: {
      dist:  {
        src: ['dist/**/*']
      },
      compiled:  {
        src: ['compiled/**/*']
      },
    },

    bump: {
      options: {
        pushTo: 'origin',
      }
    },

    karma: {
      options: {
        configFile: 'karma.conf.js',
      },
      background: {
        background: true
      },
      single: {
        browsers: ['PhantomJS'],
        logLevel: 'ERROR',
        singleRun: true
      },
    },

    watch: {
      options: {
        livereload: true,
      },
      specs:{
        files: [
          'spec/**/*_spec.coffee',
        ],
        tasks: [
          'run_tests',
        ]
      },
      coffee:{
        files: [
          'coffee/**/*.coffee',
        ],
        tasks: [
          'build_js',
        ]
      },
      scss:{
        files: [
          'scss/**/*.scss',
        ],
        tasks: [
          'build_css',
        ]
      },
    },

    sass: {
      minified: {
        options: {
          style: 'compressed'
        },
        files:[{
          expand: true,
          cwd: 'scss',
          src: [
            '**/*.scss',
          ],
          dest: 'dist/css/',
          ext: '.min.css'
        }]
      },
      expanded: {
        options: {
          style: 'expanded'
        },
        files:[{
          expand: true,
          cwd: 'scss',
          src: [
            '**/*.scss',
          ],
          dest: 'dist/css/',
          ext: '.css'
        }]
      },
    },

    coffee: {
      options: {
        bare: true
      },
      dist: {
        expand: true,
        extDot: 'last',
        cwd: 'coffee',
        src: [
          '**/*.coffee',
        ],
        dest: 'compiled/',
        ext: '.js'
      },
    },

    uglify: {
      options: {
        mangle: false,
        beautify: {
          ascii_only: true
        },
        preserveComments: false,
        report: "min",
        compress: {
          hoist_funs: false,
          loops: false,
          unused: false
        }
      },
      js: {
        files: [{
          expand: true,
          cwd: 'dist',
          extDot: 'last',
          src: [
            '**/*.js',
            '!**/*.min.js',
          ],
          dest: 'dist',
          ext: '.min.js'
        }],
      },
    },

    concat: {
      options: {
        separator: ';\n'
      },
      js: {
        options: {
          separator: '\n'
        },
        src: [
          'wrappers/selectorablium/intro.js',
          'compiled/selectorablium_bundle.js',
          'wrappers/selectorablium/outro.js',
        ],
        dest: 'dist/selectorablium.js'
      },
    },

    optimize_rjs: {
      dist: {
        name: "selectorablium",
        dest: "compiled/selectorablium_bundle.js"
      }
    },

    copy: {
      images: {
        files: [{
          expand: true,
          cwd: 'images',
          extDot: 'last',
          src: '**/*',
          dest: 'dist/css/img'
        }],
      },
    },
  });

  require('load-grunt-tasks')(grunt);
  grunt.loadTasks( "tasks" );


  grunt.registerTask('build_css', [
    'sass'
  ]);
  grunt.registerTask('build_js', [
    'coffee:dist',
    'optimize_rjs',
    'concat:js',
    'uglify:js'
  ]);
  grunt.registerTask('build', [
    'build_css',
    'build_js',
    'copy:images',
  ]);

  //TEST TASKS
  grunt.registerTask('start_test_server', ['karma:background:start']);
  grunt.registerTask('run_tests', ['karma:background:run']);


  //DEFAULT TASKS
  grunt.registerTask('cleanup', ['clean']);

  grunt.registerTask('default', [
    'start_test_server',
    'watch',
  ]);

  grunt.registerTask('test', [
    'bower:install',
    'build_css',
    'karma:single'
  ]);
};