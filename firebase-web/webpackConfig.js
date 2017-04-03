const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: {
    app: ['./src/client/app.js'],
  },

  output: {
    filename: '[name].js',
    path: path.resolve(process.cwd(), './lib/server/public'),
    publicPath: '/',
  },
};
