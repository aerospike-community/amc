var webpack = require('webpack');
var path = require('path');
var ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
var WebpackChunkHash = require('webpack-chunk-hash');
var HTMLWebpackPLugin = require('html-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var CompressionPlugin = require("compression-webpack-plugin");

var isProd = (process.env.NODE_ENV === 'production');
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

  plugins: plugins(),

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
        test: /\.less$/,
        loader: 'style-loader!css-loader!less-loader'
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

  // see https://webpack.js.org/configuration/devtool/
  devtool: isProd ? 'source-map' : 'cheap-module-eval-source-map',
};

function plugins() {
  var plugins = [
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

    // load only locale english in moment
    // see https://stackoverflow.com/questions/25384360/how-to-prevent-moment-js-from-loading-locales-with-webpack
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),

    // insert the chunkhashed filenames into index.html
    new HTMLWebpackPLugin({
      template: './index.template.html',
      filename: path.resolve(__dirname, './index.html'), // output
    }),

    // show the bundle sizes
    // new BundleAnalyzerPlugin(),
  ];

  if (isProd) {
    plugins = plugins.concat([
      // minify everything
      new webpack.optimize.UglifyJsPlugin(),

      // TODO setup server to serve gzipped files
      // gzip files 
      new CompressionPlugin({
        asset: "[path].gz[query]",
        algorithm: "gzip",
        test: /(main|vendor).*\.js$/, // minimize only vendor and main bundles
        threshold: 10240,
        minRatio: 0.8
      }),
    ]);
  }

  return plugins;
}

module.exports = config;
