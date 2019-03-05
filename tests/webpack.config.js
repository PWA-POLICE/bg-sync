const path = require('path')

module.exports = function() {
  return {
    mode: 'none',

    entry: {
      main: path.join(__dirname, 'main.js'),
    },

    output: {
      path: path.join(__dirname, 'output'),
      filename: '[name].js',
      chunkFilename: '[name].js',
      publicPath: '/'
    },
  };
};