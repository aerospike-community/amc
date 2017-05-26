var webpack = require('webpack');
var path = require('path');

var BUILD_DIR = path.resolve(__dirname, 'build');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
  entry: ['whatwg-fetch', APP_DIR + '/index.js'],
  output: {
    path: BUILD_DIR,
    filename: 'bundle.js',
      
    // The publicPath specifies the public URL address of the output files when
    // referenced in a browser. Needs to be set for file-loader.
    // Example:
    //  <i className="fa fa-address-book"></i>
    //  - file-loader will create a file named 'af7ae505a9eed503f8b8e6982036873e.woff2'
    //    in 'config.output.path', 
    //  - url referenced by bundle.js will be
    //    'config.output.path/af7ae505a9eed503f8b8e6982036873e.woff2'
    //    which is wrong
    //  - adding publicPath the file will be fetched from 
    //    'config.output.publicPath/af7ae505a9eed503f8b8e6982036873e.woff2'.
    //
    // see https://webpack.github.io/docs/configuration.html#output-publicpath
    publicPath: 'build/',
  },

  resolve: {
    modules: [
      path.resolve(__dirname, './src'),
      path.resolve(__dirname, './node_modules')
    ]
  },

	module : {
    loaders : [
      {
        test : /\.jsx?/,
        include : APP_DIR,
        loader : 'babel-loader',
        query: {
          presets: ['es2015', 'react']
        },
      }, {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }, {
        test: /\.(png|jpg|gif)$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }, {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }, {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader',
        options: {
          limit: 10000
        }
      }
    ]
  },
  devtool: 'inline-source-map',
};

module.exports = config;
