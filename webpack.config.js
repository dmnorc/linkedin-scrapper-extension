const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "production",
  entry: {
    background: "./src/background.ts",
    settings: "./src/settings.ts",
  },
  devtool: "source-map",
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "static"),
          to: path.resolve(__dirname, "dist"),
        },
      ],
      options: {
        concurrency: 100,
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
          options: {
            configFile: "tsconfig.json",
            transpileOnly: true,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist", "js"),
    clean: true,
    globalObject: "self",
  },
};
