var webpack = require('webpack');

module.exports = {
  entry: './app/index.js',
  output: {
    path: require("path").resolve("./public/pitt/build"),
    filename: 'app.js'
  },
  module: {
    loaders: [
      {
        // Test for js files.
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.css?$/,
        loader: 'style!css'
      }
    ]
  }
};