const { cssLoaders, sassLoaders, vueLoaders, tsLoaders } = require('./loaders.js');

const rules = () => {
  const result = [
    {
      test: /\.vue$/,
      use: vueLoaders()
    },
    {
      test: /\.ts$/,
      exclude: /(node_modules|\.spec\.ts|\.d\.ts)$/,
      use: tsLoaders()
    },
    {
      test: /\.(css)$/,
      use: cssLoaders()
    },
    {
      test: /\.(scss)$/,
      use: cssLoaders('scss')
    },
    {
      test: /\.sass$/,
      use: sassLoaders()
    },
    {
      test: /\.(woff|woff2|eot|ttf)?$/i,
      type: 'asset/resource',
      dependency: {
        not: ['url']
      },
    }
  ];
  return result;
}

module.exports = rules
