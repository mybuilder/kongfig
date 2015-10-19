var webpack = require('webpack');

module.exports = {
    entry: {
        kongfig: './src/cli.js',
        test: './test/index.js'
    },
    module: {
        preLoader: [
            { test: /\.json$/, loader: 'json'}
        ],
        loaders: [
            {
                test: [ /\.js$/ ],
                exclude: /node_modules/,
                loaders: ['babel-loader?optional[]=es7.classProperties&optional[]=runtime']
            }
        ]
    },
    resolve: {
        modulesDirectories: [ './node_modules', './src' ],
        extensions: [ '', '.js' ]
    },
    output: {
        filename: '[name].js',
        path: __dirname + '/dist'
    }
};
