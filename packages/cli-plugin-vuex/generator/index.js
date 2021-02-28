module.exports = (generator) => {
    generator.injectImports(generator.entryFile, `import store from './store'`)

    generator.injectRootOptions(generator.entryFile, `store`)

    generator.extendPackage({
        dependencies: {
            vuex: '^3.6.2',
        },
    })

    generator.render('./template', {})
}
