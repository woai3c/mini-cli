module.exports = (generator) => {
    generator.extendPackage({
        babel: {
            presets: ['@babel/preset-env'],
        },
        dependencies: {
            'core-js': '^3.8.3',
        },
        devDependencies: {
            '@babel/core': '^7.12.13',
            '@babel/preset-env': '^7.12.13',
            'babel-loader': '^8.2.2',
        },
    })

    // generator.render('./template', {})
}
