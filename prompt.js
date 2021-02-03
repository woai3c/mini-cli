const inquirer = require('inquirer')
const fs = require('fs-extra')
const path = require('path')

async function prompt(name, options) {
    const answers = await inquirer.prompt([{
        name: 'features',
        type: 'checkbox',
        message: '请选择要使用的功能',
        choices: [
            { 'name': 'eslint', value: 'eslint' },
            { 'name': 'babel', value: 'babel' },
            { 'name': 'TypeScript', value: 'ts' },
            { 'name': 'vueRouter', value: 'router' },
            { 'name': 'vuex', value: 'vuex' },
            { 'name': 'cssPreprocessor', value: 'css' },
            { 'name': 'unitTest', value: 'unit' },
        ]
    }])

    const pkg = {
        name,
        version: '0.1.0',
        devDependencies: {}
    }

    answers.features.forEach(feature => {
        pkg.devDependencies[feature] = '0.1.0'
    })

    fs.ensureDirSync(path.join(process.cwd(), name))
    fs.writeFileSync(path.join(process.cwd(), name, 'package.json'), JSON.stringify(pkg, null, 2))
}

module.exports = prompt