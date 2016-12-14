module.exports = function(grunt) {
  grunt.initConfig({
    // clean directory
    clean:  {
      build: 'build/'
    },

    // copy directory
    copy: {
      build: {
        expand: true,
        src: 'static/**',
        dest: 'build/'
      }
    },

    // revision javascript and css files
    filerev: {
        options: {
          algorithm: 'md5',
          length: 8
        },
        js: {
          src: [
            // exclude lib directory
            'build/static/js/*.js',
            'build/static/js/collections/**/*.js',
            'build/static/js/config/**/*.js',
            'build/static/js/helper/**/*.js',
            'build/static/js/models/**/*.js',
            'build/static/js/views/**/*.js',
          ]
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

    // uglify
    uglify: {
      options: {
        sourceMap: true,
        sourceMapIncludeSources: true,
      },
      js: {
        files: [{
          expand: true,
          src: ['build/static/js/**/*.js'],
          dest: '',
        }]
      },
    },

  });

  // Configure requirejs paths to serve revved files
  grunt.registerTask('require-paths', '', function() {
    var config = concatConfig();
    var file = findMainConfigFile();
    grunt.file.write(file, config);
    return;

    // concat revved config and original config
    function concatConfig() {
      var config = 'require.config({ paths: {';
      var k, v;
      for(k in grunt.filerev.summary) {
        v = grunt.filerev.summary[k];
        if(k.indexOf('.js') !== -1) {
           // remove prefix 'build/static/js/' and suffix '.js'
           k = k.slice('build/static/js/'.length, -1*'.js'.length);
           v = v.slice('build/static/js/'.length, -1*'.js'.length);
           config += "'" + k + "'" + ":" + "'" + v + "'" + ", \n";
        }
      }
      config += '}});';
      // add original config
      config += '\n' + grunt.file.read('static/js/setup.js');
      return config;
    }

    // find the main config file for requirejs
    function findMainConfigFile() {
      var k, v;
      for(k in grunt.filerev.summary) {
        v = grunt.filerev.summary[k];
        // setup.js is the main config file for requirejs
        if(k.indexOf('setup.js') !== -1) {
          return v;
        }
      }
    }
  });

  // load modules
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-filerev');
	grunt.loadNpmTasks('grunt-filerev-replace');
  grunt.loadNpmTasks('grunt-text-replace');

	grunt.registerTask('default', ['clean', 'copy', 'filerev', 'filerev_replace', 'replace', 'require-paths', 'uglify']);
}

