const path = require('path');

const entries = {
  artemis: './bots/artemis.ts'
}

module.exports = {
  entry: entries,
  output: {
    path: path.resolve(__dirname),
    filename: "../dist/[name].bot.js", 
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
  },

  target: 'webworker'
}