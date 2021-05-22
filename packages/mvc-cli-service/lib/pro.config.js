const path = require('path')
const merge = require('webpack-merge')
const base = require('./base.config')

const resolve = (filePath) => path.resolve(process.cwd(), filePath)

module.exports = merge(base, {
    mode: 'production',
    devtool: 'source-map',
    output: {
        path: resolve('./dist'),
        publicPath: './',
        filename: '[name].[contenthash].js',
        chunkFilename: '[name].[contenthash].js',
    },
})
