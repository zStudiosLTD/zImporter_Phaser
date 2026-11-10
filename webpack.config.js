const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'zimporter-phaser.min.js',
    library: 'zimporter',
    libraryTarget: 'umd',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        options: {
          configFile: 'tsconfig.webpack.json',
        },
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    'reflect-metadata': 'Reflect',
    'class-transformer': 'classTransformer',
    'class-validator': 'classValidator',
  },
  mode: 'production',         // keep production mode
  devtool: 'source-map',      // ✅ generate .map files for debugging
};
