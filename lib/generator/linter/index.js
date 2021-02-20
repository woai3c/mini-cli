const map = {
    airbnb: {
        'eslint-config-airbnb-base': '^14.2.1',
        'eslint-plugin-import': '^2.22.1',
    },
    standard: {
        'eslint-config-standard': '^16.0.2',
        'eslint-plugin-import': '^2.22.1',
        'eslint-plugin-node': '^11.1.0',
        'eslint-plugin-promise': '^4.3.1',
    },
}

module.exports = (generator, { lintOn, eslintConfig }) => {
    generator.render('./template', {
        hasAirbnb: eslintConfig == 'airbnb',
    })

    generator.extendPackage({
        scripts: {
            lint: 'eslint --ext .js,.jsx,.vue src/',
        },
        devDependencies: {
            'babel-eslint': '^10.1.0',
            eslint: '^7.20.0',
            'eslint-plugin-vue': '^7.6.0',
            ...map[eslintConfig],
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
