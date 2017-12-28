const path = require('path');

module.exports = {
  entry: './app.ts',
  output: {
    path: path.resolve(__dirname),
    filename: "dist/app.js", 
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: "ts-loader",
      }
    ]
  },

  resolve: {
    extensions: [".ts"]
  }
}