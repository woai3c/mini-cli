#!/usr/bin/env node
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const devConfig = require('../lib/dev.config')
const buildConfig = require('../lib/pro.config')

const args = process.argv.slice(2)
if (args[0] === 'serve') {
    const compiler = webpack(devConfig)
    const server = new WebpackDevServer(compiler)

    server.listen(8080, '0.0.0.0', err => {
        console.log(err)
    })
} else if (args[0] === 'build') {
    webpack(buildConfig, (err, stats) => {
        if (err) console.log(err)
        if (stats.hasErrors()) {
            console.log(new Error('Build failed with errors.'))
        }
    })
} else {
    console.log('error command')
}