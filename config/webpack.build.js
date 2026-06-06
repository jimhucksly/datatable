const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common');
const { ENV, dir } = require('./helpers');
const plugins = require('./plugins');

module.exports = function() {
  return merge(commonConfig(), {
    mode: 'production',
    entry: {
      'index': './src/components/datatable.component.vue'
    },
    output: {
      path: dir('dist'),
      library: {
        name: '@dn-web/datatable',
        type: 'umd',
      },
    },
    externals: {
      vue: 'vue',
      'vue-property-decorator': 'vue-property-decorator',
      'vue-class-component': 'vue-class-component',
    },
    plugins: plugins.build(),
  });
};
