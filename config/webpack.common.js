const path = require('path');
const rules = require('./rules');

module.exports = function() {
  return {
    ignoreWarnings: [
      /export .*was not found/
    ],
    resolve: {
      symlinks: true,
      modules: [path.join(__dirname, '../'), 'node_modules'],
      extensions: ['.*', '.ts', '.js', '.vue', '.html', '.json', '.scss', '.css'],
      alias: {
        'vue$': 'vue/dist/vue.esm-bundler.js',
        '@': 'src',
      },
    },
    performance: {
      hints: false
    },
    output: {
      path: path.resolve(__dirname, '../dist'),
      filename: '[name].js',
      sourceMapFilename: '[name].map',
      chunkFilename: '[id].chunk.js',
      clean: true,
      assetModuleFilename: 'fonts/[name][ext]',
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
      },
    },
    module: {
      rules: rules()
    },
  };
};
