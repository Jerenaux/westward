/**
 * Created by Jerome Renaux (jerome.renaux@gmail.com) on 03-02-19.
 */
const path = require('path');

module.exports = {
    entry: './src/index.js',
    output: {
        filename: 'dist.js',
        // path: path.resolve(__dirname, 'dist')
    }
};
