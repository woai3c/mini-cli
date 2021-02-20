module.exports = (generator, { lintOn }) => {
    generator.render('./template')

    generator.extendPackage({
        scripts: {
            lint: 'eslint --ext .js,.jsx,.vue src/',
        },
        devDependencies: {
            'babel-eslint': '^10.1.0',
            eslint: '^7.20.0',
            'eslint-config-airbnb-base': '^14.2.1',
            'eslint-plugin-import': '^2.22.1',
            'eslint-plugin-vue': '^7.6.0',
        },
    })

    if (lintOn.includes('commit')) {
        generator.extendPackage({
            devDependencies: {
                husky: '^5.0.9',
                'lint-staged': '^10.5.4',
            },
            husky: {
                hooks: {
                    'pre-commit': 'lint-staged',
                },
            },
            'lint-staged': {
                'src/**/*.{js,jsx,vue}': 'eslint --fix',
            },
        })
    }

    if (lintOn.includes('save')) {
        generator.extendPackage({
            devDependencies: {
                'eslint-loader': '^4.0.2',
            },
        })
    }
}
