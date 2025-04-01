const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        static: {
            directory: __dirname,
        },
        hot: false,
        liveReload: false,
        open: true,
        port: 8080,
        client: {
            overlay: true,
        }
    },
});
