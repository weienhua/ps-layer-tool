const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  const mode = isProduction ? 'production' : 'development';

  return {
    entry: './src/main.ts',
    module: {
      rules: [
        {
          test: /\.vue$/,
          use: 'vue-loader',
        },
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              appendTsSuffixTo: [/\.vue$/],
            },
          },
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.vue', '.js'],
      alias: {
        vue$: 'vue/dist/vue.esm-bundler.js',
      },
    },
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
    },
    plugins: [
      new VueLoaderPlugin(),
      new webpack.DefinePlugin({
        __DEBUG__: JSON.stringify(!isProduction),
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/index.html', to: 'index.html' },
          { from: 'src/lib/CSInterface.js', to: 'lib/CSInterface.js' },
          { from: 'src/lib/presets.md', to: 'lib/presets.md' },
          { from: 'src/lib/template.md', to: 'lib/template.md' },
        ],
      }),
    ],
    mode: mode,
    devtool: isProduction ? false : 'source-map',
    optimization: {
      minimize: false,
    },
  };
};
