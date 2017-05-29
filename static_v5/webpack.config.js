var webpack = require('webpack');
var path = require('path');
var ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
var WebpackChunkHash = require('webpack-chunk-hash');
var HTMLWebpackPLugin = require('html-webpack-plugin');

var BUILD_DIR = path.resolve(__dirname, 'build');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
  entry: ['whatwg-fetch', APP_DIR + '/index.js'],
  output: {
    path: BUILD_DIR,
    filename: '[name].[chunkhash].js',
      
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

  plugins: [
      // splitting into vendor, main and manifest
      // see https://webpack.js.org/guides/code-splitting-libraries/#manifest-file
      new webpack.optimize.CommonsChunkPlugin({
          name: 'vendor',
          minChunks: function (module) {
             // this assumes your vendor imports exist in the node_modules directory
             return module.context && module.context.indexOf('node_modules') !== -1;
          }
      }),
      //CommonChunksPlugin will now extract all the common modules from vendor and main bundles
      new webpack.optimize.CommonsChunkPlugin({ 
          name: 'manifest' // But since there are no more common modules between them 
                           // we end up with just the runtime code included in the manifest file
      }),

      // hashing vendor, main, manifest
      // see https://webpack.js.org/guides/caching/#deterministic-hashes
			new webpack.HashedModuleIdsPlugin(),
			new WebpackChunkHash(),
			new ChunkManifestPlugin({
				filename: "chunk-manifest.json",
				manifestVariable: "webpackManifest",
				inlineManifest: true
			}),

      // insert the chunkhashed filenames into index.html
      new HTMLWebpackPLugin({
        template: './index.template.html',
        filename: path.resolve(__dirname, './index.html'), // output
      }),
  ],

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
