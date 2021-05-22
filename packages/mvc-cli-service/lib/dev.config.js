const path = require('path')
const merge = require('webpack-merge')
const base = require('./base.config')

const resolve = (filePath) => path.resolve(process.cwd(), filePath)

module.exports = merge(base, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
        contentBase: resolve('./dist'),
        hot: true,
        port: 8080,
    },
    output: {
        filename: '[name].bundle.js',
        path: resolve('./dist'),
    },
})
