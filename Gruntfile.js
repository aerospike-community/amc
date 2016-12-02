module.exports = function(grunt) {
  grunt.initConfig({
    // pull in all of the dependencies of setup.js into one file
    requirejs: {
      compile: {
        options: {
          appDir: 'static',
          baseUrl: './js',
          dir: 'build/static',
          optimize: 'none',
          mainConfigFile: 'static/js/setup.js',
          modules: [{
            name: 'setup',
          }]
        }
      },
    },

    // revision setup.js and css files based on content
    filerev: {
        options: {
          algorithm: 'md5',
          length: 8
        },
        js: {
          src: 'build/static/js/setup.js',
        },
        css: {
          src: 'build/static/css/*.css',
        },
    },

    // replace filenames with revisioned file names
    filerev_replace: {
      options: {
        assets_root: 'build',
      },
      html: {
        src: 'build/static/index.html', 
      },
    },

    // filerev_replace does not replace data-main argument supplied to
    // requirejs, doing that here
    replace: {
      requirejs: {
        src: 'build/static/index.html',
        overwrite: true,
        replacements: [{
          // replace data-main with the revisioned file name
          from: 'static/js/setup',
          to: function(match) {
            var k, v;
            for(k in grunt.filerev.summary) {
              v = grunt.filerev.summary[k];
              if(k.indexOf('static/js/setup') !== -1) {
                // remove prefix 'build/' and suffix '.js'
                return v.slice('build/'.length, -1*'.js'.length);
              }
            }
            return match;
          }
        }],
      },
    },

  });

  // load modules
  grunt.loadNpmTasks('grunt-contrib-requirejs');
	grunt.loadNpmTasks('grunt-filerev');
	grunt.loadNpmTasks('grunt-filerev-replace');
  grunt.loadNpmTasks('grunt-text-replace');

	grunt.registerTask('default', ['requirejs', 'filerev', 'filerev_replace', 'replace']);
}

