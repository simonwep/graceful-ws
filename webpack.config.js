const {version} = require('./package');
const webpack = require('webpack');

module.exports = {
    mode: 'production',

    entry: {
        'fancy-websocket': './src/index.ts'
    },

    output: {
        filename: '[name].min.js',
        library: 'FancyWebsocket',
        libraryExport: 'default',
        libraryTarget: 'umd'
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    'ts-loader',
                    'eslint-loader'
                ]
            }
        ]
    },

    plugins: [
        new webpack.SourceMapDevToolPlugin({
            filename: `[name].min.js.map`
        }),
        new webpack.BannerPlugin({
            banner: `Fancy Websocket ${version} MIT | https://github.com/Simonwep/fancy-websocket`
        })
    ]
};
