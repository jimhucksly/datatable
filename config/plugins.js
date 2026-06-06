const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const ProgressPlugin = require('webpack/lib/ProgressPlugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VuetifyPlugin } = require('webpack-plugin-vuetify');

const { ENV, IS_PRODUCTION, APP_VERSION, IS_DEV, dir } = require('./helpers');

const common = [
  new ProgressPlugin({ modules: true, modulesCount: 3500 }),
  new VueLoaderPlugin(),
  new MiniCssExtractPlugin({
    filename: '[name].css',
    chunkFilename: "[id].css",
  }),
  new webpack.DefinePlugin({
    ENV,
    IS_PRODUCTION,
    APP_VERSION,
    IS_DEV,
    HMR: true,
  }),
];

module.exports = {
  dev: function(env) {
    return [
      ...common,
      new HtmlWebpackPlugin({
        inject: true,
        template: dir('/src/index.html'),
      }),
      new webpack.DefinePlugin({
        __VUE_OPTIONS_API__: true,
        __VUE_PROD_DEVTOOLS__: true,
        __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
        $DEV: env.NODE_ENV === 'development',
      }),
      new VuetifyPlugin({
        styles: 'sass',
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'public',
            to: './'
          },
          {
            from: 'src/fonts',
            to: './fonts',
          }
        ]
      })
    ]
  },
  build: function() {
    return [
      ...common,
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1,
      }),
      new webpack.optimize.ModuleConcatenationPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: 'src/index.d.ts',
            to: './index.d.ts'
          },
          {
            from: 'src/types',
            to: './types',
          },
          {
            from: 'src/scss',
            to: './scss',
          },
        ]
      })
    ]
  }
}



