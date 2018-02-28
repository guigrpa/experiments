const path = require('path');
const webpack = require('webpack');

const cssLoader = { loader: 'css-loader' };
const sassLoader = { loader: 'sass-loader', options: { indentedSyntax: true } };
const styleRules = loaders => [{ loader: 'style-loader' }].concat(loaders);

module.exports = {
  entry: {
    app: ['./src/client.js'],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(process.cwd(), './public/assets'),
    publicPath: '/assets/',
  },

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: [/node_modules/],
      },
      {
        test: /\.(otf|eot|svg|ttf|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      },
      {
        test: /\.css$/,
        use: styleRules([cssLoader]),
      },
      {
        test: /\.sass$/,
        use: styleRules([cssLoader, sassLoader]),
      },
    ],
  },
};
