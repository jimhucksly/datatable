const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common');
const devServer = require('./server');
const plugins = require('./plugins');

module.exports = function() {
  return merge(commonConfig(), {
    mode: 'development',
    entry: {
      'app': './src/index.ts',
    },
    devtool: 'inline-source-map',
    devServer,
    plugins: plugins.dev(process.env),
  });
};
