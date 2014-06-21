module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

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

    watch: {
      options: {
        livereload: true,
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
          'compiled/tools_freak.jquery.js',
          'compiled/storage_freak.jquery.js',
          'compiled/selectorablium.jquery.js',
          'wrappers/selectorablium/outro.js',
        ],
        dest: 'dist/selectorablium.js'
      },
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

  grunt.registerTask('build_css', [
    'sass'
  ]);
  grunt.registerTask('build_js', [
    'coffee:dist',
    'concat:js',
    'uglify:js'
  ]);
  grunt.registerTask('build', [
    'build_css',
    'build_js',
    'copy:images',
  ]);

  //DEFAULT TASKS
  grunt.registerTask('cleanup', ['clean']);
  grunt.registerTask('default', ['watch']);
  // grunt.registerTask('test', []);
};
