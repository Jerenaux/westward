/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 03-02-19.
 */
const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    entry: {
        'client':'./client/main.js',
        'server':'./server.js'
    },
    output: {
        filename: "[name].js",
        // path: path.resolve(__dirname, 'dist')
    },
    node: {
        __dirname: false
    },
    mode: 'development',
    target: 'node', // in order too ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder

    module: {
        rules: [
        //   {
        //     test: /\.js$/,
        //     include: path.resolve(__dirname, 'src/'),
        //     use: {
        //       loader: 'babel-loader',
        //       options: {
        //         presets: ['env']
        //       }
        //     }
        //   }
            {
                test: /\.css$/,
                use: [
                    'style-loader',
                    'css-loader'
                ]
            }
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            'typeof CANVAS_RENDERER': JSON.stringify(false),
            'typeof WEBGL_RENDERER': JSON.stringify(true)
        })
  ]
};
