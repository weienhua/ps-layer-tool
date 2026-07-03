const path = require('path');
const webpack = require('webpack');

module.exports = (env, argv) => {
  const mode = argv.mode || 'development';
  const isDev = mode === 'development';

  return {
    mode,
    target: ['web', 'es3'],
    entry: './src/jsx/hostscript.ts',
    resolve: {
      extensions: ['.js', '.ts', '.json'],
    },
    devtool: isDev ? 'source-map' : false,
    module: {
      rules: [{
        test: /\.ts?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: 'tsconfig.jsx.json'
          }
        },
        exclude: /node_modules/
      }]
    },
    plugins: [
      new webpack.DefinePlugin({ __DEV__: JSON.stringify(isDev) }),
      new webpack.BannerPlugin({
        banner: 'if(typeof Object.defineProperty!=="function")Object.defineProperty=function(o,p,d){if(d&&d.get)o[p]=d.get();else if(d&&d.value!==undefined)o[p]=d.value;return o;};',
        raw: true,
        entryOnly: true
      })
    ],
    output: {
      filename: 'hostscript.js',
      path: path.resolve(__dirname, 'dist/jsx')
      // 不配置 library，依赖代码中的 $ = $ || {} 手动暴露全局变量
    },
    optimization: {
      minimize: false,
    },
  };
};
