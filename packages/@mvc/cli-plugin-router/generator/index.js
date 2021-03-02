module.exports = (generator, options = {}) => {
    generator.injectImports(generator.entryFile, `import router from './router'`)

    generator.injectRootOptions(generator.entryFile, `router`)

    generator.extendPackage({
        dependencies: {
            'vue-router': '^3.5.1',
        },
    })

    generator.render('./template', {
        historyMode: options.historyMode,
        hasTypeScript: false,
        plugins: [],
    })
}
