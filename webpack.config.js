/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 03-02-19.
 */
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: './client/main.js',

    output: {
        filename: 'dist.js',
        // path: path.resolve(__dirname, 'dist')
    },

    // module: {
    //     rules: [
    //       {
    //         test: /\.js$/,
    //         include: path.resolve(__dirname, 'src/'),
    //         use: {
    //           loader: 'babel-loader',
    //           options: {
    //             presets: ['env']
    //           }
    //         }
    //       }
    //     ]
    //   }

    plugins: [
        new webpack.DefinePlugin({
            'typeof CANVAS_RENDERER': JSON.stringify(false),
            'typeof WEBGL_RENDERER': JSON.stringify(true)
        })
  ]
};
