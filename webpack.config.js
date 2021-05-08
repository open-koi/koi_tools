const path = require("path");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./index.ts",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "koi_tools.js"
  },

  resolve: {
    extensions: [".js", ".ts"],
    fallback: {
      fs: false
    }
  },

  module: {
    rules: [
      {
        test: /\.tsx?/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },

  plugins: [
		new NodePolyfillPlugin()
	]
};
