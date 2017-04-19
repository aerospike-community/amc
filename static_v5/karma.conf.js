// Karma configuration
var path = require('path');
var webpack = require('webpack');

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'src/*.js',
      'src/*.jsx',
      'tests/unit/*.js',
      'tests/unit/*.jsx',
    ],

    // webpack configuration
    webpack: {
      module : {
        loaders : [
          {
            test : /\.jsx?/,
            loader : 'babel-loader',
            query: {
              presets: ['es2015', 'react']
            },
          }, {
            test: /\.css$/,
            loader: 'style-loader!css-loader'
          }, {
            test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
            loader: 'url-loader',
            options: {
              limit: 10000
            }
          }, {
            test: /\.json$/,
            loader: 'json'
          }
        ]
      },
      
      // see https://github.com/davezuko/react-redux-starter-kit/issues/328
      // https://github.com/dtothefp/karma-webpack-enzyme/blob/master/karma.conf.js#L43
      externals: {
        'cheerio': 'window',
        'react/lib/ExecutionEnvironment': true,
        'react/addons': true,
        'react/lib/ReactContext': 'window',
      },

      devtool: 'inline-source-map',

      resolve: {
        modules: ['node_modules', path.resolve(__dirname)]
      },

      plugins: [
				 new webpack.ProvidePlugin({
          'React': 'react',
        })
			]
    },

    // list of files to exclude
    exclude: [
      'src/index.js',
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'src/*.js': ['webpack'],
      'src/*.jsx': ['webpack'],
      'tests/unit/*.js': ['webpack'],
      'tests/unit/*.jsx': ['webpack'],
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
