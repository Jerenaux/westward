/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 03-02-19.
 *
 * README:
 * - WDS watches for changes in both client and server and recompiles outputs accordingly
 * - Recompilation is done in-memory, so it must forcefully be written
 * to disk by the WriteFilePlugin for the server to pick on the changes
 */
const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const WriteFilePlugin = require('write-file-webpack-plugin');


module.exports = {
    entry: {
        'client':'./client/main.js',
        'editor':'./editor/editor.js',
        'server':'./server.js',
        'test': './test/tests.js'
    },
    output: {
        filename: "[name].js",
        path: path.resolve(__dirname, 'dist'),
    },
    node: {
        __dirname: false
    },
    mode: 'development',
    target: 'node', // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder

    watchOptions: {
        ignored: ['admin','docker','editor','maps','maps/*','node_modules','tools']
    },

    devServer: {
        port: 8080,
         // Redirect requests to WDS (8080) to Node server (8081)
        proxy: {
            '/socket.io': {
                target: 'http://localhost:8081/',
                secure: false
            }
        },
        publicPath: '/dist'
    },

    resolve: {
        symlinks: false
    },

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
        new WriteFilePlugin()
        // new CircularDependencyPlugin({
        //     // exclude detection of files based on a RegExp
        //     exclude: /node_modules/,
        //     // add errors to webpack instead of warnings
        //     failOnError: false,
        //     // allow import cycles that include an asyncronous import,
        //     // e.g. via import(/* webpackMode: "weak" */ './file.js')
        //     allowAsyncCycles: false,
        //     // set the current working directory for displaying module paths
        //     cwd: process.cwd(),
        // })
    ]
};
