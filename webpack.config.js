const {version} = require('./package');
const webpack = require('webpack');

module.exports = {
    mode: 'production',

    entry: {
        'graceful-ws': './src/index.ts'
    },

    output: {
        filename: '[name].min.js',
        library: 'GracefulWebSocket',
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
            banner: `Graceful WebSocket ${version} MIT | https://github.com/Simonwep/graceful-ws`
        })
    ]
};
