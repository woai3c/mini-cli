module.exports = (generator) => {
    generator.render('./template', {
        doesCompile: false
    })

    generator.extendPackage({
        dependencies: {
            'vue': '^2.6.12'
        },
        devDependencies: {
            'vue-template-compiler': '^2.6.12'
        }
    })

    generator.extendPackage({
        scripts: {
            'dev': 'webpack-dev-server --config ./build/dev.config.js',
            'build': 'webpack --config ./build/pro.config.js'
        },
        browserslist: [
            '> 1%',
            'last 2 versions',
            'not dead'
        ]
    })
}
