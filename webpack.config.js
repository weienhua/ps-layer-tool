const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'src/index.html', to: 'index.html' },
        { from: 'src/style.css', to: 'style.css' },
        { from: 'src/lib/CSInterface.js', to: 'lib/CSInterface.js' },
        { from: 'src/lib/presets.md', to: 'lib/presets.md' },
        { from: 'src/lib/template.md', to: 'lib/template.md' },
      ],
    }),
  ],
  mode: 'development',
  devtool: 'source-map',
};
