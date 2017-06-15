var webpack = require('webpack');
var path = require('path');
var ChunkManifestPlugin = require('chunk-manifest-webpack-plugin');
var WebpackChunkHash = require('webpack-chunk-hash');
var HTMLWebpackPlugin = require('html-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var CompressionPlugin = require('compression-webpack-plugin');

var isProd = (process.env.NODE_ENV === 'production');
var BUILD_DIR = path.resolve(__dirname, 'build');
var APP_DIR = path.resolve(__dirname, 'src');

var config = {
  entry: {
    main: ['whatwg-fetch', APP_DIR + '/index.js'],
  },

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
        test: /\.scss$/,
        loader: 'style-loader!css-loader!sass-loader'
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

// bigChunkPlugin configures a chunk of 'name' containing
// the given node_module chunks
function bigChunkPlugin(name, chunks) {
  return new webpack.optimize.CommonsChunkPlugin({
      name: name,
      chunks: ['main'].concat(chunks),
      minChunks: function (module) {
        var context = module.context;
        if (!context)
          return false;

        for (var i = 0; i < chunks.length; i++) {
          if (context.indexOf('node_modules/' + chunks[i]) !== -1)
            return true;
        }

        return false;
      }
  });
}

function plugins() {
  var k;
  var plugins = [];

  // all the big libs go into their own chunks
  var BigChunks = {
    brace: ['brace'],
    jquery: ['jquery'],
    nvd3: ['d3', 'nvd3'], 
    reactwidgets: ['react-widgets'],
    reactstrap: ['bootstrap', 'reactstrap'],
  };
  var BigChunkNames = [];

  for (k in BigChunks) {
    BigChunkNames.push(k);
    plugins.push(bigChunkPlugin(k, BigChunks[k]));
  }

  plugins = plugins.concat([
    // everything else in vendor except BigChunks
    // see https://webpack.js.org/guides/code-splitting-libraries/#manifest-file
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        chunks: ['main'],
        minChunks: function (module) {
           return module.context && module.context.indexOf('node_modules') !== -1;
        }
    }),

    // CommonChunksPlugin will now extract all the common modules from vendor,
    // main and the BigChunks
    new webpack.optimize.CommonsChunkPlugin({ 
        name: 'manifest' // But since there are no more common modules between them 
                         // we end up with just the runtime code included in the manifest file
    }),

    // hashing all the chunks
    // see https://webpack.js.org/guides/caching/#deterministic-hashes
    new webpack.HashedModuleIdsPlugin(),
    new WebpackChunkHash(),
    new ChunkManifestPlugin({
      filename: 'chunk-manifest.json',
      manifestVariable: 'webpackManifest',
      inlineManifest: true
    }),

    // load only locale english in moment
    // see https://stackoverflow.com/questions/25384360/how-to-prevent-moment-js-from-loading-locales-with-webpack
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),

    // insert the chunkhashed filenames into index.html
    new HTMLWebpackPlugin({
      template: './index.template.html',
      filename: path.resolve(__dirname, './index.html'), // output
      chunksSortMode: function(c1, c2) {
        // the order of dependencies is
        // manifest, vendor, BigChunks ..., main
        var order = ['manifest', 'vendor'];
        order = order.concat(BigChunkNames);
        order.push('main'); // load main after all its dependencies

        var n1 = c1.names[0];
        var n2 = c2.names[0];
        return order.indexOf(n1) - order.indexOf(n2);
      },
    }),

    // show the bundle sizes
    // uncomment to analyze bundle sizes
    // new BundleAnalyzerPlugin(),
  ]);

  if (isProd) {
    plugins = plugins.concat([
      // minify everything
      new webpack.optimize.UglifyJsPlugin(),

      // TODO setup server to serve gzipped files
      // gzip all javascript files 
      new CompressionPlugin({
        asset: '[path].gz[query]',
        algorithm: 'gzip',
        test: /.*\.js$/,
        threshold: 10240,
        minRatio: 0.8
      }),
    ]);
  }

  return plugins;
}

module.exports = config;
