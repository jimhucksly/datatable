const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const cssLoaders = (ext) => {
  const result = [];
  if (process.env.NODE_ENV === 'development') {
    result.push('style-loader');
    result.push({
      loader: 'css-loader',
      options: {
        importLoaders: 1,
      }
    });
    result.push('postcss-loader');
  } else {
    result.push(MiniCssExtractPlugin.loader);
    result.push({
      loader: 'css-loader',
      options: {
        modules: false,
        sourceMap: false,
        importLoaders: 2,
        url: false,
      }
    });
    result.push({
      loader: 'postcss-loader',
      options: {
        sourceMap: true
      }
    });
  }

  if (ext === 'scss') {
    if (process.env.NODE_ENV === 'development') {
      result.push({
        loader: 'sass-loader',
        options: {
          implementation: require('sass'),
        }
      });
    } else {
      result.push({
        loader: 'sass-loader',
        options: {
          implementation: require('sass'),
          sourceMap: false,
        }
      });
    }
  }
  return result;
}

const sassLoaders = () => {
  return [
    'style-loader',
    {
      loader: 'css-loader',
      options: {
        importLoaders: 1,
      }
    },
    {
      loader: 'sass-loader',
      options: {
        implementation: require('sass'),
        sassOptions: {
          indentedSyntax: true
        },
      }
    }
  ]
}

const vueLoaders = () => {
  return {
    loader: 'vue-loader',
    options: {
      compilerOptions: {
        whitespace: 'preserve',
      },
      hotReload: true
    }
  }
}

const tsLoaders = () => {
  return {
    loader: 'ts-loader',
    options: {
      appendTsSuffixTo: ['\\.vue$'],
      transpileOnly: true,
      happyPackMode: true,
    }
  }
}

module.exports = {
  cssLoaders,
  sassLoaders,
  vueLoaders,
  tsLoaders
}